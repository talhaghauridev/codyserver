const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    language: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["Easy", "Medium", "Hard"],
    },
    description: {
      type: String,
      required: true,
    },
    codeSnippet: {
      type: String,
      required: true,
    },
    estimatedTime: {
      type: String,
      required: true,
    },
    isDaily: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Challenge = mongoose.model("Challenge", challengeSchema);
module.exports = Challenge;
