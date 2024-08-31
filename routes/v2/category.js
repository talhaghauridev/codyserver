const express = require("express");
const router = express.Router();
const ErrorHandler = require("../../utils/ErrorHandler");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const Course = require("../../models/courseModel");
const Category = require("../../models/category");

// Get all categories
router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const { limit = 5, viewAll } = req.query;

    let categoryQuery = Category.find();

    if (!viewAll) {
      categoryQuery = categoryQuery.limit(limit);
    }
    const categories = await categoryQuery.sort("-courseCount").exec();
    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  })
);

// Create a new category
router.post(
  "/categories",
  asyncHandler(async (req, res, next) => {
    const { name, icon } = req.body;
    if (!name || !icon) {
      return next(new ErrorHandler("Please fill all fields"));
    }
    const category = await Category.create({ name, icon });
    if (!category) {
      return next(
        new ErrorHandler("Error comming while creating the category", 400)
      );
    }
    res.status(201).json({
      success: true,
      message: "Category created successfully",
    });
  })
);

// Update a category
router.put(
  "/categories/:id",
  asyncHandler(async (req, res, next) => {
    const { name, icon } = req.body;
    if (!name || !icon) {
      return next(new ErrorHandler("Please fill all fields"));
    }
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, icon },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      return next(new ErrorHandler("Category not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
    });
  })
);

// Delete a category
router.delete(
  "/categories/:id",
  asyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new ErrorHandler("Category not found", 404));
    }

    // Check if there are courses associated with this category
    const coursesCount = await Course.countDocuments({
      category: req.params.id,
    });
    if (coursesCount > 0) {
      return next(
        new ErrorHandler("Cannot delete category with associated courses", 400)
      );
    }

    await category.remove();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  })
);

// Get category by ID
router.get(
  "/categories/:id",
  asyncHandler(async (req, res, next) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new ErrorHandler("Category not found", 404));
    }
    res.status(200).json({
      success: true,
      category,
    });
  })
);

module.exports = router;
