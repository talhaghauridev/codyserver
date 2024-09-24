const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors"); // Import CORS
const courseRoutes = require("./routes/courses");
const lessonRoutes = require("./routes/lessons");
const userRoutes = require("./routes/user");
const topicRoutes = require("./routes/topic");
const quizRoutes = require("./routes/question");
const streakRoutes = require("./routes/streak");
const certificateRoutes = require("./routes/certificate");
const coursev2 = require("./routes/v2/courses");
const categoryv2 = require("./routes/v2/category");
const topicsv2 = require("./routes/v2/topics");
const lessonsv2 = require("./routes/v2/lessons");
const reviewsv2 = require("./routes/v2/reviews");
const quizsv2 = require("./routes/v2/quiz");
const bookmarksv2 = require("./routes/v2/bookmark");
const lessonModel = require("./models/lessonModel");
const courseModel = require("./models/courseModel");
const streak = require("./models/streak");
const User = require("./models/userModel");
require("dotenv").config();
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(cors()); // Use CORS with default options - allows all origins
app.use(bodyParser.json());

mongoose
  .connect(
    "mongodb+srv://alighouridev:wMSxuw2Dx5EPjInL@cluster0.5gfj4zc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
    }
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));
// Courses
// Add a new course
app.get("/", async (req, res) => {
  res.status(201).send("Api is Live 🔥");
});
app.use("/", courseRoutes);
app.use("/", lessonRoutes);
app.use("/", userRoutes);
app.use("/", topicRoutes);
app.use("/", quizRoutes);
app.use("/certificate", certificateRoutes);
app.use("/", streakRoutes);
app.use(
  "/api/v2",
  coursev2,
  categoryv2,
  topicsv2,
  lessonsv2,
  reviewsv2,
  quizsv2,
  bookmarksv2
);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

const PORT = 3001;
app.listen(PORT, async () => {
  // await streak.deleteMany();
  // const users = await User.find().select("+otp.code +otp.expiry +otpPurpose");
  // console.log({ user: JSON.parse(JSON.stringify(users, null, 4)) });
  // await User.deleteMany();
  // await Category.deleteMany();
  // const course = await courseModel.find({ status: "published" });
  // console.log(course.length);
  // await courseModel.updateMany({ status: "published" });
  // await EnrolledCourse.findByIdAndUpdate("66d46fac8ae554791d76e199",{
  // await User.findOneAndDelete({
  //   email: "alighauridev@gmail.com",
  // });
  // })
  // await EnrolledCourse.deleteMany();
  const userId = "66eef27e1f5cfb0e71407870";
  const courseId = "66d4480beb49f0c20f0bcde6";

  // await EnrolledCourse.deleteMany();

  // await userModel.findByIdAndUpdate(userId, {
  //   $set: {
  //     enrolledCourses: [],
  //   },
  // });
  console.log(`Server is running on port ${PORT}`);
});

const USER_ID = mongoose.Types.ObjectId("66a10ae57e83b602549a6ede");

// Function to generate random activity data
const generateRandomActivity = () => ({
  lessonsCompleted: Math.floor(Math.random() * 5),
  coursesCompleted: Math.floor(Math.random() * 2),
  studyHours: Math.round((Math.random() * 4 + 0.5) * 10) / 10, // 0.5 to 4.5 hours, rounded to 1 decimal
});

// Function to insert dummy data for a specific date
const insertDummyDataForDate = async (streak, date) => {
  const activity = generateRandomActivity();
  await streak.updateStreak(
    date,
    activity.lessonsCompleted,
    activity.coursesCompleted,
    activity.studyHours
  );
};
const Streak = require("./models/streak");
const moment = require("moment");
const Course = require("./models/courseModel");
const Category = require("./models/category");
const EnrolledCourse = require("./models/enrolledCourse");
const userModel = require("./models/userModel");
// Main function to insert dummy data
const insertDummyData = async () => {
  try {
    let streak = await Streak.findOne({ userId: USER_ID });
    if (!streak) {
      streak = new Streak({ userId: USER_ID });
    }

    // Generate data for the past year
    const endDate = moment().endOf("day");
    const startDate = moment(endDate).subtract(1, "year").startOf("day");

    for (
      let m = moment(startDate);
      m.isSameOrBefore(endDate);
      m.add(1, "day")
    ) {
      // Randomly skip some days to create gaps in the streak
      if (Math.random() > 0.7) {
        await insertDummyDataForDate(streak, m.toDate());
      }
    }

    console.log("Dummy data inserted successfully!");
  } catch (error) {
    console.error("Error inserting dummy data:", error);
  } finally {
    mongoose.disconnect();
  }
};

// Run the script
// insertDummyData();
