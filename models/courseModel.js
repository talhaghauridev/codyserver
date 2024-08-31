const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "A course must belong to a category"],
    },
    banner: {
      type: String,
      default:
        "https://miro.medium.com/v2/resize:fit:1024/1*YQgaKfVzK-YpxyT3NYqJAg.png",
    },
    logo: {
      type: String,

      default: "https://www.learn-js.org/static/img/favicons/learn-js.org.ico",
    },
    certificate: {
      type: Boolean,
      default: false,
    },
    coverImage: {
      type: String,
      required: [true, "Cover image URL is required"],
      default:
        "https://miro.medium.com/v2/resize:fit:1024/1*YQgaKfVzK-YpxyT3NYqJAg.png",
    },
    tags: [String],
    lessonsCount: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    studentsEnrolled: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    description: {
      type: String,
      required: [true, "A course must have a description"],
    },
    tags: [String],
    topics: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
      },
    ],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ category: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ status: 1, publishedAt: -1 });
courseSchema.index({ title: "text", description: "text", tags: "text" });
const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
