import express from 'express'
import { createCustomCategory, deleteCustomCategory, getAllCustomCategories, getCustomCategory, updateCustomCategory } from '../controllers/customCategoryController.js'
import { protect, requireAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Reads are public — the listing pages render the category list for visitors.
// Writes are admin-only, like every other content route in this portal.
router.post('/create-category', protect, requireAdmin, createCustomCategory)
router.get('/', getAllCustomCategories)
router.get('/:id',getCustomCategory)
router.post("/update-category/:id", protect, requireAdmin, updateCustomCategory)
router.delete('/:id', protect, requireAdmin, deleteCustomCategory)
export default router
