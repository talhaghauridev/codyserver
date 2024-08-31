const express = require("express");
const router = express.Router();
const ErrorHandler = require("../../utils/ErrorHandler");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const Course = require("../../models/courseModel");
const { default: mongoose } = require("mongoose");
const Category = require("../../models/category");
const Topic = require("../../models/topic");
const Lesson = require("../../models/lessonModel");

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

module.exports = router;
