const express = require("express");
const router = express.Router();
const Lesson = require("../models/lessonModel");
const { default: mongoose } = require("mongoose");
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
    const { type, text, language } = req.body;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).send();
    }
    console.log(lessonId, contentId);
    const contentBlock = lesson.content.find((block) => {
      return block._id.toString() === contentId.toString();
    });
    if (language) {
      contentBlock.language = language;
    }
    console.log(contentBlock);
    contentBlock.text = text;
    contentBlock.type = type;

    await lesson.save();

    res.status(200).json({
      message: "Content updated successfully",
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch("/lesson/:lessonId/content", async (req, res) => {
  const { lessonId } = req.params;
  console.log(req.body);
  try {
    const content = await Lesson.findByIdAndUpdate(lessonId, {
      $push: {
        content: req.body,
      },
    });
    res.status(201).json({
      message: "Content added successfully",
    });
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
