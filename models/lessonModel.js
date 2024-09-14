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
const lessonSchema = new mongoose.Schema(
  {
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: [true, "A lesson must belong to a topic"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "A lesson must have a title"],
      trim: true,
      maxlength: [100, "A lesson title must be less than 100 characters"],
    },
    duration: {
      type: Number,
      default: 0,
    },
    content: {
      type: String,
      required: [true, "A lesson must have content"],
    },
    quiz: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Lesson", lessonSchema);

// options: [{
//   optionText: {
//     type: String,
//     required: [true, "An option must have text"],
//   },
//   isCorrect: {
//     type: Boolean,
//     required: true,
//   }
// }],
