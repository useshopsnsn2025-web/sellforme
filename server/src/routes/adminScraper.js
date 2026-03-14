const router = require('express').Router()
const Product = require('../models/Product')
const Collection = require('../models/Collection')
const Seller = require('../models/Seller')
const { apiResponse, generateProductId } = require('../utils/helper')
const { adminAuth } = require('../middleware/auth')
const scraper = require('../utils/scraper')

// Helper: find or create seller, returns ObjectId
async function findOrCreateSeller(sellerData) {
  if (!sellerData || !sellerData.name) return null
  let seller = await Seller.findOne({ name: sellerData.name })
  if (seller) {
    // Update with latest stats
    await Seller.updateOne({ _id: seller._id }, {
      $set: {
        avatar: sellerData.avatar || seller.avatar,
        rating: sellerData.rating || seller.rating,
        reviews_count: Math.max(sellerData.reviews_count || 0, seller.reviews_count),
        sales_count: Math.max(sellerData.sales_count || 0, seller.sales_count),
        verified: sellerData.verified || seller.verified
      },
      $inc: { products_count: 1 }
    })
    return seller._id
  }
  seller = await Seller.create({
    name: sellerData.name,
    avatar: sellerData.avatar || '',
    rating: sellerData.rating || 0,
    reviews_count: sellerData.reviews_count || 0,
    sales_count: sellerData.sales_count || 0,
    verified: sellerData.verified || false,
    products_count: 1,
    source: 'scraped'
  })
  return seller._id
}

router.use(adminAuth)

// ======= One-click scrape =======
router.post('/start', async (req, res) => {
  if (scraper.state.running) return apiResponse(res, 400, '采集任务正在运行中，请等待完成')

  const maxPages = Number(req.body?.maxPages) || 50

  scraper.state.running = true
  scraper.state.logs = []
  scraper.state.result = null
  scraper.updateProgress('init', 0, 1, '准备启动采集...')
  apiResponse(res, 200, '采集任务已启动')

  // Run in background
  ;(async () => {
    try {
      scraper.log(`开始一键采集 pypipi.com (最多 ${maxPages} 页)...`)
      const data = await scraper.scrapeAll(maxPages)

      // Save collections
      scraper.log(`保存 ${data.collections.length} 个分类...`)
      scraper.updateProgress('saving', 0, 1, '正在保存分类...')
      let colImported = 0, colSkipped = 0
      for (const item of data.collections) {
        const exists = await Collection.findOne({ handle: item.handle })
        if (exists) { colSkipped++; continue }
        await Collection.create({
          title: item.title, handle: item.handle, description: item.description || '',
          image: item.image || {}, products_count: item.products_count || 0,
          source: 'scraped', source_url: item.source_url || ''
        })
        colImported++
      }
      scraper.log(`分类: 导入 ${colImported}, 跳过 ${colSkipped}`)

      // Build collection handle → ObjectId map for linking products
      const collectionHandleMap = {}
      const allCols = await Collection.find({ source: 'scraped' }).select('handle _id').lean()
      for (const c of allCols) {
        collectionHandleMap[c.handle] = c._id
      }
      scraper.log(`分类映射表: ${Object.keys(collectionHandleMap).length} 个分类可关联`)

      // Save products (with detail fetching for body_html + seller)
      scraper.log(`保存 ${data.products.length} 个产品（同时获取详情+卖家）...`)
      scraper.updateProgress('saving', 0, data.products.length, '正在保存产品...')
      let prodImported = 0, prodSkipped = 0, prodErrors = []
      for (let i = 0; i < data.products.length; i++) {
        if (scraper.state.stopping) { scraper.log('采集已停止'); break }
        const item = data.products[i]
        if ((i + 1) % 10 === 0) scraper.updateProgress('saving', i + 1, data.products.length, `采集详情+保存 ${i + 1}/${data.products.length}`)
        try {
          const existQuery = { $or: [{ handle: item.handle }] }
          if (item.product_id) existQuery.$or.push({ product_id: item.product_id })
          if (item.source_url) existQuery.$or.push({ source_url: item.source_url })
          const exists = await Product.findOne(existQuery)
          if (exists) { prodSkipped++; continue }

          // Fetch product detail page for body_html + seller
          let detail = null
          let sellerId = null
          try {
            detail = await scraper.scrapeProductDetail(item.handle)
            if (detail && detail.seller && detail.seller.name) {
              sellerId = await findOrCreateSeller(detail.seller)
            }
          } catch (e) {
            // detail fetch failed, continue with list data only
          }

          // Resolve collection handles to ObjectIds
          const collectionIds = (item.collection_handles || [])
            .map(h => collectionHandleMap[h])
            .filter(Boolean)

          const productData = {
            product_id: item.product_id || generateProductId(),
            title: item.title || item.handle,
            handle: item.handle,
            body_html: (detail && detail.body_html) || item.body_html || '',
            vendor: item.vendor || 'SellForMe',
            product_type: item.product_type || '',
            tags: (detail && detail.tags) || item.tags || [],
            status: 'active',
            images: (item.images || []).map((img, idx) => ({
              src: typeof img === 'string' ? img : img.src,
              alt: typeof img === 'string' ? '' : (img.alt || ''),
              position: idx
            })),
            featured_image: item.featured_image || item.images?.[0]?.src || '',
            variants: (detail && detail.variants && detail.variants.length > 0) ? detail.variants : (item.variants || [{
              variant_id: 'v' + Date.now() + i, title: 'Default',
              price: item.price || 0, compare_at_price: item.compare_at_price || null, inventory_quantity: 0
            }]),
            options: (detail && detail.options) || [],
            price: item.price || 0,
            compare_at_price: item.compare_at_price || null,
            condition: mapCondition(item.condition),
            condition_description: item.condition || '',
            rating: (detail && detail.rating) || item.rating || 0,
            reviews_count: (detail && detail.reviews_count) || item.reviews_count || 0,
            in_stock: true,
            collections: collectionIds,
            source: 'scraped', source_url: item.source_url || '', scraped_at: new Date()
          }
          if (sellerId) productData.seller = sellerId

          await Product.create(productData)
          prodImported++

          // Rate limit for detail page requests
          await new Promise(r => setTimeout(r, 400))
        } catch (err) {
          prodErrors.push({ handle: item.handle, error: err.message })
        }

        if ((i + 1) % 50 === 0) {
          scraper.log(`保存进度: ${i + 1}/${data.products.length}, 导入: ${prodImported}, 跳过: ${prodSkipped}, 失败: ${prodErrors.length}`)
        }
      }

      scraper.state.result = {
        collections: { imported: colImported, skipped: colSkipped, total: data.collections.length },
        products: { imported: prodImported, skipped: prodSkipped, errors: prodErrors.length, total: data.products.length }
      }
      scraper.log(`采集完成！分类: +${colImported}, 产品: +${prodImported}`)
      scraper.updateProgress('done', 1, 1, '采集完成')
    } catch (err) {
      scraper.log(`采集失败: ${err.message}`)
      scraper.state.result = { error: err.message }
      scraper.updateProgress('error', 0, 1, err.message)
    } finally {
      scraper.state.running = false
      scraper.state.stopping = false
    }
  })()
})

