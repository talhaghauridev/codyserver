const express = require("express");
const router = express.Router();
const Course = require("../models/courseModel");
const Lesson = require("../models/lessonModel");
const User = require("../models/userModel");
const {
  calculateDuration,
  estimateReadingTime,
} = require("../utils/calculateDuration");
const ErrorHandler = require("../utils/ErrorHandler");
const Certificate = require("../models/certificate");

router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find().populate("lessons");
    res.status(200).send(courses);
  } catch (error) {
    res.status(500).send(error);
  }
});
router.get("/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "topics.lessons"
    );
    if (!course) {
      return res.status(404).send();
    }
    res.status(200).send(course);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/course/:userId/:courseId", async (req, res) => {
  try {
    // Find the user by ID
    const user = await User.findById(req.params.userId);
    const certificate = await Certificate.findOne({
      userId: req.params.userId,
      courseId: req.params.courseId,
    });
    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the course by ID and populate the lessons
    const course = await Course.findById(req.params.courseId).populate(
      "topics.lessons"
    );

    // Check if the course exists
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Convert the course document to a plain object
    const courseObject = course.toObject();

    // Check if the user is enrolled in this course
    const enrolledCourse = user.enrolledCourses.find((ec) =>
      ec.courseId.equals(course._id)
    );

    if (enrolledCourse) {
      // User is enrolled, add lesson completion details and progress
      if (certificate) {
        courseObject.certificate = true;
      }
      courseObject.enrolled = true;

      courseObject.progress = enrolledCourse.progress; // Add overall course progress
      courseObject.topics = courseObject.topics.map((topic) => {
        topic.lessons = topic.lessons.map((lesson) => {
          const lessonCompletion = enrolledCourse.lessonsCompleted.find((lc) =>
            lc.lessonId.equals(lesson._id)
          );
          lesson.completed = lessonCompletion
            ? lessonCompletion.completed
            : false;
          lesson.progress = lessonCompletion ? lessonCompletion.progress : 0; // Add lesson progress
          return lesson;
        });
        return topic;
      });
    } else {
      // User is not enrolled
      courseObject.enrolled = false;
      courseObject.progress = 0; // No progress for non-enrolled courses
    }

    // Respond with the course and details
    res.json(courseObject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/popular-courses", async (req, res) => {
  try {
    const popularCourses = await Course.aggregate([
      { $sort: { enrolledCount: -1 } }, // Sort by enrolledCount in descending order
      { $limit: 5 }, // Limit to the top 5 courses
    ]);

    res.status(200).json(popularCourses);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error" });
  }
});

router.get("/courses/:courseId/topics", async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).send();
    }
    res.status(200).send(course.topics);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/courses", async (req, res) => {
  const course = new Course(req.body);
  try {
    await course.save();
    res.status(201).send(course);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete a course
router.delete("/courses/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Step 1: Delete all lessons associated with the course
    await Lesson.deleteMany({ courseId: id });

    // Step 3: Remove the course from the 'enrolledCourses' array in the 'User' collection
    await User.updateMany({}, { $pull: { enrolledCourses: { courseId: id } } });

    // Finally, delete the course itself
    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).send();
    }

    res.status(200).send({
      message: "Course deleted successfully",
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

//Update Course
router.patch("/courses/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const course = await Course.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!course) {
      return res.status(404).send();
    }
    res.status(200).send({ message: "Update course successfully" });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Add Lesson
router.post("/courses/:courseId/lessons", async (req, res, next) => {
  const { content, topicId, ...lessonData } = req.body;
  const { courseId } = req.params;

  const processedContent = content.map((block) => ({
    _id: new mongoose.Types.ObjectId(),
    ...block,
  }));
  const duration = calculateDuration(content);
  const lesson = new Lesson({
    ...lessonData,
    topicId,
    courseId,
    content: processedContent,
    duration,
  });

  try {
    const savedLesson = await lesson.save();
    await Course.findByIdAndUpdate(req.params.courseId, {
      $push: { lessons: savedLesson._id },
    });
    res.status(201).send(savedLesson);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Course Sections (Topics)
// Add a topic to a course

router.post("/courses/:id/topics", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).send();
    }
    course.topics.push(req.body);
    await course.save();
    res.status(201).send(course);
  } catch (error) {
    res.status(400).send(error);
  }
});
router.get("/courses/:courseId/topics/:topicId/lessons", async (req, res) => {
  const { courseId, topicId } = req.params;

  try {
    const course = await Course.findById(courseId);
    // Ensure the course exists
    if (!course) {
      return res.status(404).send({ error: "Course not found" });
    }

    const topic = course.topics.find(
      (topic) => topic._id.toString() === topicId
    );
    console.log(topic);
    if (!topic) {
      return res.status(404).send({ error: "Topic not found" });
    }

    // Retrieve lessons based on topic.lessons array
    const lessons = await Lesson.find({
      _id: { $in: topic.lessons },
    });

    console.log();

    res.status(200).send(lessons);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Server error" });
  }
});

//Add Lesson
router.post("/courses/:courseId/topics/:topicId/lessons", async (req, res) => {
  const { courseId, topicId } = req.params;
  const { title, content } = req.body;

  try {
    // Parse content to calculate the estimated reading time
    const parsedContent = JSON.parse(content);
    const duration = estimateReadingTime(parsedContent);

    const lesson = await Lesson.create({
      courseId: courseId,
      topicId: topicId,
      content: parsedContent,
      title,
      duration,
    });

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).send({ error: "Course not found" });
    }

    // Find the topic by topicId
    const topic = course.topics.id(topicId);
    if (!topic) {
      return res.status(404).send({ error: "Topic not found" });
    }

    // Add the lesson ID to the topic
    topic.lessons.push(lesson._id);

    // Update topic duration
    topic.duration += Number(duration);

    // Calculate the total course duration by summing up all topic durations
    const totalCourseDuration = course.topics.reduce(
      (total, t) => total + t.duration,
      0
    );

    // Update course duration and lesson count
    course.duration = totalCourseDuration;
    course.lessons += 1;

    await course.save({ validateBeforeSave: false });

    res.status(201).send(lesson);
  } catch (error) {
    console.error(error);
    res
      .status(400)
      .send({ error: "An error occurred while adding the lesson" });
  }
});

