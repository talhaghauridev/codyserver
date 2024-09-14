const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: [true, "An assessment item must belong to a lesson"],
      index: true,
    },

    question: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
      maxlength: [500, "Question text cannot exceed 500 characters"],
    },
    options: [
      {
        optionText: {
          type: String,
          required: true,
          trim: true,
          maxlength: [200, "Option text cannot exceed 200 characters"],
        },
        isCorrect: {
          type: Boolean,
          required: true,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure that only one option is marked as correct
quizSchema.pre("save", function (next) {
  const correctOptions = this.options.filter((option) => option.isCorrect);
  if (correctOptions.length !== 1) {
    next(new Error("Exactly one option must be marked as correct"));
  } else {
    next();
  }
});

const Quiz = mongoose.model("Quiz", quizSchema);
module.exports = Quiz;
