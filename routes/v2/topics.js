const Course = require("../../models/courseModel");
const Topic = require("../../models/topic");
const express = require("express");
const ErrorHandler = require("../../utils/ErrorHandler");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const lessonModel = require("../../models/lessonModel");

const router = express.Router();

router.get(
  "/topics/:topicId",
  asyncHandler(async (req, res, next) => {
    const { topicId } = req.params;
    const topic = await Topic.findById(topicId).populate(
      "lessons",
      "title duration topic"
    );

    if (!topic) {
      return next(new ErrorHandler("Topic not found", 404));
    }

    res.status(200).json({
      success: true,
      topic,
    });
  })
);

router.get(
  "/topics/:topicId/lessons",
  asyncHandler(async (req, res, next) => {
    const { topicId } = req.params;
    const lessons = await lessonModel.find({ topic: topicId });

    if (!lessons) {
      return next(new ErrorHandler("Lessons not found", 404));
    }

    res.status(200).json({
      success: true,
      lessons,
    });
  })
);

router.patch(
  "/topics/:topicId",
  asyncHandler(async (req, res, next) => {
    let topic = await Topic.findById(req.params.topicId);
    console.log({
      body: req.body,
    });
    if (!topic) {
      return next(new ErrorHandler("Topic not found", 404));
    }

    topic = await Topic.findByIdAndUpdate(req.params.topicId, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: topic,
    });
  })
);

router.delete(
  "/topics/:topicId",
  asyncHandler(async (req, res, next) => {
    const { topicId } = req.params;

    if (!topicId) {
      return next(new ErrorHandler("Please provide topic id"));
    }

    const topic = await Topic.findById(topicId);

    if (!topic) {
      return next(new ErrorHandler("Topic not found", 404));
    }

    try {
      await Promise.all([
        // Remove the topic
        Topic.findByIdAndDelete(topicId),

        // Remove topic from course
        Course.findByIdAndUpdate(topic.courseId, {
          $pull: { topics: topic._id },
        }),

        // Delete all lessons associated with the topic
        lessonModel.deleteMany({ topic: topic._id }),
      ]);

      res.status(200).json({
        success: true,
        message: "Topic and associated lessons deleted successfully",
      });
    } catch (error) {
      return next(
        new ErrorHandler("Error deleting topic and associated data", 500)
      );
    }
  })
);
module.exports = router;
