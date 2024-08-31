const Course = require("../../models/courseModel");
const Topic = require("../../models/topic");
const express = require("express");
const ErrorHandler = require("../../utils/ErrorHandler");
const asyncHandler = require("../../middlewares/asyncErrorHandler");

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

router.put(
  "/topics/:topicId",
  asyncHandler(async (req, res, next) => {
    let topic = await Topic.findById(req.params.topicId);

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

// Delete a topic
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

    await topic.remove();

    // Remove topic from course
    await Course.findByIdAndUpdate(topic.courseId, {
      $pull: { topics: topic._id },
    });

    res.status(200).json({
      success: true,
      message: "Topic deleted successfully",
    });
  })
);
module.exports = router;
