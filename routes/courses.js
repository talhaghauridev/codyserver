const express = require("express");
const router = express.Router();
const Course = require("../models/courseModel");
const Lesson = require("../models/lessonModel");
const User = require("../models/userModel");

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
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).send();
    }
    await Lesson.findByIdAndDelete(id);

    const deleteUserCourses = await User.findByIdAndUpdate(req.params.id, {
      $pull: {
        enrolledCourses: {
          courseId: req.params.id,
        },
      },
    });
    console.log(deleteUserCourses);
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

router.post("/courses/:courseId/lessons", async (req, res) => {
  const { content, ...lessonData } = req.body;

  const processedContent = content.map((block) => ({
    _id: new mongoose.Types.ObjectId(),
    ...block,
  }));

  const lesson = new Lesson({
    ...lessonData,
    courseId: req.params.courseId,
    content: processedContent,
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

// Delete a lesson
router.delete("/lessons/:id", async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) {
      return res.status(404).send();
    }
    res.send(lesson);
  } catch (error) {
    res.status(500).send(error);
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

    // Find the specific topic by ID within the course
    const topic = course.topics.id(topicId);
    if (!topic) {
      return res.status(404).send({ error: "Topic not found" });
    }
    console.log(topic);
    // Assuming topic.lessons is an array of lesson IDs
    // Use the $in operator to find lessons whose IDs are listed in topic.lessons
    const lessons = await Lesson.find({
      _id: { $in: topic.lessons },
    });

    res.status(200).send(lessons);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Server error" });
  }
});

// router.post('/courses/:courseId/topics/:topicId/lessons', async (req, res) => {
//     const { courseId, topicId } = req.params;
//     const lesson = new Lesson({
//         ...req.body,
//     });
//     try {
//         const savedLesson = await lesson.save();
//         const course = await Course.findById(courseId);
//         // Find the topic by topicId and push the lesson ID
//         const topic = course.topics.id(topicId); // Accessing the specific topic by ID
//         if (!topic) {
//             return res.status(404).send({ error: 'Topic not found' });
//         }
//         topic.lessons.push(savedLesson._id); // Assumes `lessons` is a field in the topic schema
//         await course.save();

//         res.status(201).send(savedLesson);
//     } catch (error) {
//         res.status(400).send(error);
//     }
// });
router.post("/courses/:courseId/topics/:topicId/lessons", async (req, res) => {
  const { courseId, topicId } = req.params;
  const { duration } = req.body; // Assuming duration is sent in the request body

  try {
    const savedLesson = await new Lesson({
      ...req.body,
      courseId, // Assuming your lesson schema requires a courseId
    }).save();

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).send({ error: "Course not found" });
    }

    // Accessing the specific topic by ID
    const topic = course.topics.id(topicId);
    if (!topic) {
      return res.status(404).send({ error: "Topic not found" });
    }

    // Push the new lesson ID into the topic's lessons array
    topic.lessons.push(savedLesson._id);

    // Update lesson count and total duration at the course level
    // This assumes you have lessonCount and totalDuration fields in your course model
    course.lessons = (course.lessons || 0) + 1;
    course.duration = (course.duration || 0) + (duration || 0);

    await course.save();

    res.status(201).send(savedLesson);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

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
