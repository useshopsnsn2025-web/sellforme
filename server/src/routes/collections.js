const router = require('express').Router()
const Collection = require('../models/Collection')
const Product = require('../models/Product')
const { apiResponse } = require('../utils/helper')

// List all collections
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.find({ published: true }).sort({ sort_weight: -1, title: 1 })
    apiResponse(res, 200, 'ok', { collections })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Get collection by handle with its products
router.get('/:handle', async (req, res) => {
  try {
    const collection = await Collection.findOne({ handle: req.params.handle, published: true })
    if (!collection) return apiResponse(res, 404, '分类不存在')

    const { page = 1, limit = 12, sort = '-createdAt' } = req.query
    const query = { collections: collection._id, status: 'active' }

    let sortObj = {}
    switch (sort) {
      case 'price-asc': sortObj = { price: 1 }; break
      case 'price-desc': sortObj = { price: -1 }; break
      case 'alpha-asc': sortObj = { title: 1 }; break
      case 'alpha-desc': sortObj = { title: -1 }; break
      default: sortObj = { createdAt: -1 }
    }

    const total = await Product.countDocuments(query)
    const products = await Product.find(query)
      .select('-body_html -variants -options')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(Number(limit))

    apiResponse(res, 200, 'ok', {
      collection,
      products,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
    })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
