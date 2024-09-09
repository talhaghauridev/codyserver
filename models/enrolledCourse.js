const mongoose = require("mongoose");

const enrolledCourseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    progress: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    completionDate: { type: Date },
    lessonsCompleted: [
      {
        lesson: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lesson",
          required: true,
        },
        completed: { type: Boolean, default: false },
        progress: { type: Number, default: 0 },
        lastAccessDate: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

const EnrolledCourse = mongoose.model("EnrolledCourse", enrolledCourseSchema);

module.exports = EnrolledCourse;
