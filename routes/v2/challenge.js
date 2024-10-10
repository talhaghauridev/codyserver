const express = require("express");
const asyncHandler = require("../../middlewares/asyncErrorHandler");
const Quiz = require("../../models/quizModel");
const ErrorHandler = require("../../utils/ErrorHandler");
const Challenge = require("../../models/challenge");
const router = express.Router();

// Get all challenges
router.get(
  "/challenges",
  asyncHandler(async (req, res) => {
    const { difficulty, language, search, limit = 10, viewAll } = req.query;
    let query = {};

    if (language && language !== "All") {
      query.language = language;
    }

    if (difficulty && difficulty !== "All") {
      query.difficulty = difficulty;
    }

    if (search) query.title = { $regex: search, $options: "i" };

    let challengeQuery = Challenge.find(query).sort({ createdAt: -1 });

    if (viewAll !== "true") {
      challengeQuery = challengeQuery.limit(parseInt(limit));
    }

    const challenges = await challengeQuery;

    res.status(200).json({
      success: true,
      count: challenges.length,
      challenges,
    });
  })
);

// Get a single challenges
router.get(
  "/challenges/:id",
  asyncHandler(async (req, res, next) => {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res
        .status(404)
        .json({ success: false, message: "Challenge not found" });
    }
    res.status(200).json({
      success: true,
      challenge,
    });
  })
);

// Create a new challenges
router.post(
  "/challenges",
  asyncHandler(async (req, res) => {
    const challenge = await Challenge.create(req.body);

    res.status(201).json({
      success: true,
      quiz: challenge,
    });
  })
);

// Update a challenges
router.patch(
  "/challenges/:id",
  asyncHandler(async (req, res, next) => {
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!challenge) {
      return res
        .status(404)
        .json({ success: false, message: "Challenge not found" });
    }
    res.status(200).json({
      success: true,
      challenge,
    });
  })
);

// Delete a challenges
router.delete(
  "/challenges/:id",
  asyncHandler(async (req, res, next) => {
    const challenge = await Challenge.findByIdAndDelete(req.params.id);
    if (!challenge) {
      return res
        .status(404)
        .json({ success: false, message: "Challenge not found" });
    }
    res.status(204).json({
      success: true,
      data: null,
    });
  })
);

router.delete(
  "/challenges/daily",
  asyncHandler(async (req, res, next) => {
    const challenge = await Challenge.findOne({ isDaily: true }).sort({
      createdAt: -1,
    });
    if (!challenge) {
      return res
        .status(404)
        .json({ success: false, message: "No daily challenge available" });
    }
    res.status(200).json({ success: true, data: challenge });
  })
);

module.exports = router;
