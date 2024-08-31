const express = require("express");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const Lesson = require("../../models/lessonModel");
const ErrorHandler = require("../../utils/ErrorHandler");
const Topic = require("../../models/topic");
const router = express.Router();

router.get(
  "/lessons/:id",
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return next(new ErrorHandler("Lesson not found", 404));
    }
    res.status(200).json({
      success: true,
      lesson,
    });
  })
);

router.post(
  "/lessons/:topicId",
  asyncHandler(async (req, res, next) => {
    const { topicId } = req.params;
    const { title, content } = req.body;
    if (!topicId) {
      return next(new ErrorHandler("Please provide a topic id"));
    }
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return next(new ErrorHandler("Topic not found", 404));
    }
    const lesson = await Lesson.create({ title, content, topic: topic._id });

    topic.lessons.push(lesson._id);
    await topic.save({ validateBeforeSave: false });
    res.status(200).json({
      success: true,
      message: "Lesson create successfully",
    });
  })
);

router.put(
  "/lessons/:id",
  asyncHandler(async (req, res, next) => {
    let lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return next(new ErrorHandler("Lesson not found", 404));
    }

    const oldDuration = lesson.duration;

    lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // // Update topic duration if lesson duration changed
    // if (oldDuration !== lesson.duration) {
    //   await Topic.findByIdAndUpdate(lesson.topic, {
    //     $inc: { duration: lesson.duration - oldDuration },
    //   });
    // }

    res.status(200).json({
      success: true,
      data: lesson,
    });
  })
);
router.delete(
  "/lessons/:id",
  asyncHandler(async (req, res, next) => {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return next(new ErrorHandler("Lesson not found", 404));
    }

    await lesson.remove();

    // Remove lesson from topic and update duration
    await Topic.findByIdAndUpdate(lesson.topic, {
      $pull: { lessons: lesson._id },
      //   $inc: { duration: -lesson.duration },
    });

    res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
    });
  })
);
module.exports = router;
