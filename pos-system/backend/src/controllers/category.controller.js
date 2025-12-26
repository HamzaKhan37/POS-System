const Category = require('../models/Category')

exports.createCategory = async (req, res, next) => { try { const c = await Category.create(req.body); res.status(201).json(c) } catch (err) { next(err) } }
exports.getCategories = async (req, res, next) => { try { const c = await Category.find().sort('name'); res.json(c) } catch (err) { next(err) } }
exports.updateCategory = async (req, res, next) => { try { const c = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(c) } catch (err) { next(err) } }
exports.deleteCategory = async (req, res, next) => { try { const Product = require('./../models/Product'); const count = await Product.countDocuments({ category: req.params.id }); if (count > 0) return res.status(400).json({ message: 'Cannot delete category while products exist in this category' }); await Category.findByIdAndDelete(req.params.id); res.json({ ok: true }) } catch (err) { next(err) } }
