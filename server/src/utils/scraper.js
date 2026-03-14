const https = require('https')
const http = require('http')

// Scraper state
const state = {
  running: false,
  stopping: false,
  progress: { step: '', current: 0, total: 0, message: '' },
  logs: [],
  result: null
}

function log(msg) {
  const entry = `[${new Date().toLocaleTimeString()}] ${msg}`
  state.logs.push(entry)
  if (state.logs.length > 500) state.logs.shift()
  console.log('[Scraper]', msg)
}

function updateProgress(step, current, total, message) {
  state.progress = { step, current, total, message }
}

/**
 * Fetch a URL and return the HTML body as string
 */
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, res => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject)
      }
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Request timeout')) })
  })
}

/**
 * Extract window._AHFBADD_ array from HTML and decode element[3] (page data)
 * Data is: base64 → decodeURIComponent → JSON
 */
function extractPageData(html) {
  // Find the variable name: window._pypipicom_ = "_AHFBADD_"
  const varNameMatch = html.match(/window\._pypipicom_\s*=\s*["'](_\w+_)["']/)
  const varName = varNameMatch ? varNameMatch[1] : '_AHFBADD_'

  // Find window._AHFBADD_ = [...] using bracket matching
  const marker = `window.${varName} = [`
  const idx = html.indexOf(marker)
  if (idx === -1) return null

  const start = html.indexOf('[', idx)
  let depth = 0, end = start
  for (let i = start; i < Math.min(start + 600000, html.length); i++) {
    if (html[i] === '[') depth++
    if (html[i] === ']') { depth--; if (depth === 0) { end = i; break } }
  }
  const arrStr = html.substring(start, end + 1)

  // Parse the array elements (base64 strings in quotes)
  const elements = []
  const strRegex = /"([^"]+)"/g
  let m
  while ((m = strRegex.exec(arrStr)) !== null) {
    elements.push(m[1])
  }

  if (elements.length < 4) return null

  // Decode each element: base64 → decodeURIComponent → JSON
  const decoded = []
  for (let i = 0; i < elements.length; i++) {
    try {
      const b64decoded = Buffer.from(elements[i], 'base64').toString('utf-8')
      const urlDecoded = decodeURIComponent(b64decoded)
      decoded.push(JSON.parse(urlDecoded))
    } catch (e) {
      decoded.push(null)
    }
  }

  return decoded
}

/**
 * Scrape collections from pypipi.com/collections page
 */
