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
const lessonModel = require("./models/lessonModel");
const courseModel = require("./models/courseModel");
const streak = require("./models/streak");
require("dotenv").config();
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(cors()); // Use CORS with default options - allows all origins
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://alighouridev:wMSxuw2Dx5EPjInL@cluster0.5gfj4zc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ssl: true,
      sslValidate: true,
    }
  )
  .then(() => {
    console.log("MongoDB connected");
  });
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
