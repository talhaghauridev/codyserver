const express = require("express");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const Quiz = require("../../models/quizModel");
const ErrorHandler = require("../../utils/ErrorHandler");
const router = express.Router();

// Get all quizzes
router.get(
  "/quizzes",
  asyncHandler(async (req, res) => {
    const { category, difficulty, search, limit = 10, viewAll } = req.query;
    let query = {};

    if (category && category !== "All") {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    let quizQuery = Quiz.find(query)
      .select("title icon info difficulty attempts description tags")
      .sort({ createdAt: -1 });

    if (viewAll !== "true") {
      quizQuery = quizQuery.limit(parseInt(limit));
    }

    const quizzes = await quizQuery;

    res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes,
    });
  })
);

// Get a single quiz
router.get(
  "/quizzes/:id",
  asyncHandler(async (req, res, next) => {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return next(new ErrorHandler("No quiz found with that ID", 404));
    }

    res.status(200).json({
      success: true,
      quiz,
    });
  })
);

// Create a new quiz
router.post(
  "/quizzes",
  asyncHandler(async (req, res) => {
    const newQuiz = await Quiz.create(req.body);

    res.status(201).json({
      success: true,
      quiz: newQuiz,
    });
  })
);

// Update a quiz
router.patch(
  "/quizzes/:id",
  asyncHandler(async (req, res, next) => {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!quiz) {
      return next(new ErrorHandler("No quiz found with that ID", 404));
    }

    res.status(200).json({
      success: true,
      quiz,
    });
  })
);

// Delete a quiz
router.delete(
  "/quizzes/:id",
  asyncHandler(async (req, res, next) => {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);

    if (!quiz) {
      return next(new ErrorHandler("No quiz found with that ID", 404));
    }

    res.status(204).json({
      success: true,
      data: null,
    });
  })
);

module.exports = router;
