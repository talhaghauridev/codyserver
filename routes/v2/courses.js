const express = require("express");
const router = express.Router();
const ErrorHandler = require("../../utils/ErrorHandler");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const Course = require("../../models/courseModel");
const { default: mongoose } = require("mongoose");
const Category = require("../../models/category");
const Topic = require("../../models/topic");
const Lesson = require("../../models/lessonModel");
const EnrolledCourse = require("../../models/enrolledCourse");
const isAuthenticated = require("../../middlewares/auth");
const userModel = require("../../models/userModel");

const populateFields = (query, fields) => {
  if (fields.includes("topics")) {
    query = query.populate({
      path: "topics",
      populate: {
        path: "lessons",
        select: "title duration topic",
      },
    });
  }
  if (fields.includes("reviews")) {
    query = query.populate("reviews");
  }

  return query;
};

router.get(
  "/courses",
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const courses = await Course.find({ status: "published" })
      .populate("category")
      .sort({ publishedAt: -1 })
      .limit(limit);
    res.status(200).json({
      success: true,
      courses,
    });
  })
);

router.get(
  "/courses-filters",
  asyncHandler(async (req, res, next) => {
    const {
      page = 1,
      limit = 10,
      sortBy = "publishedAt",
      difficulty,
      search,
      category,
      popular,
      rating,
    } = req.query;

    let query = Course.find({ status: "published" });
    console.log(req.query, req.query.search ? true : false);
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query = query.or([
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
      ]);
    }

    if (difficulty) {
      query = query.where("difficulty").equals(difficulty);
    }

    if (category) {
      let categoryFilter;
      if (mongoose.Types.ObjectId.isValid(category)) {
        categoryFilter = category;
      } else {
        const categoryDoc = await Category.findOne({
          name: new RegExp(category, "i"),
        });
        categoryFilter = categoryDoc ? categoryDoc : null;
      }
      if (categoryFilter) {
        query = query.where("category").equals(categoryFilter);
      } else {
        return res.status(200).json({
          success: true,
          results: 0,
          totalPages: 0,
          currentPage: Number(page),
          totalCourses: 0,
          courses: [],
        });
      }
    }

    if (sortBy) {
      const sortOptions = { [sortBy]: -1 };
      query = query.sort(sortOptions);
    } else if (popular) {
      query = query.sort({ studentsEnrolled: -1 });
    } else {
      query = query.sort("-publishedAt");
    }

    if (rating) {
      const ratingNumber = parseInt(rating);
      if (!isNaN(ratingNumber) && ratingNumber >= 1 && ratingNumber <= 5) {
        query = query
          .where("overallRating")
          .gte(ratingNumber)
          .lt(ratingNumber + 1);
      } else {
        return next(
          new ErrorHandler(
            "Invalid rating. Please provide a whole number between 1 and 5.",
            400
          )
        );
      }
    }
    // Pagination
    const startIndex = (Number(page) - 1) * limit;
    const [courses, totalCourses] = await Promise.all([
      query
        .skip(startIndex)
        .limit(Number(limit))
        .populate("category")
        .select(
          "title tags studentsEnrolled difficulty overallRating numberOfRatings status coverImage logo"
        ),
      Course.countDocuments({ status: "published" }),
    ]);

    res.status(200).json({
      success: true,
      results: courses.length,
      totalPages: Math.ceil(totalCourses / limit),
      currentPage: Number(page),
      totalCourses,
      courses,
    });
  })
);

