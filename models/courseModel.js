const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
    title: String,
    description: String,
    duration: Number,
    lessons: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lesson",
        },
    ],
});

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    level: {
        type: String,
        required: true,
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
    lessons: {
        type: Number,
        default: 0,
    },
    duration: {
        type: Number,
        default: 0,
    },
    students: {
        type: Number,
        default: 0,
    },
    description: String,
    topics: [topicSchema],
});

module.exports = mongoose.model("Course", courseSchema);
