const mongoose = require("mongoose");

const contentBlockSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  type: {
    type: String,
    enum: [
      "heading",
      "paragraph",
      "list",
      "code",
      "subHeading",
      "subHeadingText",
      "headingFlex",
      "headingFlexText",
    ],
    required: true,
  },
  text: String,
  item: String,
  language: String,
  code: String,
});

const lessonSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  topicId: {
    type: String,
    required: true,
  },
  title: String,
  duration: {
    type: Number,
    default: 0,
  },
  content: {
    type: String,
    required: true,
  },
  quiz: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
  ],
});

module.exports = mongoose.model("Lesson", lessonSchema);