router.get("/courses-detials/:id", async (req, res, next) => {
  try {
    const { fields } = req.body;
    let query;

    query = Course.findOne({
      _id: req.params.id,
      status: "published",
    })
      .populate("category")
      .sort({ publishedAt: -1 });

    if (fields) {
      query = populateFields(query, fields);
    }

    const course = await query;

    if (!course) {
      return next(new ErrorHandler("Course not found or not published", 404));
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

router.get(
  "/courses/:courseId",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Find the course and populate topics and lessons
    const course = await Course.findById(courseId)
      .populate([
        {
          path: "topics",
          populate: {
            path: "lessons",
            model: "Lesson",
            select: "title duration",
          },
        },
        {
          path: "category",
        },
      ])
      .lean();

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    // Find the enrolled course for this user
    const enrolledCourse = await EnrolledCourse.findOne({
      user: userId,
      course: courseId,
    }).lean();

    const certificate = false; // Placeholder for certificate logic
    let isEnrolled = false;
    let overallProgress = 0;
    let accessibleLessons = [];
    let isFirstLessonMarked = false; // Flag to track if we've marked the first lesson

    if (enrolledCourse) {
      isEnrolled = true;
      overallProgress = enrolledCourse.progress || 0;

      // Create a map of completed lessons for quick lookup
      const completedLessonsMap = new Map(
        (enrolledCourse.lessonsCompleted || []).map((lc) => [
          lc.lesson ? lc.lesson.toString() : null,
          lc,
        ])
      );

      // Process topics and lessons
      course.topics = (course.topics || []).map((topic, topicIndex) => {
        topic.lessons = (topic.lessons || []).map((lesson, lessonIndex) => {
          const lessonId = lesson._id ? lesson._id.toString() : null;
          const completionInfo = lessonId
            ? completedLessonsMap.get(lessonId)
            : null;

          // Determine if the lesson is accessible
          let isAccessible = false;

          if (!isFirstLessonMarked && topicIndex === 0 && lessonIndex === 0) {
            // First lesson of the first topic
            isAccessible = true;
            isFirstLessonMarked = true;
          } else if (lessonIndex > 0) {
            // Check if the previous lesson in this topic is completed
            const prevLessonId = topic.lessons[lessonIndex - 1]._id.toString();
            isAccessible =
              completedLessonsMap.get(prevLessonId)?.completed || false;
          } else if (topicIndex > 0) {
            // First lesson of a new topic, check if the last lesson of the previous topic is completed
            const prevTopic = course.topics[topicIndex - 1];
            const lastLessonOfPrevTopic =
              prevTopic.lessons[prevTopic.lessons.length - 1];
            const lastLessonId = lastLessonOfPrevTopic._id.toString();
            isAccessible =
              completedLessonsMap.get(lastLessonId)?.completed || false;
          }

          if (isAccessible && lessonId) {
            accessibleLessons.push(lessonId);
          }

          return {
            ...lesson,
            completed: completionInfo ? completionInfo.completed : false,
            progress: completionInfo ? completionInfo.progress : 0,
            isAccessible: isAccessible,
            quizCompleted: completionInfo
              ? completionInfo.quizCompleted
              : false, // Added this line
          };
        });
        return topic;
      });
    }

    // Prepare the response
    const responseData = {
      ...course,
      enrolled: isEnrolled,
      progress: overallProgress,
      certificate: certificate,
      accessibleLessons: accessibleLessons,
    };

    res.status(200).json({
      success: true,
      course: responseData,
    });
  })
);
router.get(
  "/admin-courses",
  asyncHandler(async (req, res, next) => {
    const { limit = 10 } = req.query;

    const [courses, totalCourses] = await Promise.all([
      Course.find({})
        .populate("category")
        .limit(Number(limit))
        .sort({ createdAt: -1 }), // Changed from publishedAt to createdAt
      Course.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      totalCourses,
      results: courses.length,
      courses,
    });
  })
);
router.post(
  "/courses",
  asyncHandler(async (req, res, next) => {
    const { title, description, difficulty, tags, category, coverImage, logo } =
      req.body;
    if (!title || !description || !difficulty || !tags || !category || !logo) {
      return next(new ErrorHandler("Please fill all fields", 400));
    }
    const courseData = {
      title,
      description,
      difficulty,
      tags,
      category,
      logo,
      status: "draft",
      publishedAt: null,
    };
    console.log({ courseData });

    if (coverImage) {
      courseData.coverImage = coverImage;
    }

    const course = await Course.create(courseData);

    res.status(201).json({
      success: true,
      message: "Course created successfully and saved as draft",
      data: course,
    });
  })
);

router.patch(
  "/courses/:id/published",
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
      return next(new ErrorHandler("Please provide the course id ", 400));
    }

    const course = await Course.findById(id);

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    if (course.status === "published") {
      return next(new ErrorHandler("Course is already published", 400));
    }

    course.status = "published";
    course.publishedAt = Date.now();
    await course.save({ validateBeforeSave: false });
    await Category.findByIdAndUpdate(course.category, {
      $inc: { courseCount: 1 },
    });
    res.status(200).json({
      success: true,
      message: "Course published successfully",
      data: course,
    });
  })
);

