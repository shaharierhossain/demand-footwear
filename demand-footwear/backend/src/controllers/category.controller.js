const prisma = require("../services/prisma");

async function listCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({ include: { _count: { select: { products: true } } } });
    res.json(categories);
  } catch (err) { next(err); }
}

async function createCategory(req, res, next) {
  try {
    const { name, slug, description, imageUrl } = req.body;
    const category = await prisma.category.create({ data: { name, slug, description, imageUrl } });
    res.status(201).json(category);
  } catch (err) { next(err); }
}

async function updateCategory(req, res, next) {
  try {
    const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    res.json(category);
  } catch (err) { next(err); }
}

async function deleteCategory(req, res, next) {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
