const mongoose = require("mongoose");
const Streak = require("./models/streak"); // Adjust the path to your Streak model

mongoose.connect(
  "mongodb+srv://alighouridev:wMSxuw2Dx5EPjInL@cluster0.5gfj4zc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increase the timeout (30 seconds)
  }
);

const getRandomDateIn2023 = () => {
  const start = new Date("2023-01-01T00:00:00Z");
  const end = new Date("2023-12-31T23:59:59Z");
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

const generateRandomStreakData = (userId) => {
  const streak = new Streak({
    userId,
    currentStreak: Math.floor(Math.random() * 30),
    longestStreak: Math.floor(Math.random() * 30),
    lastActivityDate: getRandomDateIn2023(),
    totalLessonsCompleted: Math.floor(Math.random() * 100),
    totalCoursesCompleted: Math.floor(Math.random() * 20),
    totalStudyHours: Math.floor(Math.random() * 200),
    dailyActivities: Array.from({ length: 365 }, (_, i) => ({
      date: new Date(`2023-01-01T00:00:00Z`).setDate(i + 1),
      lessonsCompleted: Math.floor(Math.random() * 10),
      coursesCompleted: Math.floor(Math.random() * 5),
      studyHours: Math.floor(Math.random() * 5),
    })),
    achievements: [],
    createdAt: getRandomDateIn2023(),
    updatedAt: getRandomDateIn2023(),
  });

  return streak;
};

const addStreakDataForUser = async (userId) => {
  try {
    const streak = generateRandomStreakData(userId);
    await streak.save();
    console.log(`Streak data added for user ${userId}`);
  } catch (error) {
    console.error("Error adding streak data:", error);
  }
};

const userId = "66a10ae57e83b602549a6ede"; // Replace with actual userId

addStreakDataForUser(userId).then(() => {
  mongoose.connection.close();
});