router.patch(
  "/courses/:id/unpublished",
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
      return next(new ErrorHandler("Please provide the course id ", 400));
    }

    const course = await Course.findById(id);

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    if (course.status !== "published") {
      return next(new ErrorHandler("Course is not currently published", 400));
    }

    course.status = "draft";
    course.publishedAt = null;
    await course.save();

    await Category.findByIdAndUpdate(course.category, {
      $inc: { courseCount: -1 },
    });

    res.status(200).json({
      success: true,
      message: "Course unpublished successfully",
      data: course,
    });
  })
);

router.post(
  "/courses/:courseId/enroll",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const { courseId } = req.params;
    const userId = req.user._id;

    const course = await Course.findById(courseId).populate("topics");
    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    const alreadyEnrolled = await EnrolledCourse.findOne({
      user: userId,
      course: courseId,
    });
    if (alreadyEnrolled) {
      return next(
        new ErrorHandler("You are already enrolled in this course", 400)
      );
    }

    // Find the first lesson of the course
    const firstTopic = course.topics[0];
    const firstLesson = await Lesson.findOne({ topic: firstTopic._id }).sort(
      "createdAt"
    );

    const enrolledCourse = await EnrolledCourse.create({
      user: userId,
      course: courseId,
      lessonsCompleted: [
        {
          lesson: firstLesson._id,
          completed: false,
          progress: 0,
          lastAccessDate: new Date(),
        },
      ],
    });

    await Promise.all([
      userModel.findByIdAndUpdate(userId, {
        $push: { enrolledCourses: enrolledCourse._id },
      }),
      Course.findByIdAndUpdate(courseId, {
        $inc: { studentsEnrolled: 1 },
      }),
    ]);

    res.status(201).json({
      success: true,
      message: "Enrolled in course successfully",
    });
  })
);

router.get(
  "/enrolled-courses",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { limit = 10, page = 1 } = req.query;
    const skip = (Number(page) - 1) * limit;

    const enrolledCourses = await EnrolledCourse.find({ user: userId })
      .populate({
        path: "course",
        select: "title description coverImage logo difficulty",
      })
      .sort("-createdAt")
      .limit(limit)
      .skip(skip);

    if (!enrolledCourses) {
      return next(new ErrorHandler("No enrolled courses found", 404));
    }

    const formattedEnrolledCourses = enrolledCourses.map((enrollment) => ({
      _id: enrollment._id,
      course: enrollment.course,
      progress: enrollment.progress,
      enrolledAt: enrollment.createdAt,
      completionDate: enrollment.completionDate,
      startDate: enrollment.startDate,
    }));

    res.status(200).json({
      success: true,
      count: formattedEnrolledCourses.length,
      data: formattedEnrolledCourses,
    });
  })
);

