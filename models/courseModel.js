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
    // New fields for overall rating
    overallRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numberOfRatings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ category: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ status: 1, publishedAt: -1 });
courseSchema.index({ title: "text", description: "text", tags: "text" });

// Method to update the overall rating
courseSchema.methods.updateOverallRating = async function (newRating) {
  this.overallRating =
    (this.overallRating * this.numberOfRatings + newRating) /
    (this.numberOfRatings + 1);
  this.numberOfRatings += 1;
  await this.save();
};

// Static method to calculate and update the overall rating
courseSchema.statics.calculateAverageRating = async function (courseId) {
  const stats = await this.aggregate([
    { $match: { _id: courseId } },
    {
      $lookup: {
        from: "reviews",
        localField: "reviews",
        foreignField: "_id",
        as: "reviewsData",
      },
    },
    { $unwind: "$reviewsData" },
    {
      $group: {
        _id: "$_id",
        averageRating: { $avg: "$reviewsData.rating" },
        numberOfRatings: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await this.findByIdAndUpdate(courseId, {
      overallRating: stats[0].averageRating,
      numberOfRatings: stats[0].numberOfRatings,
    });
  } else {
    await this.findByIdAndUpdate(courseId, {
      overallRating: 0,
      numberOfRatings: 0,
    });
  }
};

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
