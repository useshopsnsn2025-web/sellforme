const router = require('express').Router()
const Product = require('../models/Product')
const User = require('../models/User')
const { apiResponse, generateProductId, escapeRegex, safePagination } = require('../utils/helper')
const { adminAuth } = require('../middleware/auth')
const upload = require('../middleware/upload')
const archiver = require('archiver')
const https = require('https')
const http = require('http')
const sharp = require('sharp')

router.use(adminAuth)

// List products with pagination, search, filter
router.get('/', async (req, res) => {
  try {
    const { search, status, collection } = req.query
    const { page, limit, skip } = safePagination(req.query)
    // Whitelist sort fields
    const allowedSorts = ['-createdAt', 'createdAt', '-price', 'price', '-title', 'title', '-updatedAt']
    const sort = allowedSorts.includes(req.query.sort) ? req.query.sort : '-createdAt'
    const query = {}

    if (search) {
      const s = escapeRegex(search)
      query.$or = [
        { title: { $regex: s, $options: 'i' } },
        { product_id: { $regex: s, $options: 'i' } },
        { tags: { $regex: s, $options: 'i' } }
      ]
    }
    if (status) query.status = status
    if (collection) query.collections = collection

    const total = await Product.countDocuments(query)
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('collections', 'title handle')

    apiResponse(res, 200, 'ok', {
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Helper: download a remote image and return its buffer
function fetchImage(url, retries = 2) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const options = {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/jpeg,image/png,image/webp,image/*;q=0.8,*/*;q=0.5',
        'Referer': url
      }
    }
    client.get(url, options, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        let redirectUrl = response.headers.location
        if (redirectUrl.startsWith('/')) {
          const u = new URL(url)
          redirectUrl = u.origin + redirectUrl
        }
        return fetchImage(redirectUrl, retries).then(resolve).catch(reject)
      }
      if (response.statusCode !== 200) {
        if (retries > 0) return fetchImage(url, retries - 1).then(resolve).catch(reject)
        return reject(new Error(`HTTP ${response.statusCode}`))
      }
      const contentType = response.headers['content-type'] || ''
      if (!contentType.startsWith('image/') && contentType !== 'application/octet-stream') {
        if (retries > 0) return fetchImage(url, retries - 1).then(resolve).catch(reject)
        return reject(new Error(`Not an image: ${contentType}`))
      }
      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => {
        const buf = Buffer.concat(chunks)
        if (buf.length < 100) {
          if (retries > 0) return fetchImage(url, retries - 1).then(resolve).catch(reject)
          return reject(new Error('Image too small'))
        }
        resolve(buf)
      })
      response.on('error', (err) => {
        if (retries > 0) return fetchImage(url, retries - 1).then(resolve).catch(reject)
        reject(err)
      })
    }).on('error', (err) => {
      if (retries > 0) return fetchImage(url, retries - 1).then(resolve).catch(reject)
      reject(err)
    }).on('timeout', function() {
      this.destroy()
      if (retries > 0) return fetchImage(url, retries - 1).then(resolve).catch(reject)
      reject(new Error('Timeout'))
    })
  })
}

