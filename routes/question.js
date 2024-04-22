const express = require("express");
const router = express.Router();
const Question = require("../models/QuestionModel");
const Lesson = require("../models/lessonModel");

router.post("/questions/:lessonId", async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    // Validate request body
    const { question, answer, options } = req.body;

    // Create question
    const quiz = await Question.create({ question, answer, options, lessonId });
    if (!quiz) {
      return res.status(500).json({ message: "Failed to create quiz" });
    }

    // Update lesson with quiz
    lesson.quiz.push(quiz._id);
    await lesson.save();

    res.status(201).json({ message: "Quiz created successfully" });
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/questions/:lessonId", async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId).populate("quiz");
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    res
      .status(201)
      .json({ question: lesson.quiz, questionCount: lesson.quiz.length });
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/questions/:lessonId/:questionId", async (req, res) => {
  try {
    const { lessonId, questionId } = req.params;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    await Question.findByIdAndDelete(questionId);
    lesson.quiz = lesson.quiz.filter((i) => i.toString() !== questionId);

    await lesson.save();

    res.status(201).json({ message: "Quiz delete successfully" });
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
module.exports = router;
