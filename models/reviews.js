const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Review must belong to a course"],
    },
    rating: {
      type: Number,
      required: [true, "Review must have a rating"],
      min: 1,
      max: 5,
    },
    content: {
      type: String,
      required: [true, "Review must have content"],
      trim: true,
      maxlength: [500, "Review cannot be more than 500 characters"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ course: 1, user: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
