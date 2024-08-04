// streakController.js
const isAuthenticated = require("../middlewares/auth");
const Streak = require("../models/streak");
const express = require("express");

const router = express.Router();

router.get("/streak", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const streak = await Streak.getOrCreateStreak(userId);
    res.json({
      streak,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching streak data", error: error.message });
  }
});

router.post("/streak-update", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const { lessonsCompleted, coursesCompleted, studyHours } = req.body;
    const streak = await Streak.getOrCreateStreak(userId);
    const updatedStreak = await streak.updateStreak(
      new Date(),
      Number(lessonsCompleted) || 0,
      Number(coursesCompleted) || 0,
      Number(studyHours) || 0
    );
    res.json(updatedStreak);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating streak", error: error.message });
  }
});

router.get("/achievements", async (req, res) => {
  try {
    const userId = req.user._id;
    const streak = await Streak.getOrCreateStreak(userId);
    res.json(streak.achievements);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching achievements", error: error.message });
  }
});

module.exports = router;
