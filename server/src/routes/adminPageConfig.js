const router = require('express').Router()
const PageConfig = require('../models/PageConfig')
const { apiResponse } = require('../utils/helper')
const { adminAuth } = require('../middleware/auth')

router.use(adminAuth)

const PAGES = [
  { key: 'home', label: '首页' },
  { key: 'product_detail', label: '产品详情页' },
  { key: 'collection', label: '分类页' },
]

// Get all page configs
router.get('/', async (req, res) => {
  try {
    // Auto-init missing pages
    for (const p of PAGES) {
      await PageConfig.findOneAndUpdate(
        { page: p.key },
        { $setOnInsert: { page: p.key, banners: [], config: {} } },
        { upsert: true, new: true }
      )
    }
    const configs = await PageConfig.find({ page: { $in: PAGES.map(p => p.key) } }).sort({ page: 1 })
    apiResponse(res, 200, 'ok', { pages: PAGES, configs })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Get single page config
router.get('/:page', async (req, res) => {
  try {
    const config = await PageConfig.findOne({ page: req.params.page })
    if (!config) return apiResponse(res, 404, '页面配置不存在')
    apiResponse(res, 200, 'ok', { config })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Add banner to a page
router.post('/:page/banners', async (req, res) => {
  try {
    const config = await PageConfig.findOne({ page: req.params.page })
    if (!config) return apiResponse(res, 404, '页面配置不存在')
    config.banners.push(req.body)
    await config.save()
    apiResponse(res, 200, 'ok', { config })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Update a banner
router.put('/:page/banners/:bannerId', async (req, res) => {
  try {
    const config = await PageConfig.findOne({ page: req.params.page })
    if (!config) return apiResponse(res, 404, '页面配置不存在')
    const banner = config.banners.id(req.params.bannerId)
    if (!banner) return apiResponse(res, 404, 'Banner不存在')
    Object.assign(banner, req.body)
    await config.save()
    apiResponse(res, 200, 'ok', { config })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Delete a banner
router.delete('/:page/banners/:bannerId', async (req, res) => {
  try {
    const config = await PageConfig.findOne({ page: req.params.page })
    if (!config) return apiResponse(res, 404, '页面配置不存在')
    config.banners.pull(req.params.bannerId)
    await config.save()
    apiResponse(res, 200, 'ok', { config })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Update page extra config
router.put('/:page/config', async (req, res) => {
  try {
    const config = await PageConfig.findOneAndUpdate(
      { page: req.params.page },
      { config: req.body },
      { new: true }
    )
    if (!config) return apiResponse(res, 404, '页面配置不存在')
    apiResponse(res, 200, 'ok', { config })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