async function scrapeCollectionsList(html) {
  const collections = []

  // Extract collection links from HTML
  // Pattern: href="/collections/some-handle"
  const linkRegex = /href=["']\/collections\/([a-z0-9][a-z0-9-]*)["']/gi
  const seen = new Set()
  let m
  while ((m = linkRegex.exec(html)) !== null) {
    const handle = m[1]
    if (handle === 'all' || seen.has(handle)) continue
    seen.add(handle)
    collections.push({ handle })
  }

  // Also try to extract from page data
  const data = extractPageData(html)
  if (data && data[3]) {
    const pageData = data[3]
    // Look for collection list data in various possible keys
    const possibleKeys = ['collections', 'collection_list', 'list', 'data']
    for (const key of possibleKeys) {
      if (Array.isArray(pageData[key])) {
        for (const col of pageData[key]) {
          if (col.handle && !seen.has(col.handle)) {
            seen.add(col.handle)
            collections.push({
              handle: col.handle,
              title: col.title || '',
              image: col.image ? { src: col.image.src || col.image, alt: col.image.alt || '' } : {},
              products_count: col.products_count || 0
            })
          }
        }
      }
    }
  }

  return collections
}

/**
 * Enrich collection data by visiting individual collection pages
 */
async function enrichCollection(handle) {
  try {
    const html = await fetchPage(`https://pypipi.com/collections/${handle}`)
    const data = extractPageData(html)
    if (!data || !data[3]) return null

    const pageData = data[3]
    const collection = pageData.collection || {}

    // Extract product handles from first page
    const productHandles = new Set(
      (collection.products || []).map(p => p.handle).filter(Boolean)
    )

    // Paginate through remaining pages to get all product handles
    const totalProducts = collection.all_products_count || collection.products_count || 0
    const perPage = (collection.products || []).length || 12
    const totalPages = Math.ceil(totalProducts / perPage)

    if (totalPages > 1) {
      for (let page = 2; page <= totalPages; page++) {
        try {
          const pageHtml = await fetchPage(`https://pypipi.com/collections/${handle}?page=${page}`)
          const pageDataN = extractPageData(pageHtml)
          if (pageDataN && pageDataN[3]) {
            const prods = pageDataN[3].collection?.products || []
            for (const p of prods) {
              if (p.handle) productHandles.add(p.handle)
            }
          }
          await new Promise(r => setTimeout(r, 300))
        } catch {
          // Skip failed pages
        }
      }
    }

    return {
      handle,
      title: decodeText(collection.title) || handle.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: decodeText(collection.top_descript || collection.description || ''),
      body_html: decodeText(collection.bottom_descript || collection.body_html || ''),
      image: collection.src ? { src: buildImageUrl({ oss_bucket: collection.src }), alt: '' } : (collection.image ? { src: buildImageUrl(collection.image), alt: '' } : {}),
      products_count: totalProducts,
      product_handles: [...productHandles],
      source_url: `https://pypipi.com/collections/${handle}`
    }
  } catch {
    return {
      handle,
      title: handle.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      product_handles: [],
      source_url: `https://pypipi.com/collections/${handle}`
    }
  }
}

/**
 * Parse product data from the decoded page data
 */
const CDN_BASE = 'https://cdn.mardovocontent.com'

/**
 * Build full image URL from image object
 */
function buildImageUrl(img) {
  if (!img) return ''
  // img may have oss_bucket like "uploads/191353/cart/resources/20250529/xxx.jpg"
  if (img.oss_bucket) return `${CDN_BASE}/${img.oss_bucket}`
  if (img.src && img.src.startsWith('http')) return img.src
  if (img.src) return `${CDN_BASE}/${img.src}`
  if (typeof img === 'string') return img.startsWith('http') ? img : `${CDN_BASE}/${img}`
  return ''
}

/**
 * Decode URL-encoded text: "Nintendo+Switch+OLED" → "Nintendo Switch OLED"
 */
function decodeText(text) {
  if (!text) return ''
  try {
    return decodeURIComponent(text.replace(/\+/g, ' '))
  } catch {
    return text.replace(/\+/g, ' ')
  }
}

function parseProducts(pageData) {
  const collection = pageData.collection || {}
  const products = collection.products || []

  return products.map(p => {
    const variant = p.variants?.[0] || {}
    const images = (p.images || []).map((img, idx) => ({
      src: buildImageUrl(img),
      alt: decodeText(img.alt || ''),
      width: img.width || 0,
      height: img.height || 0,
      position: idx
    }))

    // Also include main image if not in images array
    const mainImage = p.image ? buildImageUrl(p.image) : ''
    if (mainImage && images.length === 0) {
      images.push({ src: mainImage, alt: '', position: 0 })
    }

    const comparePrice = parseFloat(p.variant_compare_at_price_min) || 0

    return {
      product_id: p.handle || (p.id ? ('m' + p.id) : null),  // handle IS the product_id (m40016936905)
      title: decodeText(p.title),
      handle: p.handle || '',
      body_html: decodeText(p.body_html || p.description || ''),
      vendor: decodeText(p.vendor) || 'SellForMe',
      product_type: decodeText(p.product_type) || '',
      tags: Array.isArray(p.tags) ? p.tags.map(decodeText) : [],
      images,
      featured_image: images[0]?.src || mainImage,
      variants: (p.variants || []).map(v => ({
        variant_id: v.id ? ('v' + v.id) : ('v' + Date.now()),
        title: decodeText(v.title) || 'Default',
        price: parseFloat(v.price) || 0,
        compare_at_price: parseFloat(v.compare_at_price) || null,
        sku: v.sku || v.sku_code || '',
        inventory_quantity: v.inventory_quantity || 0,
        weight: v.weight || 0,
        weight_unit: v.weight_unit || 'kg',
        option1: v.option1_value_title || v.option1?.value || null,
        option2: v.option2_value_title || v.option2?.value || null,
        option3: v.option3_value_title || v.option3?.value || null,
        requires_shipping: true,
        available: v.available === 1 || v.available === true
      })),
      options: (p.options || []).map((opt, idx) => ({
        name: decodeText(opt.name || opt),
        position: idx + 1,
        values: (opt.values || []).map(decodeText)
      })),
      price: parseFloat(p.variant_price_min || variant.price) || 0,
      compare_at_price: comparePrice > 0 ? comparePrice : null,
      in_stock: p.available === 1 || p.available === true,
      total_inventory: p.inventory_quantity || 0,
      rating: parseFloat(p.comment_star) || 0,
      reviews_count: parseInt(p.comment_count) || 0,
      collections: Array.isArray(p.collections) ? p.collections : [],
      source_url: `https://pypipi.com/products/${p.handle}`,
      source: 'scraped',
      scraped_at: new Date()
    }
  })
}

/**
 * Main scrape function: fetch all collections and products
 */
async function scrapeAll(maxPages = 50) {
  // Step 1: Get collections
  log('正在获取分类列表...')
  updateProgress('collections', 0, 1, '正在获取分类列表...')

  const collectionsHtml = await fetchPage('https://pypipi.com/collections')
  const rawCollections = await scrapeCollectionsList(collectionsHtml)
  log(`发现 ${rawCollections.length} 个分类 handle`)

  // Enrich each collection
  const collections = []
  for (let i = 0; i < rawCollections.length; i++) {
    if (state.stopping) { log('采集已停止'); break }
    updateProgress('collections', i + 1, rawCollections.length, `正在获取分类详情 ${i + 1}/${rawCollections.length}: ${rawCollections[i].handle}`)
    const enriched = await enrichCollection(rawCollections[i].handle)
    if (enriched) {
      collections.push({ ...rawCollections[i], ...enriched })
      log(`分类 [${enriched.title}] 产品数: ${enriched.products_count || '?'}, 已关联: ${enriched.product_handles?.length || 0}`)
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300))
  }

  log(`共获取 ${collections.length} 个分类`)

  // Build product handle → collection handles mapping
  const productCollectionMap = {}  // { productHandle: [collectionHandle1, collectionHandle2, ...] }
  for (const col of collections) {
    for (const ph of (col.product_handles || [])) {
      if (!productCollectionMap[ph]) productCollectionMap[ph] = []
      productCollectionMap[ph].push(col.handle)
    }
  }
  log(`建立产品-分类映射: ${Object.keys(productCollectionMap).length} 个产品有分类归属`)

  // Step 2: Get products from /collections/all with pagination
  log('正在获取产品列表...')
  updateProgress('products', 0, 1, '正在获取产品列表...')

  // First page to get total count
  const firstPageHtml = await fetchPage('https://pypipi.com/collections/all?page=1')
  const firstPageData = extractPageData(firstPageHtml)

  if (!firstPageData || !firstPageData[3]) {
    throw new Error('无法解析页面数据，网站结构可能已变更')
  }

  const totalProducts = firstPageData[3].collection?.all_products_count || 0
  const perPage = firstPageData[3].collection?.products?.length || 12
  const totalPages = Math.min(Math.ceil(totalProducts / perPage), maxPages)

  log(`总产品数: ${totalProducts}, 每页: ${perPage}, 总页数: ${Math.ceil(totalProducts / perPage)}, 采集页数: ${totalPages}`)

  // Parse first page products
  let allProducts = parseProducts(firstPageData[3])
  log(`第 1 页获取 ${allProducts.length} 个产品`)

  // Fetch remaining pages
  for (let page = 2; page <= totalPages; page++) {
    if (state.stopping) { log('采集已停止'); break }
    updateProgress('products', page, totalPages, `正在采集第 ${page}/${totalPages} 页产品...`)

    try {
      const html = await fetchPage(`https://pypipi.com/collections/all?page=${page}`)
      const pageData = extractPageData(html)

      if (pageData && pageData[3]) {
        const products = parseProducts(pageData[3])
        allProducts.push(...products)
        if (page % 10 === 0 || page === totalPages) {
          log(`第 ${page} 页完成, 本页 ${products.length} 个, 累计 ${allProducts.length} 个`)
        }
      } else {
        log(`第 ${page} 页解析失败，跳过`)
      }
    } catch (err) {
      log(`第 ${page} 页获取失败: ${err.message}`)
    }

    // Delay between requests
    await new Promise(r => setTimeout(r, 500))
  }

  log(`产品采集完成，共 ${allProducts.length} 个`)

  // Attach collection handles to each product
  for (const product of allProducts) {
    const mapped = productCollectionMap[product.handle] || []
    // Merge with any collections already in the product data
    const existing = Array.isArray(product.collection_handles) ? product.collection_handles : []
    product.collection_handles = [...new Set([...mapped, ...existing])]
  }

  const withCollections = allProducts.filter(p => p.collection_handles.length > 0).length
  log(`${withCollections} 个产品已关联分类`)

  return { collections, products: allProducts }
}