router.get(
  "/in-progress-courses",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [enrolledCourses, totalCourses] = await Promise.all([
      EnrolledCourse.find({
        user: userId,
        completionDate: null,
      })
        .populate({
          path: "course",
          select: "title description logo difficulty topics",
          populate: {
            path: "topics",
            select: "lessons",
            populate: {
              path: "lessons",
              select: "duration",
            },
          },
        })
        .sort("-updatedAt")
        .skip(skip)
        .limit(Number(limit)),
      EnrolledCourse.countDocuments({
        user: userId,
        completionDate: null,
      }),
    ]);

    const formattedCourses = enrolledCourses.map((enrollment) => {
      const progress = enrollment.progress;
      const totalDuration = enrollment.course.topics.reduce(
        (acc, topic) =>
          acc +
          topic.lessons.reduce(
            (lessonAcc, lesson) => lessonAcc + lesson.duration,
            0
          ),
        0
      );
      const remainingDuration = Math.round(
        totalDuration * (1 - progress / 100)
      );

      return {
        _id: enrollment._id,
        courseId: enrollment.course._id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        logo: enrollment.course.logo,
        difficulty: enrollment.course.difficulty,
        progress,
        lessonsCompleted: `${enrollment.lessonsCompleted.filter((l) => l.completed).length}/${enrollment.course.topics.reduce((acc, topic) => acc + topic.lessons.length, 0)} Lessons`,
        timeLeft: `Est. ${remainingDuration}m left`,
        lastUpdated: enrollment.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      courses: formattedCourses,
      totalCourses,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCourses / Number(limit)),
    });
  })
);

// 3. Get all completed courses/certifications
router.get(
  "/completed-courses",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [completedCourses, totalCourses] = await Promise.all([
      EnrolledCourse.find({
        user: userId,
        completionDate: { $ne: null },
      })
        .populate({
          path: "course",
          select: "title description logo difficulty",
        })
        .sort("-completionDate")
        .skip(skip)
        .limit(Number(limit)),
      EnrolledCourse.countDocuments({
        user: userId,
        completionDate: { $ne: null },
      }),
    ]);

    const formattedCourses = completedCourses.map((enrollment) => ({
      _id: enrollment._id,
      courseId: enrollment.course._id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      logo: enrollment.course.logo,
      difficulty: enrollment.course.difficulty,
      completionDate: enrollment.completionDate,
    }));

    res.status(200).json({
      success: true,
      courses: formattedCourses,
      totalCourses,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCourses / Number(limit)),
    });
  })
);

router.patch(
  "/courses/:courseId/lessons/:lessonId/complete",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const { courseId, lessonId } = req.params;
    const userId = req.user._id;

    // Find the enrolled course
    const enrolledCourse = await EnrolledCourse.findOne({
      user: userId,
      course: courseId,
    });

    if (!enrolledCourse) {
      return next(new ErrorHandler("You are not enrolled in this course", 404));
    }

    // Find the lesson in the lessonsCompleted array
    const lessonIndex = enrolledCourse.lessonsCompleted.findIndex(
      (lesson) => lesson.lesson && lesson.lesson.toString() === lessonId
    );

    if (lessonIndex === -1) {
      // If the lesson is not in the array, add it
      enrolledCourse.lessonsCompleted.push({
        lesson: lessonId,
        completed: true,
        progress: 100,
        lastAccessDate: new Date(),
      });
    } else {
      // If the lesson is already in the array, mark it as completed
      enrolledCourse.lessonsCompleted[lessonIndex].completed = true;
      enrolledCourse.lessonsCompleted[lessonIndex].progress = 100;
      enrolledCourse.lessonsCompleted[lessonIndex].lastAccessDate = new Date();
    }

    // Update overall course progress
    const course = await Course.findById(courseId).populate("topics");
    const totalLessons = course.topics.reduce(
      (acc, topic) => acc + (topic.lessons ? topic.lessons.length : 0),
      0
    );
    const completedLessons = enrolledCourse.lessonsCompleted.filter(
      (lesson) => lesson.completed
    ).length;

    // Calculate and round the progress
    const calculatedProgress =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    enrolledCourse.progress = Math.round(calculatedProgress);

    // Check if the course is completed
    if (enrolledCourse.progress === 100) {
      enrolledCourse.completionDate = new Date();
    }

    // Save the changes
    await enrolledCourse.save();

    res.status(200).json({
      success: true,
      message: "Lesson marked as completed",
      data: {
        lessonId: lessonId,
        courseProgress: enrolledCourse.progress,
        isCompleted: enrolledCourse.progress === 100,
      },
    });
  })
);

