const router = require('express').Router()
const upload = require('../middleware/upload')
const Image = require('../models/Image')
const { apiResponse, escapeRegex, safePagination } = require('../utils/helper')
const { adminAuth } = require('../middleware/auth')

router.use(adminAuth)

// List images with group filter, search, pagination
router.get('/', async (req, res) => {
  try {
    const { group, search } = req.query
    const { page, limit, skip } = safePagination(req.query)
    const query = {}
    if (group) query.group = group
    if (search) query.name = { $regex: escapeRegex(search), $options: 'i' }

    const total = await Image.countDocuments(query)
    const images = await Image.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Get group stats
    const groups = await Image.aggregate([
      { $group: { _id: '$group', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])

    apiResponse(res, 200, 'ok', {
      images,
      groups: groups.map(g => ({ name: g._id, count: g.count })),
      total,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Upload single image and save to library
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return apiResponse(res, 400, '请选择图片文件')
    const url = `/uploads/${req.file.filename}`
    const image = await Image.create({
      url,
      name: req.body.name || req.file.originalname,
      group: req.body.group || '默认分组',
      size: req.file.size,
      mime: req.file.mimetype,
      is_external: false,
    })
    apiResponse(res, 200, 'ok', { image })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Add external URL to library
router.post('/external', async (req, res) => {
  try {
    const { url, name, group } = req.body
    if (!url) return apiResponse(res, 400, '请输入图片 URL')
    const image = await Image.create({
      url,
      name: name || url.split('/').pop() || 'external',
      group: group || '默认分组',
      is_external: true,
    })
    apiResponse(res, 200, 'ok', { image })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Update image (name, group)
router.put('/:id', async (req, res) => {
  try {
    const image = await Image.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!image) return apiResponse(res, 404, '图片不存在')
    apiResponse(res, 200, 'ok', { image })
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Delete image
router.delete('/:id', async (req, res) => {
  try {
    const image = await Image.findByIdAndDelete(req.params.id)
    if (!image) return apiResponse(res, 404, '图片不存在')
    // Optionally delete file from disk (skip for external)
    if (!image.is_external) {
      const fs = require('fs')
      const path = require('path')
      const filePath = path.join(__dirname, '../../uploads', image.url.replace('/uploads/', ''))
      fs.unlink(filePath, () => {})
    }
    apiResponse(res, 200, '删除成功')
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Batch delete
router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || !ids.length) return apiResponse(res, 400, '参数错误')
    await Image.deleteMany({ _id: { $in: ids } })
    apiResponse(res, 200, '删除成功')
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

// Create/rename group
router.put('/group/rename', async (req, res) => {
  try {
    const { oldName, newName } = req.body
    if (!oldName || !newName) return apiResponse(res, 400, '参数错误')
    await Image.updateMany({ group: oldName }, { group: newName })
    apiResponse(res, 200, '分组重命名成功')
  } catch (err) {
    apiResponse(res, 500, err.message)
  }
})

module.exports = router
