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
      sort,
      difficulty,
      search,
      category,
      popular,
    } = req.query;

    let query = Course.find({ status: "published" });

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

    // Sort
    if (sort) {
      const sortBy = sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else if (popular) {
      query = query.sort({ studentsEnrolled: -1 });
    } else {
      query = query.sort("-publishedAt");
    }

    // Pagination
    const startIndex = (Number(page) - 1) * limit;
    const [courses, totalCourses] = await Promise.all([
      query.skip(startIndex).limit(Number(limit)).populate("category"),
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

router.get("/courses/:id", async (req, res, next) => {
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
    const courseId = req.params.courseId;
    const userId = req.user.id;
    console.log({ courseId, userId });

    const course = await Course.findById(courseId);
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

    const enrolledCourse = await EnrolledCourse.create({
      user: userId,
      course: courseId,
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

    const enrolledCourses = await EnrolledCourse.find({ user: userId })
      .populate({
        path: "course",
        select: "title description coverImage logo difficulty",
      })
      .sort("-createdAt");

    if (!enrolledCourses) {
      return next(new ErrorHandler("No enrolled courses found", 404));
    }

    const formattedEnrolledCourses = enrolledCourses.map((enrollment) => ({
      _id: enrollment._id,
      course: enrollment.course,
      progress: enrollment.progress,
      enrolledAt: enrollment.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: formattedEnrolledCourses.length,
      data: formattedEnrolledCourses,
    });
  })
);

router.patch(
  "/courses/:courseId/lessons/:lessonId/complete",
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const { courseId, lessonId } = req.params;
    const userId = req.user.id;

    const enrolledCourse = await EnrolledCourse.findOne({
      user: userId,
      course: courseId,
    });

    if (!enrolledCourse) {
      return next(new ErrorHandler("You are not enrolled in this course", 404));
    }

    const lessonIndex = enrolledCourse.lessonsCompleted.findIndex(
      (lesson) => lesson.lesson.toString() === lessonId
    );

    if (lessonIndex === -1) {
      return next(new ErrorHandler("Lesson not found in this course", 404));
    }

    // Mark the current lesson as completed
    enrolledCourse.lessonsCompleted[lessonIndex].completed = true;
    enrolledCourse.lessonsCompleted[lessonIndex].progress = 100;

    // Find the next lesson and mark it as accessible
    const course = await Course.findById(courseId).populate("topics");
    const allLessons = (
      await Promise.all(
        course.topics.map(async (topic) => {
          return await Lesson.find({ topic: topic._id }).sort("createdAt");
        })
      )
    ).flat();

    const currentLessonIndex = allLessons.findIndex(
      (lesson) => lesson._id.toString() === lessonId
    );
    if (currentLessonIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentLessonIndex + 1];
      const nextLessonIndex = enrolledCourse.lessonsCompleted.findIndex(
        (lesson) => lesson.lesson.toString() === nextLesson._id.toString()
      );

      if (nextLessonIndex === -1) {
        enrolledCourse.lessonsCompleted.push({
          lesson: nextLesson._id,
          completed: false,
          progress: 0,
          isAccessible: true,
        });
      } else {
        enrolledCourse.lessonsCompleted[nextLessonIndex].isAccessible = true;
      }
    }

    await enrolledCourse.save();

    res.status(200).json({
      success: true,
      message: "Lesson completed and next lesson unlocked",
      data: enrolledCourse.lessonsCompleted,
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
