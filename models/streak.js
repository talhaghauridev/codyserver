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
  const today = new Date(activityDate);
  today.setHours(0, 0, 0, 0);

  let dailyActivity = this.dailyActivities.find(
    (activity) => activity.date.getTime() === today.getTime()
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
      (today - this.lastActivityDate) / (1000 * 60 * 60 * 24) > 1
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

  // Update the daily activity
  dailyActivity.lessonsCompleted += lessonsCompleted;
  dailyActivity.coursesCompleted += coursesCompleted;
  dailyActivity.studyHours += studyHours;

  // Update the totals
  this.totalLessonsCompleted += lessonsCompleted;
  this.totalCoursesCompleted += coursesCompleted;
  this.totalStudyHours += studyHours;

  // Find the index of the daily activity and update it in the array
  const index = this.dailyActivities.findIndex(
    (activity) => activity.date.getTime() === today.getTime()
  );
  if (index !== -1) {
    this.dailyActivities[index] = dailyActivity;
  }

  await this.checkAndUpdateAchievements();
  await this.save();
  return this;
};

streakSchema.methods.checkAndUpdateAchievements = async function () {
  const achievementTypes = [
    { type: "7DayStreak", condition: () => this.currentStreak >= 7 },
    { type: "30DayStreak", condition: () => this.currentStreak >= 30 },
    {
      type: "50LessonsCompleted",
      condition: () => this.totalLessonsCompleted >= 50,
    },
    {
      type: "5CoursesCompleted",
      condition: () => this.totalCoursesCompleted >= 5,
    },
    { type: "100StudyHours", condition: () => this.totalStudyHours >= 100 },
  ];

  const newAchievements = achievementTypes
    .filter(({ type, condition }) => condition() && !this.hasAchievement(type))
    .map(({ type }) => ({ type, achievedDate: new Date() }));

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

// Add these methods to your streakSchema.methods in the Streak model file

streakSchema.methods.getCurrentTwoWeekPeriod = function () {
  const joinDate = moment(this.createdAt).startOf("day");
  const today = moment().startOf("day");

  // Start the period from the join date
  let periodStart = moment(joinDate);

  // If more than 2 weeks have passed since joining, move the start date forward in 2-week increments
  while (periodStart.clone().add(2, "weeks").isBefore(today)) {
    periodStart.add(2, "weeks");
  }

  const periodEnd = periodStart.clone().add(13, "days").endOf("day");

  return { start: periodStart.toDate(), end: periodEnd.toDate() };
};

streakSchema.methods.getTwoWeeksData = function (startDate, endDate) {
  const twoWeeksData = [];
  const start = moment(startDate);
  const end = moment(endDate);

  for (let date = start.clone(); date.isSameOrBefore(end); date.add(1, "day")) {
    const activity = this.dailyActivities.find((a) =>
      moment(a.date).isSame(date, "day")
    );

    twoWeeksData.push({
      date: date.format("YYYY-MM-DD"),
      hasActivity: !!activity,
      lessonsCompleted: activity ? activity.lessonsCompleted : 0,
      coursesCompleted: activity ? activity.coursesCompleted : 0,
      studyHours: activity ? activity.studyHours : 0,
    });
  }

  return twoWeeksData;
};

module.exports = mongoose.model("Streak", streakSchema);