router.patch(
  "/update-lesson-progress",
  asyncHandler(async (req, res, next) => {
    const { courseId, lessonId, completed, progress } = req.body;
    const userId = req.user.id;

    const enrolledCourse = await EnrolledCourse.findOne({
      user: userId,
      course: courseId,
    });
    if (!enrolledCourse) {
      return next(new ErrorHandler("You are not enrolled in this course", 404));
    }

    let lessonIndex = enrolledCourse.lessonsCompleted.findIndex(
      (lesson) => lesson.lesson.toString() === lessonId
    );

    if (lessonIndex === -1) {
      enrolledCourse.lessonsCompleted.push({
        lesson: lessonId,
        completed,
        progress,
        lastAccessDate: Date.now(),
      });
    } else {
      enrolledCourse.lessonsCompleted[lessonIndex] = {
        ...enrolledCourse.lessonsCompleted[lessonIndex],
        completed,
        progress,
        lastAccessDate: Date.now(),
      };
    }

    // Calculate overall course progress
    const course = await Course.findById(courseId).populate("topics");
    const totalLessons = course.topics.reduce(
      (acc, topic) => acc + topic.lessons.length,
      0
    );
    const completedLessons = enrolledCourse.lessonsCompleted.filter(
      (lesson) => lesson.completed
    ).length;
    enrolledCourse.progress = (completedLessons / totalLessons) * 100;

    if (enrolledCourse.progress === 100) {
      enrolledCourse.completionDate = Date.now();
    }

    await enrolledCourse.save();

    res.status(200).json({
      success: true,
      message: "Lesson progress updated successfully",
    });
  })
);
// Create a new topic for a course
router.post(
  "/courses/:courseId/topics",
  asyncHandler(async (req, res, next) => {
    const { title } = req.body;
    const { courseId } = req.params;
    if (!title || !courseId) {
      return next(new ErrorHandler("Please provide all fields"));
    }
    const course = await Course.findById(courseId);

    if (!course) {
      return next(new ErrorHandler("Course not found"));
    }

    const topic = await Topic.create({
      title,
      courseId,
    });

    course.topics.push(topic._id);
    await course.save();
    res.status(201).json({
      success: true,
      message: "Created a course topic successfully",
    });
  })
);

router.get(
  "/courses/:courseId/topics",
  asyncHandler(async (req, res, next) => {
    const { courseId } = req.params;
    if (!courseId) {
      return next(new ErrorHandler("Please provide a course id"));
    }
    const topics = await Topic.find({ courseId });

    if (!topics.length) {
      return next(new ErrorHandler("No topics found for this course", 404));
    }

    res.status(200).json({
      success: true,
      topics,
    });
  })
);

router.put(
  "/courses/:id",
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { title, description, difficulty, tags, category, coverImage, logo } =
      req.body;

    if (!id) {
      return next(new ErrorHandler("Please provide the course id", 400));
    }

    const course = await Course.findById(id);

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    // Update fields if provided
    if (title) course.title = title;
    if (description) course.description = description;
    if (difficulty) course.difficulty = difficulty;
    if (tags) course.tags = tags;
    if (category !== course.category._id.toString()) {
      const oldCategory = course.category;
      course.category = category;

      // Update category course counts
      await Category.findByIdAndUpdate(oldCategory, {
        $inc: { courseCount: -1 },
      });
      await Category.findByIdAndUpdate(category, { $inc: { courseCount: 1 } });
    }
    if (coverImage) course.coverImage = coverImage;
    if (logo) course.logo = logo;

    await course.save();

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  })
);

// Delete course
router.delete(
  "/courses/:id",
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
      return next(new ErrorHandler("Please provide the course id", 400));
    }

    const course = await Course.findById(id);

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    // Remove course from category
    await Category.findByIdAndUpdate(course.category, {
      $inc: { courseCount: -1 },
    });

    // Delete associated topics and lessons
    const topics = await Topic.find({ courseId: id });
    if (topics.length > 0) {
      for (let topic of topics) {
        await Lesson.deleteMany({ topic: topic._id });
      }
      await Topic.deleteMany({ courseId: id });
    }

    // Delete the course
    await Course.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Course and associated data deleted successfully",
    });
  })
);

module.exports = router;
