const router = require('express').Router()
const Collection = require('../models/Collection')
const Product = require('../models/Product')
const { apiResponse, escapeRegex, safePagination } = require('../utils/helper')
const { adminAuth } = require('../middleware/auth')

router.use(adminAuth)

// List collections
router.get('/', async (req, res) => {
  try {
    const { search } = req.query
    const { page, limit, skip } = safePagination(req.query)
    const query = {}
    if (search) query.title = { $regex: escapeRegex(search), $options: 'i' }

    const total = await Collection.countDocuments(query)
    const collections = await Collection.find(query).sort({ sort_weight: -1, createdAt: -1 }).skip(skip).limit(limit)

    apiResponse(res, 200, 'ok', { collections, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Get single collection
router.get('/:id', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
    if (!collection) return apiResponse(res, 404, '分类不存在')
    apiResponse(res, 200, 'ok', { collection })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Create collection
router.post('/', async (req, res) => {
  try {
    const data = req.body
    if (!data.handle) data.handle = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const collection = await Collection.create(data)
    apiResponse(res, 200, 'ok', { collection })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Update collection
router.put('/:id', async (req, res) => {
  try {
    const collection = await Collection.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!collection) return apiResponse(res, 404, '分类不存在')
    apiResponse(res, 200, 'ok', { collection })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Batch update sort weights
router.put('/batch/sort', async (req, res) => {
  try {
    const { items } = req.body // [{ id, sort_weight }]
    if (!Array.isArray(items)) return apiResponse(res, 400, '参数错误')
    const ops = items.map(item => ({
      updateOne: { filter: { _id: item.id }, update: { sort_weight: item.sort_weight } }
    }))
    await Collection.bulkWrite(ops)
    apiResponse(res, 200, '排序更新成功')
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Delete collection
router.delete('/:id', async (req, res) => {
  try {
    const collection = await Collection.findByIdAndDelete(req.params.id)
    if (!collection) return apiResponse(res, 404, '分类不存在')
    // Remove collection reference from products
    await Product.updateMany({ collections: req.params.id }, { $pull: { collections: req.params.id } })
    apiResponse(res, 200, '删除成功')
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