// Update Lesson
router.patch("/lessons/:id", async (req, res, next) => {
  const lessonId = req.params.id;
  const { title, content } = req.body;
  if (!title || !content) {
    return next(new ErrorHandler("Please fill all fields", 400));
  }
  const oldLesson = await Lesson.findById(lessonId);

  if (!oldLesson) {
    return next(new ErrorHandler("Lesson not found", 400));
  }
  const oldDuration = oldLesson.duration;
  const parsedContent = JSON.parse(content);
  const newDuration = estimateReadingTime(content);
  console.log({ newDuration });
  try {
    const updateLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      {
        $set: {
          title,
          duration: newDuration,
          content: parsedContent,
        },
      },
      {
        new: true,
      }
    );

    const { topicId, courseId } = updateLesson;

    const course = await Course.findById(courseId);

    const topic = course.topics.id(topicId);
    if (!topic) {
      return next(new ErrorHandler("Topic not found", 404));
    }
    topic.duration = topic.duration - oldDuration + newDuration;

    const totalCourseDuration = course.topics.reduce(
      (total, t) => total + t.duration,
      0
    );

    course.duration = totalCourseDuration;

    await course.save({ validateBeforeSave: false });
    res.send({ message: "Lesson deleted successfully" });
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
});

// Delete a lesson
router.delete("/lessons/:id", async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);

    if (!lesson) {
      return next(new ErrorHandler("Lesson not found", 404));
    }
    const { duration, topicId, courseId } = lesson;

    const course = await Course.findById(courseId);

    // Find the specific topic
    const topic = course.topics.id(topicId);
    if (!topic) {
      return next(new ErrorHandler("Topic not found", 404));
    }
    topic.lessons.pull(lesson._id);
    topic.duration -= duration;
    course.duration -= duration;
    course.lessons -= 1;
    course.save({ validateBeforeSave: false });
    res.send({ message: "Lesson deleted successfully" });
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
});

// router.post("/courses/:courseId/topics/:topicId/lessons", async (req, res) => {
//   const { courseId, topicId } = req.params;
//   const { content, title, duration } = req.body;
//   try {
//     const course = await Course.findById(courseId);
//     // Ensure the course exists
//     if (!course) {
//       return res.status(404).send({ error: "Course not found" });
//     }
//     const lesson = await Lesson.create({
//       courseId: courseId,
//       topicId: topicId,
//       title: title,
//       duration,
//     });

//     await Lesson.findByIdAndUpdate(lesson._id, {
//       $push: {
//         content: content,
//       },
//     });

//     const findCourse = course.topics.find((i) => i._id.toString() === topicId);

//     console.log(findCourse);

