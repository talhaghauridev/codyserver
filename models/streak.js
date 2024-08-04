const mongoose = require("mongoose");
const moment = require("moment");

const dailyActivitySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  lessonsCompleted: {
    type: Number,
    default: 0,
  },
  coursesCompleted: {
    type: Number,
    default: 0,
  },
  studyHours: {
    type: Number,
    default: 0,
  },
});

const achievementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "7DayStreak",
      "30DayStreak",
      "50LessonsCompleted",
      "5CoursesCompleted",
      "100StudyHours",
    ],
    required: true,
  },
  achievedDate: {
    type: Date,
    required: true,
  },
});

const streakSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActivityDate: {
      type: Date,
      default: null,
    },
    totalLessonsCompleted: {
      type: Number,
      default: 0,
    },
    totalCoursesCompleted: {
      type: Number,
      default: 0,
    },
    totalStudyHours: {
      type: Number,
      default: 0,
    },
    dailyActivities: [dailyActivitySchema],
    achievements: [achievementSchema],
  },
  {
    timestamps: true,
  }
);

streakSchema.index({ userId: 1, "dailyActivities.date": 1 });

streakSchema.methods.updateStreak = async function (
  activityDate,
  lessonsCompleted,
  coursesCompleted,
  studyHours
) {
  const today = moment(activityDate).startOf("day").toDate();

  let dailyActivity = this.dailyActivities.find((activity) =>
    moment(activity.date).isSame(today, "day")
  );

  if (!dailyActivity) {
    dailyActivity = {
      date: today,
      lessonsCompleted: 0,
      coursesCompleted: 0,
      studyHours: 0,
    };
    this.dailyActivities.push(dailyActivity);

    if (
      !this.lastActivityDate ||
      moment(today).diff(this.lastActivityDate, "days") > 1
    ) {
      this.currentStreak = 1;
    } else {
      this.currentStreak++;
    }

    this.lastActivityDate = today;

    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
  }

  dailyActivity.lessonsCompleted += lessonsCompleted;
  dailyActivity.coursesCompleted += coursesCompleted;
  dailyActivity.studyHours += studyHours;

  this.totalLessonsCompleted += lessonsCompleted;
  this.totalCoursesCompleted += coursesCompleted;
  this.totalStudyHours += studyHours;

  await this.checkAndUpdateAchievements();
  await this.save();
  return this;
};

// Method to check and update achievements
streakSchema.methods.checkAndUpdateAchievements = async function () {
  const newAchievements = [];

  if (this.currentStreak >= 7 && !this.hasAchievement("7DayStreak")) {
    newAchievements.push({ type: "7DayStreak", achievedDate: new Date() });
  }

  if (this.currentStreak >= 30 && !this.hasAchievement("30DayStreak")) {
    newAchievements.push({ type: "30DayStreak", achievedDate: new Date() });
  }

  if (
    this.totalLessonsCompleted >= 50 &&
    !this.hasAchievement("50LessonsCompleted")
  ) {
    newAchievements.push({
      type: "50LessonsCompleted",
      achievedDate: new Date(),
    });
  }

  if (
    this.totalCoursesCompleted >= 5 &&
    !this.hasAchievement("5CoursesCompleted")
  ) {
    newAchievements.push({
      type: "5CoursesCompleted",
      achievedDate: new Date(),
    });
  }

  if (this.totalStudyHours >= 100 && !this.hasAchievement("100StudyHours")) {
    newAchievements.push({ type: "100StudyHours", achievedDate: new Date() });
  }

  this.achievements.push(...newAchievements);
};

streakSchema.methods.hasAchievement = function (achievementType) {
  return this.achievements.some((a) => a.type === achievementType);
};

streakSchema.statics.getOrCreateStreak = async function (userId) {
  let streak = await this.findOne({ userId });
  if (!streak) {
    streak = new this({ userId });
    await streak.save();
  }
  return streak;
};

module.exports = mongoose.model("Streak", streakSchema);
