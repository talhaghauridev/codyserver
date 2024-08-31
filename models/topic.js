const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  duration: {
    type: Number,
    default: 0,
  },
  lessons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },
  ],
});
topicSchema.index({ courseId: 1 });
const Topic = mongoose.model("Topic", topicSchema);
module.exports = Topic;