/**
 * Parse seller info from body_html
 * Structure: .cs-hdr contains avatar img, seller name in bold span, and stats line
 */
function parseSellerFromBodyHtml(bodyHtml) {
  if (!bodyHtml) return null

  // Extract seller name: <b><span ...>Name</span></b>
  const nameMatch = bodyHtml.match(/cs-hdrname[\s\S]*?<b[^>]*><span[^>]*>([^<]+)<\/span><\/b>/i)
    || bodyHtml.match(/cs-hdrname[\s\S]*?font-weight:\s*bold[^>]*>([^<]+)</i)
  if (!nameMatch) return null

  const name = nameMatch[1].trim()
  if (!name) return null

  // Extract avatar
  const avatarMatch = bodyHtml.match(/cs-hdr[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/)
  const avatar = avatarMatch ? avatarMatch[1] : ''

  // Extract star count (count SVG star icons with fill color)
  const starSection = bodyHtml.match(/cs-hdrstarcontainer[\s\S]*?<\/div>/i)
  let starCount = 0
  if (starSection) {
    const stars = starSection[0].match(/<svg[^>]*>[\s\S]*?<\/svg>/gi)
    starCount = stars ? stars.length : 0
  }

  // Extract verified status
  const verified = /verified\s*user/i.test(bodyHtml)

  // Extract reviews count
  const reviewsMatch = bodyHtml.match(/(\d+)\s*reviews?/i)
  const reviewsCount = reviewsMatch ? parseInt(reviewsMatch[1]) : 0

  // Extract sales count
  const salesMatch = bodyHtml.match(/(\d+)\s*sales?/i)
  const salesCount = salesMatch ? parseInt(salesMatch[1]) : 0

  // Extract pure description (content after cs-hdr, inside cs-desccontainer)
  const descMatch = bodyHtml.match(/cs-desccontainer[\s\S]*?<div>([\s\S]*?)<\/div>\s*<\/div>/i)
  const description = descMatch ? descMatch[1].trim() : ''

  return {
    seller: { name, avatar, rating: starCount, reviews_count: reviewsCount, sales_count: salesCount, verified },
    description
  }
}

/**
 * Fetch product detail page to get full description, images, etc.
 */
async function scrapeProductDetail(handle) {
  try {
    const html = await fetchPage(`https://pypipi.com/products/${handle}`)
    const data = extractPageData(html)
    if (!data || !data[3]) return null

    const pageData = data[3]
    const product = pageData.product || {}

    const images = (product.images || []).map((img, idx) => ({
      src: buildImageUrl(img),
      alt: decodeText(img.alt || ''),
      width: img.width || 0,
      height: img.height || 0,
      position: idx
    }))

    const rawBodyHtml = decodeText(product.body_html || product.description || '')

    // Parse seller info from body_html
    const parsed = parseSellerFromBodyHtml(rawBodyHtml)

    return {
      body_html: rawBodyHtml,
      seller: parsed ? parsed.seller : null,
      product_description: parsed ? parsed.description : rawBodyHtml,
      images: images.length > 0 ? images : null,
      variants: (product.variants || []).map(v => ({
        variant_id: v.id ? ('v' + v.id) : null,
        title: decodeText(v.title) || 'Default',
        price: parseFloat(v.price) || 0,
        compare_at_price: parseFloat(v.compare_at_price) || null,
        sku: v.sku || v.sku_code || '',
        inventory_quantity: v.inventory_quantity || 0,
        weight: v.weight || 0,
        weight_unit: v.weight_unit || 'kg',
        option1: v.option1_value_title || v.option1?.value || null,
        option2: v.option2_value_title || v.option2?.value || null,
        option3: v.option3_value_title || v.option3?.value || null,
        requires_shipping: true,
        available: v.available === 1 || v.available === true
      })),
      options: (product.options || []).map((opt, idx) => ({
        name: decodeText(opt.name || opt),
        position: idx + 1,
        values: (opt.values || []).map(decodeText)
      })),
      tags: Array.isArray(product.tags) ? product.tags.map(decodeText) : null,
      rating: parseFloat(product.comment_star) || null,
      reviews_count: parseInt(product.comment_count) || null
    }
  } catch {
    return null
  }
}

/**
 * Enrich existing products: add collection links + fetch product descriptions
 * This is meant to run on already-scraped products in the database
 */
async function enrichExistingProducts(products, collectionHandleMap, productCollectionMap) {
  let updated = 0, failed = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    updateProgress('enriching', i + 1, products.length, `补充产品详情 ${i + 1}/${products.length}: ${product.handle}`)

    const updates = {}

    // 1. Add collection links
    const colHandles = productCollectionMap[product.handle] || []
    const colIds = colHandles.map(h => collectionHandleMap[h]).filter(Boolean)
    if (colIds.length > 0 && (!product.collections || product.collections.length === 0)) {
      updates.collections = colIds
    }

    // 2. Fetch product detail for description
    if (!product.body_html || product.body_html.trim() === '') {
      const detail = await scrapeProductDetail(product.handle)
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
        if (detail.rating !== null) updates.rating = detail.rating
        if (detail.reviews_count !== null) updates.reviews_count = detail.reviews_count
      } else {
        failed++
      }
      // Rate limit
      await new Promise(r => setTimeout(r, 400))
    }

    if (Object.keys(updates).length > 0) {
      // Return updates for the caller to apply to DB
      product._updates = updates
      updated++
    }

    if ((i + 1) % 50 === 0) {
      log(`补充进度: ${i + 1}/${products.length}, 更新: ${updated}, 失败: ${failed}`)
    }
  }

  log(`补充完成: 共 ${products.length} 个产品, 更新: ${updated}, 详情获取失败: ${failed}`)
  return { updated, failed }
}

module.exports = { state, log, updateProgress, scrapeAll, scrapeProductDetail, enrichExistingProducts, enrichCollection, scrapeCollectionsList, fetchPage, extractPageData, buildImageUrl, decodeText }