//     if (findCourse) {
//       findCourse.lessons.push(lesson._id);
//     }

//     await course.save();
//     res.status(200).send(lesson);
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ error: "Server error" });
//   }
// });

// Delete a topic from a course
// router.delete("/courses/:courseId/topics/:topicId", async (req, res) => {
//   try {
//     const course = await Course.findById(req.params.courseId);
//     if (!course) {
//       return res.status(404).send();
//     }
//     const topic = course.topics.id(req.params.topicId);
//     if (!topic) {
//       return res.status(404).send();
//     }
//     topic.remove();
//     await course.save();
//     res.send(course);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

router.post("/enroll", async (req, res) => {
  const { courseId } = req.body;
  const userId = req.body.id; // Assuming this is the user's ID from the request

  try {
    // Find the user with the specific courseId already in their enrolledCourses
    const userAlreadyEnrolled = await User.findOne({
      _id: userId,
      "enrolledCourses.courseId": courseId,
    });

    // If the user is already enrolled in the course, send an error message
    if (userAlreadyEnrolled) {
      return res
        .status(400)
        .send({ message: "Already enrolled in this course" });
    }

    // If not already enrolled, update the user to add the course to their enrolledCourses
    await User.findByIdAndUpdate(userId, {
      $push: { enrolledCourses: { courseId, progress: 0 } },
    });

    res.status(200).send({ message: "Enrolled successfully" });
  } catch (error) {
    console.error(error); // It's helpful to log the error for debugging purposes
    res.status(500).send(error);
  }
});

router.post("/completeLesson", async (req, res) => {
  const { userId, courseId, lessonId } = req.body;

  try {
    // Find the user and course from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).send({ message: "Course not found" });
    }

    // Calculate the total number of lessons in the course
    const totalLessons = course.topics.reduce(
      (acc, topic) => acc + topic.lessons.length,
      0
    );

    // Find the enrollment info for the specified course
    const enrollment = user.enrolledCourses.find((enrollment) =>
      enrollment.courseId.equals(courseId)
    );
    if (!enrollment) {
      return res
        .status(404)
        .send({ message: "User is not enrolled in the specified course" });
    }

    // Check if the lesson has already been completed
    if (
      enrollment.lessonsCompleted.some((lesson) =>
        lesson.lessonId.equals(lessonId)
      )
    ) {
      return res.status(400).send({ message: "Lesson already completed" });
    }

    // Mark the lesson as completed
    enrollment.lessonsCompleted.push({ lessonId, completed: true });

    // Calculate and update the user's progress for the course
    const progress = (enrollment.lessonsCompleted.length / totalLessons) * 100;
    enrollment.progress = progress;

    // Save the updated user document
    await user.save();

    res.status(200).send({
      message: "Lesson marked as completed, progress updated",
      progress: progress,
    });
  } catch (error) {
    console.error(error); // It's helpful to log the error for debugging purposes
    res
      .status(500)
      .send({ message: "An error occurred", error: error.toString() });
  }
});

// router.post('/completeLesson', async (req, res) => {
//     const { userId, courseId, lessonId } = req.body;

//     try {
//         const user = await User.findById(userId);
//         const course = await Course.findById(courseId); // Assuming you have a Course model
//         if (!course) {
//             return res.status(404).send({ message: 'Course not found' });
//         }

//         const totalLessons = course.topics.reduce((acc, topic) => acc + topic.lessons.length, 0);

//         const courseIndex = user.enrolledCourses.findIndex(enrollment => enrollment.courseId.equals(courseId));

//         if (courseIndex !== -1) {
//             const lessonsCompleted = user.enrolledCourses[courseIndex].lessonsCompleted;
//             const lessonIndex = lessonsCompleted.findIndex(lesson => lesson.lessonId.equals(lessonId));

//             if (lessonIndex === -1) {
//                 lessonsCompleted.push({ lessonId, completed: true });
//             } else {
//                 lessonsCompleted[lessonIndex].completed = true;
//             }

//             // Calculate and update course progress
//             const completedLessonsCount = lessonsCompleted.filter(lesson => lesson.completed).length;
//             const progress = (completedLessonsCount / totalLessons) * 100;
//             user.enrolledCourses[courseIndex].progress = progress;

//             await user.save();
//             res.status(200).send({ message: 'Lesson marked as completed, progress updated' });
//         } else {
//             res.status(404).send({ message: 'Course not found in user enrollments' });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).send(error);
//     }
// });

module.exports = router;
