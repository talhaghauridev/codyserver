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
        quizCompleted: {
          type: Boolean,
          default: false,
        },
        completed: { type: Boolean, default: false },
        progress: { type: Number, default: 0 },
        lastAccessDate: { type: Date },
      },
    ],
  },
  { timestamps: true }
);
enrolledCourseSchema.index({ user: 1, course: 1 }, { unique: true });
const EnrolledCourse = mongoose.model("EnrolledCourse", enrolledCourseSchema);

module.exports = EnrolledCourse;
