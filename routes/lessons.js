const express = require("express");
const router = express.Router();
const Lesson = require("../models/lessonModel");
const { default: mongoose } = require("mongoose");
const ErrorHandler = require("../utils/ErrorHandler");
router.get("/lessons", async (req, res) => {
  try {
    const lessons = await Lesson.find();
    res.status(200).send(lessons);
  } catch (error) {
    res.status(500).send(error);
  }
});
router.get("/lessons/:id", async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).send();
    }

    // Assuming `language` field specifies the code language for prettier
    // and `code` contains the actual code to be formatted.
    const formattedContent = await Promise.all(
      lesson.content.map(async (block) => {
        if (block.type === "code" && block.code) {
          try {
            // Use prettier to format the code block
            const formattedCode = prettier.format(block.code, {
              parser: block.language || "babel", // Default to "babel" if language is not specified
              plugins: [require("prettier/parser-babel")], // Make sure to include the necessary parser
            });
            return { ...block.toObject(), code: formattedCode }; // Update the code with formatted version
          } catch (error) {
            console.error("Error formatting code:", error);
            return block; // Return the original block if formatting fails
          }
        } else {
          return block; // Return the block unchanged if not a code block
        }
      })
    );

    // Update the lesson content with the formatted code blocks
    const formattedLesson = { ...lesson.toObject(), content: formattedContent };

    res.status(200).send(formattedLesson);
  } catch (error) {
    res.status(500).send(error);
  }
});
router.patch("/lesson/:lessonId/content/:contentId", async (req, res, next) => {
  try {
    const { lessonId, contentId } = req.params;
    const { type, text } = req.body;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return next(new ErrorHandler("Lesson not found"));
    }
    const contentBlock = lesson.content.find((block) => {
      return block._id.toString() === contentId.toString();
    });

    contentBlock.text = text;
    contentBlock.type = type;

    await lesson.save({ validateBeforeSave: false });

    res.status(200).json({
      message: "Content updated successfully",
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

//Add Lesson Content
router.patch("/lesson/:lessonId/content", async (req, res, next) => {
  const { lessonId } = req.params;
  console.log(req.body);
  const { text, type, language } = req.body;

  if (!text || !type) {
    return next(new ErrorHandler("Please fill all fields", 400));
  }

  if (type === "code" && !language) {
    return next(new ErrorHandler("Please provide a code language", 400));
  }

  let content = { text, type };

  if (type === "code" && language) {
    content.language = language;
  }
  try {
    await Lesson.findByIdAndUpdate(lessonId, {
      $push: {
        content,
      },
    });
    res.status(201).json({
      message: "Content added successfully",
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
});

module.exports = router;
