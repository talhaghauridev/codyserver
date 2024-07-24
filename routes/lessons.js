const express = require("express");
const router = express.Router();
const Lesson = require("../models/lessonModel");
const { default: mongoose } = require("mongoose");
const ErrorHandler = require("../utils/ErrorHandler");
const { calculateDuration } = require("../utils/calculateDuration");
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
    console.log(formattedContent);

    const filteredContent = formattedContent.map((item) => {
      if (
        item.type !== "code" &&
        (item.language === undefined || item.language === "")
      ) {
        const { language, ...itemWithoutLanguage } = item.toObject();
        return itemWithoutLanguage;
      }
      return item;
    });
    const formattedLesson = { ...lesson.toObject(), content: filteredContent };

    res.status(200).send(formattedLesson);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

// Add Lesson Content
router.patch("/lesson/:lessonId/content", async (req, res, next) => {
  const { lessonId } = req.params;
  const { text, type, language } = req.body;

  if (!text || !type) {
    return next(new ErrorHandler("Please fill all fields", 400));
  }

  if (type === "code" && !language) {
    return next(new ErrorHandler("Please provide a code language", 400));
  }
  if (type !== "code" && language) {
    return next(new ErrorHandler("Please select the Code Type"));
  }

  let content = { text, type };
  if (type === "code" && language) {
    content.language = language;
  }

  try {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return next(new ErrorHandler("Lesson not found"));
    }

    // Add new content
    lesson.content.push(content);

    // Recalculate duration
    lesson.duration = calculateDuration(lesson.content);

    await lesson.save({ validateBeforeSave: false });

    res.status(201).json({
      message: "Content added successfully",
      duration: lesson.duration,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// Update Lesson Content
router.patch("/lesson/:lessonId/content/:contentId", async (req, res, next) => {
  const { lessonId, contentId } = req.params;
  const { type, text, language } = req.body;

  if (!text || !type) {
    return next(new ErrorHandler("Please fill all fields", 400));
  }

  if (type === "code" && !language) {
    return next(new ErrorHandler("Please provide a code language", 400));
  }
  if (type !== "code" && language) {
    return next(new ErrorHandler("Please select the Code Type"));
  }

  try {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return next(new ErrorHandler("Lesson not found"));
    }

    const contentBlock = lesson.content.find(
      (block) => block._id.toString() === contentId.toString()
    );
    if (!contentBlock) {
      return next(new ErrorHandler("Content block not found"));
    }

    // Update content block
    contentBlock.text = text;
    contentBlock.type = type;
    contentBlock.language = type === "code" ? language : "";

    // Recalculate duration
    lesson.duration = calculateDuration(lesson.content);

    await lesson.save({ validateBeforeSave: false });

    res.status(200).json({
      message: "Content updated successfully",
      duration: lesson.duration,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

//Delete Lesson Content
router.delete(
  "/lesson/:lessonId/content/:contentId",
  async (req, res, next) => {
    const { lessonId, contentId } = req.params;

    try {
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return next(new ErrorHandler("Lesson not found"));
      }

      // Remove content block
      lesson.content = lesson.content.filter(
        (block) => block._id.toString() !== contentId.toString()
      );

      // Recalculate duration
      lesson.duration = calculateDuration(lesson.content);

      await lesson.save({ validateBeforeSave: false });

      res.status(200).json({
        message: "Content deleted successfully",
        duration: lesson.duration,
      });
    } catch (error) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);

module.exports = router;
