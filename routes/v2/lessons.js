const express = require("express");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const Lesson = require("../../models/lessonModel");
const ErrorHandler = require("../../utils/ErrorHandler");
const Topic = require("../../models/topic");
const {
  optimizedEstimateReadingTime,
} = require("../../utils/calculateDuration");
const Course = require("../../models/courseModel");
const router = express.Router();

const processContent = (content) => {
  if (typeof content === "string") {
    try {
      // Check if the string is valid JSON
      JSON.parse(content);
      // If it's valid JSON, stringify it with indentation for readability
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch (e) {
      // If it's not valid JSON, return the original string
      return content;
    }
  } else if (typeof content === "object") {
    // If it's already an object, stringify it
    return JSON.stringify(content, null, 2);
  }
  // For any other type, convert to string
  return String(content);
};

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
    let { title, content } = req.body;

    if (!topicId) {
      return next(new ErrorHandler("Please provide a topic id"));
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return next(new ErrorHandler("Topic not found", 404));
    }

    const course = await Course.findById(topic.courseId)
      .populate({
        path: "topics",
        select: "duration",
      })
      .select("duration lessonsCount");

    // Process content to ensure it's stored as text
    content = processContent(content);

    const duration = optimizedEstimateReadingTime(content);

    const lesson = await Lesson.create({
      title,
      content,
      topic: topic._id,
      duration,
    });

    topic.lessons.push(lesson._id);
    topic.duration += Number(duration);

    const totalCourseDuration = course.topics.reduce(
      (total, t) => total + t.duration,
      0
    );

    course.duration = totalCourseDuration;
    course.lessonsCount += 1;

    await Promise.all([
      topic.save({ validateBeforeSave: false }),
      course.save({ validateBeforeSave: false }),
    ]);

    res.status(200).json({
      success: true,
      message: "Lesson created successfully",
    });
  })
);

router.put(
  "/lessons/:id",
  asyncHandler(async (req, res, next) => {
    const lessonId = req.params.id;
    let { title, content } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new ErrorHandler("Lesson not found", 404);
    }

    const oldDuration = lesson.duration;
    let newDuration = oldDuration;

    if (content) {
      // Process content to ensure it's stored as text
      content = processContent(content);
      newDuration = optimizedEstimateReadingTime(content);

      lesson.content = content;
      lesson.duration = newDuration;
    }

    if (title) {
      lesson.title = title;
    }

    await lesson.save({ validateBeforeSave: false });

    if (newDuration !== oldDuration) {
      const [topic, course] = await Promise.all([
        Topic.findById(lesson.topic),
        Course.findOne({ topics: lesson.topic }),
      ]);

      if (!topic || !course) {
        throw new ErrorHandler("Associated topic or course not found", 404);
      }

      topic.duration = topic.duration - oldDuration + newDuration;
      course.duration = course.duration - oldDuration + newDuration;

      await Promise.all([
        topic.save({ validateBeforeSave: false }),
        course.save({ validateBeforeSave: false }),
      ]);
    }

    res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
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
