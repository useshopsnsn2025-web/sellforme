const router = require('express').Router()
const Product = require('../models/Product')
const { apiResponse } = require('../utils/helper')

// List products (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = '-createdAt', collection, search, min_price, max_price, condition } = req.query
    const query = { status: 'active' }

    if (collection) query.collections = collection
    if (condition) query.condition = condition
    if (min_price || max_price) {
      query.price = {}
      if (min_price) query.price.$gte = Number(min_price)
      if (max_price) query.price.$lte = Number(max_price)
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { product_type: { $regex: search, $options: 'i' } }
      ]
    }

    let sortObj = {}
    switch (sort) {
      case 'price-asc': sortObj = { price: 1 }; break
      case 'price-desc': sortObj = { price: -1 }; break
      case 'alpha-asc': sortObj = { title: 1 }; break
      case 'alpha-desc': sortObj = { title: -1 }; break
      case 'date-asc': sortObj = { createdAt: 1 }; break
      case 'date-desc': sortObj = { createdAt: -1 }; break
      case 'best-selling': sortObj = { reviews_count: -1 }; break
      default: sortObj = { createdAt: -1 }
    }

    const total = await Product.countDocuments(query)
    const products = await Product.find(query)
      .select('-body_html -variants -options -seo_title -seo_description -source -source_url')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(Number(limit))

    apiResponse(res, 200, 'ok', {
      products,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
    })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Get single product by handle or product_id
router.get('/:identifier', async (req, res) => {
  try {
    const id = req.params.identifier
    const product = await Product.findOne({
      $or: [{ handle: id }, { product_id: id }, ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : [])]
    }).populate('collections', 'title handle').populate('seller', 'name avatar rating reviews_count sales_count verified')

    if (!product) return apiResponse(res, 404, '产品不存在')
    apiResponse(res, 200, 'ok', { product })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