// Poll progress
router.get('/progress', async (req, res) => {
  apiResponse(res, 200, 'ok', {
    running: scraper.state.running,
    progress: scraper.state.progress,
    result: scraper.state.result,
    logs: scraper.state.logs.slice(-50)
  })
})

// Full logs
router.get('/logs', async (req, res) => {
  apiResponse(res, 200, 'ok', { logs: scraper.state.logs })
})

// Stop current task
router.post('/stop', async (req, res) => {
  if (!scraper.state.running) return apiResponse(res, 400, '没有正在运行的任务')
  scraper.state.stopping = true
  scraper.log('收到停止信号，正在停止...')
  apiResponse(res, 200, '正在停止采集任务')
})

// Clear all scraped data
router.post('/clear', async (req, res) => {
  if (scraper.state.running) return apiResponse(res, 400, '采集任务正在运行中，请先停止')
  try {
    const prodResult = await Product.deleteMany({ source: 'scraped' })
    const colResult = await Collection.deleteMany({ source: 'scraped' })
    const sellerResult = await Seller.deleteMany({ source: 'scraped' })
    apiResponse(res, 200, 'ok', {
      deleted_products: prodResult.deletedCount,
      deleted_collections: colResult.deletedCount,
      deleted_sellers: sellerResult.deletedCount
    })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// ======= Enrich existing products (add collections + descriptions) =======
router.post('/enrich', async (req, res) => {
  if (scraper.state.running) return apiResponse(res, 400, '采集任务正在运行中，请等待完成')

  scraper.state.running = true
  scraper.state.logs = []
  scraper.state.result = null
  scraper.updateProgress('init', 0, 1, '准备补充采集...')
  apiResponse(res, 200, '补充采集任务已启动')

  ;(async () => {
    try {
      // Step 1: Build collection mapping by scraping collection pages
      scraper.log('正在获取分类列表并建立产品映射...')
      scraper.updateProgress('collections', 0, 1, '正在获取分类列表...')

      const collectionsHtml = await scraper.fetchPage('https://pypipi.com/collections')
      const rawCollections = await scraper.scrapeCollectionsList(collectionsHtml)
      scraper.log(`发现 ${rawCollections.length} 个分类`)

      // Enrich collections to get product handles
      const productCollectionMap = {} // productHandle → [collectionHandle]
      for (let i = 0; i < rawCollections.length; i++) {
        scraper.updateProgress('collections', i + 1, rawCollections.length, `获取分类产品列表 ${i + 1}/${rawCollections.length}: ${rawCollections[i].handle}`)
        const enriched = await scraper.enrichCollection(rawCollections[i].handle)
        if (enriched && enriched.product_handles) {
          for (const ph of enriched.product_handles) {
            if (!productCollectionMap[ph]) productCollectionMap[ph] = []
            productCollectionMap[ph].push(rawCollections[i].handle)
          }
          scraper.log(`分类 [${enriched.title}] 关联 ${enriched.product_handles.length} 个产品`)
        }
        await new Promise(r => setTimeout(r, 300))
      }
      scraper.log(`产品-分类映射: ${Object.keys(productCollectionMap).length} 个产品有分类`)

      // Step 2: Build handle → ObjectId map
      const collectionHandleMap = {}
      const allCols = await Collection.find({}).select('handle _id').lean()
      for (const c of allCols) {
        collectionHandleMap[c.handle] = c._id
      }

      // Step 3: Get all scraped products that need enrichment
      const products = await Product.find({
        source: 'scraped',
        $or: [
          { body_html: { $in: ['', null] } },
          { body_html: { $exists: false } },
          { collections: { $size: 0 } },
          { collections: { $exists: false } },
          { seller: { $exists: false } },
          { seller: null }
        ]
      }).lean()

      scraper.log(`需要补充的产品: ${products.length} 个`)

      if (products.length === 0) {
        scraper.state.result = { enriched: 0, message: '所有产品已完整，无需补充' }
        scraper.updateProgress('done', 1, 1, '无需补充')
        return
      }

      // Step 4: Enrich each product
      let enriched = 0, failed = 0
      for (let i = 0; i < products.length; i++) {
        if (scraper.state.stopping) {
          scraper.log(`已停止，已处理 ${i}/${products.length}`)
          break
        }
        const product = products[i]
        scraper.updateProgress('enriching', i + 1, products.length, `补充产品 ${i + 1}/${products.length}: ${product.handle}`)

        const updates = {}

        // Add collection links
        const colHandles = productCollectionMap[product.handle] || []
        const colIds = colHandles.map(h => collectionHandleMap[h]).filter(Boolean)
        if (colIds.length > 0 && (!product.collections || product.collections.length === 0)) {
          updates.collections = colIds
        }

        // Fetch product detail for description + seller
        const needsDetail = !product.body_html || product.body_html.trim() === '' || !product.seller
        if (needsDetail) {
          const detail = await scraper.scrapeProductDetail(product.handle)
          if (detail) {
            if (detail.body_html) updates.body_html = detail.body_html
            if (detail.images && detail.images.length > 0 && (!product.images || product.images.length === 0)) {
              updates.images = detail.images
              updates.featured_image = detail.images[0]?.src || ''
            }
            if (detail.tags && detail.tags.length > 0 && (!product.tags || product.tags.length === 0)) {
              updates.tags = detail.tags
            }
            if (detail.variants && detail.variants.length > 0) {
              updates.variants = detail.variants
              updates.options = detail.options || []
            }
            if (detail.rating !== null && detail.rating > 0) updates.rating = detail.rating
            if (detail.reviews_count !== null && detail.reviews_count > 0) updates.reviews_count = detail.reviews_count
            // Save seller info
            if (detail.seller && detail.seller.name) {
              try {
                const sellerId = await findOrCreateSeller(detail.seller)
                if (sellerId) updates.seller = sellerId
              } catch (e) { /* skip seller error */ }
            }
          } else {
            failed++
          }
          await new Promise(r => setTimeout(r, 400))
        }

        if (Object.keys(updates).length > 0) {
          await Product.updateOne({ _id: product._id }, { $set: updates })
          enriched++
        }

        if ((i + 1) % 50 === 0) {
          scraper.log(`补充进度: ${i + 1}/${products.length}, 已更新: ${enriched}, 失败: ${failed}`)
        }
      }

      scraper.state.result = { enriched, failed, total: products.length }
      scraper.log(`补充采集完成！更新: ${enriched}, 失败: ${failed}, 总数: ${products.length}`)
      scraper.updateProgress('done', 1, 1, `补充完成: 更新 ${enriched} 个产品`)
    } catch (err) {
      scraper.log(`补充采集失败: ${err.message}`)
      scraper.state.result = { error: err.message }
      scraper.updateProgress('error', 0, 1, err.message)
    } finally {
      scraper.state.running = false
      scraper.state.stopping = false
    }
  })()
})

// ======= Manual import =======
router.post('/import-products', async (req, res) => {
  try {
    const { products } = req.body
    if (!products?.length) return apiResponse(res, 400, '没有要导入的产品数据')

    let imported = 0, skipped = 0, errors = []
    for (const item of products) {
      try {
        const exists = await Product.findOne({
          $or: [
            { product_id: item.product_id },
            ...(item.source_url ? [{ source_url: item.source_url }] : []),
            ...(item.handle ? [{ handle: item.handle }] : [])
          ]
        })
        if (exists) { skipped++; continue }

        await Product.create({
          product_id: item.product_id || generateProductId(),
          title: item.title,
          handle: item.handle || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          body_html: item.body_html || item.description || '',
          vendor: item.vendor || 'SellForMe',
          product_type: item.product_type || '',
          tags: item.tags || [],
          status: 'active',
          images: (item.images || []).map((img, idx) => ({
            src: typeof img === 'string' ? img : img.src,
            alt: typeof img === 'string' ? '' : (img.alt || ''),
            position: idx
          })),
          featured_image: item.featured_image || (item.images?.[0]?.src || item.images?.[0] || ''),
          variants: item.variants || [{
            variant_id: 'v' + Date.now(), title: 'Default',
            price: item.price || 0, compare_at_price: item.compare_at_price || null,
            inventory_quantity: item.inventory_quantity || 0
          }],
          price: item.price || item.variants?.[0]?.price || 0,
          compare_at_price: item.compare_at_price || item.variants?.[0]?.compare_at_price || null,
          condition: item.condition || 'good',
          condition_description: item.condition_description || '',
          rating: item.rating || 0,
          reviews_count: item.reviews_count || 0,
          in_stock: item.in_stock !== false,
          source: 'scraped', source_url: item.source_url || '', scraped_at: new Date()
        })
        imported++
      } catch (itemErr) {
        errors.push({ product_id: item.product_id, error: itemErr.message })
      }
    }
    apiResponse(res, 200, 'ok', { imported, skipped, errors: errors.length, error_details: errors.slice(0, 10) })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

router.post('/import-collections', async (req, res) => {
  try {
    const { collections } = req.body
    if (!collections?.length) return apiResponse(res, 400, '没有要导入的分类数据')

    let imported = 0, skipped = 0
    for (const item of collections) {
      const exists = await Collection.findOne({ handle: item.handle })
      if (exists) { skipped++; continue }
      await Collection.create({
        title: item.title,
        handle: item.handle || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: item.description || '',
        body_html: item.body_html || '',
        image: item.image || {},
        products_count: item.products_count || 0,
        source: 'scraped', source_url: item.source_url || ''
      })
      imported++
    }
    apiResponse(res, 200, 'ok', { imported, skipped })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

router.get('/stats', async (req, res) => {
  try {
    const scrapedProducts = await Product.countDocuments({ source: 'scraped' })
    const manualProducts = await Product.countDocuments({ source: 'manual' })
    const scrapedCollections = await Collection.countDocuments({ source: 'scraped' })
    const scrapedSellers = await Seller.countDocuments({ source: 'scraped' })

    apiResponse(res, 200, 'ok', {
      scraped_products: scrapedProducts,
      manual_products: manualProducts,
      scraped_collections: scrapedCollections,
      scraped_sellers: scrapedSellers,
      last_scrape: await Product.findOne({ source: 'scraped' }).sort('-scraped_at').select('scraped_at').lean(),
      running: scraper.state.running
    })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

function mapCondition(text) {
  if (!text) return 'good'
  const t = text.toLowerCase()
  if (t.includes('new') && !t.includes('like')) return 'new'
  if (t.includes('like new') || t.includes('like-new') || t.includes('excellent')) return 'like-new'
  if (t.includes('good')) return 'good'
  if (t.includes('fair') || t.includes('acceptable')) return 'fair'
  if (t.includes('poor')) return 'poor'
  return 'good'
}

module.exports = router
