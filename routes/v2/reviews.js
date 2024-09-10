const express = require("express");
const mongoose = require("mongoose");
const Review = require("../../models/reviews");
const Course = require("../../models/courseModel");
const isAuthenticated = require("../../middlewares/auth");
const ErrorHandler = require("../../utils/ErrorHandler");
const asyncHandler = require("../../middlewares/asyncErrorHandler");

const router = express.Router();
const isValidMongoId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper function to validate rating
const isValidRating = (rating) => !isNaN(rating) && rating >= 1 && rating <= 5;
// Create a new review
router.post(
  "/reviews",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const { courseId, rating, content } = req.body;
    if (!courseId || !rating || !content) {
      return next(new ErrorHandler("Please provide all fields", 400));
    }
    const newReview = new Review({
      course: courseId,
      user: req.user._id,
      rating,
      content,
    });

    const savedReview = await newReview.save();

    // Update course rating
    await Promise.all([
      Course.findByIdAndUpdate(courseId, {
        $push: { reviews: savedReview._id },
      }),
      Course.calculateAverageRating(courseId),
    ]);

    res.status(201).json({
      success: true,
      message: "Review Created Successfully",
    });
  })
);

// Get all reviews for a course with filtering, pagination, and sorting
router.get(
  "/reviews",
  asyncHandler(async (req, res, next) => {
    const {
      courseId,
      rating,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    if (!isValidMongoId(courseId)) {
      return next(new ErrorHandler("Invalid course ID", 400));
    }

    const query = { course: courseId };

    // Add rating filter if provided
    if (rating) {
      if (!isValidRating(rating)) {
        return next(new ErrorHandler("Invalid rating value", 400));
      }
      query.rating = parseFloat(rating);
    }

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNumber - 1) * limitNumber;

    const sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    try {
      const [reviews, totalReviews] = await Promise.all([
        Review.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNumber)
          .populate("user", "name avatar"),
        Review.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalReviews / limitNumber);

      res.status(200).json({
        success: true,
        reviews: reviews,
        currentPage: pageNumber,
        totalPages: totalPages,
        totalReviews: totalReviews,
      });
    } catch (error) {
      return next(new ErrorHandler("Error fetching reviews", 500));
    }
  })
);

// Update a review
router.put("/reviews/:id", async (req, res) => {
  try {
    const { rating, content } = req.body;
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      { rating, content },
      { new: true, runValidators: true }
    );

    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Recalculate course rating
    await Course.calculateAverageRating(updatedReview.course);

    res.json(updatedReview);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating review", error: error.message });
  }
});

// Delete a review
router.delete("/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const courseId = review.course;

    await review.remove();

    // Remove review from course and recalculate rating
    await Promise.all([
      Course.findByIdAndUpdate(courseId, {
        $pull: { reviews: review._id },
      }),
      Course.calculateAverageRating(courseId),
    ]);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting review", error: error.message });
  }
});

// Get user's review for a specific course
router.get("/user/:userId/course/:courseId", async (req, res) => {
  try {
    const review = await Review.findOne({
      user: req.params.userId,
      course: req.params.courseId,
    });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json(review);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching review", error: error.message });
  }
});

// Get all reviews by a user
router.get("/user/:userId", async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.params.userId })
      .populate("course", "title")
      .sort("-createdAt");
    res.json(reviews);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user reviews", error: error.message });
  }
});

module.exports = router;
