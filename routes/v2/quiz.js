const express = require("express");
const isAuthenticated = require("../../middlewares/auth");
const LessonQuiz = require("../../models/LessonQuiz");
const ErrorHandler = require("../../utils/ErrorHandler");
const lessonModel = require("../../models/lessonModel");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const EnrolledCourse = require("../../models/enrolledCourse");
const { default: mongoose } = require("mongoose");
const router = express.Router();

// Create a new quiz
router.post(
  "/quizzes",
  isAuthenticated,

  asyncHandler(async (req, res, next) => {
    const { lesson, question, options } = req.body;

    // Validate lesson existence
    const lessonExists = await lessonModel.exists({ _id: lesson });
    if (!lessonExists) {
      return next(new ErrorHandler("Lesson not found", 404));
    }

    const quiz = await LessonQuiz.create({
      lesson,
      question,
      options,
    });

    res.status(201).json({
      success: true,
      quiz,
    });
  })
);

// Update a quiz
router.put(
  "/quizzes/:id",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const { question, options } = req.body;

    const quiz = await LessonQuiz.findById(req.params.id);

    if (!quiz) {
      return next(new ErrorHandler("LessonQuiz not found", 404));
    }

    quiz.question = question;
    quiz.options = options;

    await quiz.save();

    res.status(200).json({
      success: true,
      quiz,
    });
  })
);

// Get all quizzes for a lesson
router.get(
  "/lessons/:lessonId/quizzes",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const { lessonId } = req.params;

    const quizzes = await LessonQuiz.find({ lesson: lessonId });

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
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const quiz = await LessonQuiz.findById(req.params.id);

    if (!quiz) {
      return next(new ErrorHandler("LessonQuiz not found", 404));
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
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const quiz = await LessonQuiz.findById(req.params.id);

    if (!quiz) {
      return next(new ErrorHandler("LessonQuiz not found", 404));
    }

    await quiz.remove();

    res.status(200).json({
      success: true,
      message: "LessonQuiz deleted successfully",
    });
  })
);

router.patch(
  "/quizzes/:courseId/:lessonId/complete",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const { courseId, lessonId } = req.params;
    const userId = req.user._id;

    // Validate input
    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(lessonId)
    ) {
      return next(new ErrorHandler("Invalid course or lesson ID", 400));
    }

    // Find the enrolled course
    const enrolledCourse = await EnrolledCourse.findOne({
      user: userId,
      course: courseId,
    });

    if (!enrolledCourse) {
      return next(new ErrorHandler("You are not enrolled in this course", 404));
    }

    // Find the lesson in the enrolled course
    const lessonIndex = enrolledCourse.lessonsCompleted.findIndex(
      (lesson) => lesson.lesson.toString() === lessonId
    );

    if (lessonIndex === -1) {
      return next(
        new ErrorHandler("Lesson not found in the enrolled course", 404)
      );
    }

    // Update the quiz completion status
    enrolledCourse.lessonsCompleted[lessonIndex].quizCompleted = true;

    await enrolledCourse.save({
      validateBeforeSave: false,
    });

    res.status(200).json({
      success: true,
      message: "LessonQuiz completed successfully",
    });
  })
);

module.exports = router;
