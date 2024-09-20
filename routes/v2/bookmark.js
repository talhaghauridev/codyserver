const express = require("express");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const Bookmark = require("../../models/bookmark");
const isAuthenticated = require("../../middlewares/auth");

const router = express.Router();

router.use(isAuthenticated);
// Create a new bookmark
router.post(
  "/bookmarks",
  asyncHandler(async (req, res, next) => {
    const { lessonId, courseId } = req.body;
    const userId = req.user._id; // Assuming you have authentication middleware

    const newBookmark = await Bookmark.create({
      user: userId,
      lesson: lessonId,
      course: courseId,
    });

    res.status(201).json({
      success: true,
      data: {
        bookmark: newBookmark,
      },
    });
  })
);

// Delete a bookmark
router.delete(
  "/bookmarks/:id",
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user._id;

    const bookmark = await Bookmark.findOneAndDelete({ _id: id, user: userId });

    if (!bookmark) {
      return next(new AppError("No bookmark found with that ID", 404));
    }

    res.status(204).json({
      success: true,
      data: null,
    });
  })
);

// Get all bookmarks for a user
router.get(
  "/bookmarks",
  asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    const bookmarks = await Bookmark.find({ user: userId })
      .populate("lesson", "title duration")
      .populate("course", "title coverImage");

    res.status(200).json({
      status: "success",
      results: bookmarks.length,
      data: {
        bookmarks,
      },
    });
  })
);

// Check if a lesson is bookmarked by the user
router.get(
  "/bookmarks/check/:lessonId",
  asyncHandler(async (req, res, next) => {
    const { lessonId } = req.params;
    const userId = req.user._id;

    const bookmark = await Bookmark.findOne({ user: userId, lesson: lessonId });

    res.status(200).json({
      success: true,
      data: {
        isBookmarked: !!bookmark,
        bookmarkId: bookmark ? bookmark._id : null,
      },
    });
  })
);

module.exports = router;
