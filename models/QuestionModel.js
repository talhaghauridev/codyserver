const { Schema, default: mongoose } = require("mongoose");

const questionSchema = new Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  options: {
    a: String,
    b: String,
    c: String,
    d: String,
  },
  lessonId: {
    type: Schema.Types.ObjectId,
    ref: "Lesson",
    required: true,
  },
});

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