// Helper: strip HTML tags to get plain text description
function stripHtml(html) {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Detect real image format from magic bytes
function detectImageExt(buffer) {
  if (!buffer || buffer.length < 12) return 'jpg'
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'jpg'
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'png'
  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'gif'
  // WebP: RIFF....WEBP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return 'webp'
  // AVIF: ....ftypavif
  if (buffer.length > 11 && buffer.slice(4, 12).toString('ascii').startsWith('ftypavif')) return 'avif'
  // HEIF: ....ftyp
  if (buffer.length > 8 && buffer.slice(4, 8).toString('ascii') === 'ftyp') return 'heif'
  // BMP: 42 4D
  if (buffer[0] === 0x42 && buffer[1] === 0x4D) return 'bmp'
  return 'jpg'
}

// Concurrently download images in batches
async function batchFetchImages(imageUrls, concurrency = 10) {
  const results = new Array(imageUrls.length).fill(null)
  let idx = 0
  async function worker() {
    while (idx < imageUrls.length) {
      const i = idx++
      try {
        results[i] = await fetchImage(imageUrls[i])
      } catch {
        results[i] = null
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, imageUrls.length) }, () => worker())
  await Promise.all(workers)
  return results
}

// Download product data as ZIP (by collection)
router.post('/download', async (req, res) => {
  try {
    const { collection, agent_id } = req.body
    if (!collection) return apiResponse(res, 400, '请选择要下载的分类')

    // Disable request timeout for long downloads
    req.setTimeout(0)
    res.setTimeout(0)

    // Determine ref code
    let refCode = ''
    if (req.user.role === 'agent') {
      refCode = req.user.agent_code || ''
    } else if (agent_id) {
      const agent = await User.findOne({ _id: agent_id, role: 'agent' })
      if (agent) refCode = agent.agent_code || ''
    }

    // Fetch all active products in this collection
    const products = await Product.find({ collections: collection, status: 'active' }).lean()
    if (!products.length) return apiResponse(res, 404, '该分类下没有上架产品')

    const siteUrl = process.env.SITE_URL || 'https://www.usedbuyers.shop'

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', 'attachment; filename="products.zip"')
    // Disable buffering for streaming (nginx/reverse proxy)
    res.setHeader('X-Accel-Buffering', 'no')

    const archive = archiver('zip', { zlib: { level: 1 } })
    archive.on('error', (err) => { throw err })
    archive.pipe(res)

    // Process products in batches of 5 to balance memory and speed
    const PRODUCT_BATCH = 5
    for (let p = 0; p < products.length; p += PRODUCT_BATCH) {
      const batch = products.slice(p, p + PRODUCT_BATCH)

      // Collect all image URLs across this batch for concurrent download
      const batchImageTasks = []
      const batchMeta = []

      for (const product of batch) {
        const folder = product.product_id
        const imageUrls = []
        if (product.images?.length) {
          product.images.forEach(img => { if (img.src) imageUrls.push(img.src) })
        } else if (product.featured_image) {
          imageUrls.push(product.featured_image)
        }
        batchMeta.push({ product, folder, imageUrls })
        imageUrls.forEach(url => batchImageTasks.push(url))
      }

      // Download all images in this product batch concurrently (10 concurrent)
      const allBuffers = await batchFetchImages(batchImageTasks, 10)

      // Now append everything to the archive
      let bufferIdx = 0
      for (const { product, folder, imageUrls } of batchMeta) {
        // Text files
        archive.append(product.title || '', { name: `${folder}/标题.txt` })
        archive.append(String(product.price || 0), { name: `${folder}/价格.txt` })
        archive.append(stripHtml(product.body_html), { name: `${folder}/描述.txt` })

        let productUrl = `${siteUrl}/products/${product.product_id}`
        if (refCode) productUrl += `?ref=${refCode}`
        archive.append(productUrl, { name: `${folder}/链接.txt` })

        archive.append(imageUrls.join('\n'), { name: `${folder}/图片.txt` })

        // Image files + dimension txt
        for (let i = 0; i < imageUrls.length; i++) {
          let imgBuffer = allBuffers[bufferIdx++]
          if (imgBuffer) {
            let ext = detectImageExt(imgBuffer)
            // Convert AVIF/HEIF/WebP to JPG for maximum compatibility
            if (ext === 'avif' || ext === 'heif' || ext === 'webp') {
              try {
                imgBuffer = await sharp(imgBuffer).jpeg({ quality: 90 }).toBuffer()
                ext = 'jpg'
              } catch { /* keep original if conversion fails */ }
            }
            archive.append(imgBuffer, { name: `${folder}/${i + 1}.${ext}` })
            const dims = getImageDimensions(imgBuffer)
            archive.append(dims ? `${dims.width} X ${dims.height}` : '', { name: `${folder}/${i + 1}.txt` })
          } else {
            archive.append('', { name: `${folder}/${i + 1}.txt` })
          }
        }
      }
    }

    await archive.finalize()
  } catch (err) {
    if (!res.headersSent) {
      apiResponse(res, 500, err.message)
    }
  }
})

// Basic image dimension reading for JPEG and PNG
function getImageDimensions(buffer) {
  try {
    // PNG: bytes 16-23 contain width and height as 4-byte big-endian
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      const width = buffer.readUInt32BE(16)
      const height = buffer.readUInt32BE(20)
      return { width, height }
    }
    // JPEG: scan for SOF markers (0xFFC0-0xFFC3)
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2
      while (offset < buffer.length - 8) {
        if (buffer[offset] !== 0xFF) { offset++; continue }
        const marker = buffer[offset + 1]
        if (marker >= 0xC0 && marker <= 0xC3) {
          const height = buffer.readUInt16BE(offset + 5)
          const width = buffer.readUInt16BE(offset + 7)
          return { width, height }
        }
        const segLen = buffer.readUInt16BE(offset + 2)
        offset += 2 + segLen
      }
    }
    // WebP: RIFF header
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      if (buffer.toString('ascii', 12, 16) === 'VP8 ') {
        const width = buffer.readUInt16LE(26) & 0x3FFF
        const height = buffer.readUInt16LE(28) & 0x3FFF
        return { width, height }
      }
      if (buffer.toString('ascii', 12, 16) === 'VP8L') {
        const bits = buffer.readUInt32LE(21)
        const width = (bits & 0x3FFF) + 1
        const height = ((bits >> 14) & 0x3FFF) + 1
        return { width, height }
      }
    }
  } catch {}
  return null
}

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('collections', 'title handle')
    if (!product) return apiResponse(res, 404, '产品不存在')
    apiResponse(res, 200, 'ok', { product })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Create product
router.post('/', async (req, res) => {
  try {
    const data = req.body
    if (!data.product_id) data.product_id = generateProductId()
    if (!data.handle) data.handle = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (data.images?.length && !data.featured_image) data.featured_image = data.images[0].src

    const product = await Product.create(data)
    apiResponse(res, 200, 'ok', { product })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!product) return apiResponse(res, 404, '产品不存在')
    apiResponse(res, 200, 'ok', { product })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return apiResponse(res, 404, '产品不存在')
    apiResponse(res, 200, '删除成功')
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Batch delete
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body
    if (!ids?.length) return apiResponse(res, 400, '请选择要删除的产品')
    const result = await Product.deleteMany({ _id: { $in: ids } })
    apiResponse(res, 200, `已删除 ${result.deletedCount} 个产品`)
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Upload product image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return apiResponse(res, 400, '请选择图片')
    const url = `/uploads/${req.file.filename}`
    apiResponse(res, 200, 'ok', { url, filename: req.file.filename })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
