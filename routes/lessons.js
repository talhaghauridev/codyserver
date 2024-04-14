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
router.put("/lesson/:lessonId/content/:contentId", async (req, res, next) => {
  try {
    const { lessonId, contentId } = req.params;
    const { type, text, title, duration } = req.body;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).send();
    }
    console.log(lessonId, contentId);
    const updateData = {
      content: {
        type,
        text,
      },
    };
    if (title && duration) {
      updateData.title = title;
      updateData.duration = duration;
    }

   
    const contentIndex = lesson.content.filter((block) => {
      return block._id.toString() === contentId.toString();
    });

    // console.log(lesson.content);

    console.log(contentIndex);
    const updatedLesson = await Lesson.findByIdAndUpdate(
      id,
      {
        $set: updateData,
      },
      { new: true }
    );
    res.status(200).json({
      message: "Content updated successfully",
      contentIndex,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
