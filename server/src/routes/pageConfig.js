const router = require('express').Router()
const PageConfig = require('../models/PageConfig')
const { apiResponse } = require('../utils/helper')

// Get page config by page key (public)
router.get('/:page', async (req, res) => {
  try {
    const config = await PageConfig.findOne({ page: req.params.page })
    if (!config) return apiResponse(res, 200, 'ok', { banners: [], config: {} })
    // Only return enabled banners, sorted by weight
    const banners = config.banners
      .filter(b => b.enabled)
      .sort((a, b) => (b.sort_weight || 0) - (a.sort_weight || 0))
    apiResponse(res, 200, 'ok', { banners, config: config.config || {} })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
