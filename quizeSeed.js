const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const Lesson = require("./models/lessonModel");
const Quiz = require("./models/Quiz");

mongoose.set("strictQuery", false);

mongoose.connect(
  "mongodb+srv://alighouridev:wMSxuw2Dx5EPjInL@cluster0.5gfj4zc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
  }
);

const generateQuizForLesson = async (lesson) => {
  const questionCount = faker.number.int({ min: 3, max: 5 });
  const quizzes = [];

  for (let i = 0; i < questionCount; i++) {
    const options = [
      { optionText: faker.lorem.sentence(), isCorrect: false },
      { optionText: faker.lorem.sentence(), isCorrect: false },
      { optionText: faker.lorem.sentence(), isCorrect: false },
      { optionText: faker.lorem.sentence(), isCorrect: false },
    ];
    const correctIndex = faker.number.int({ min: 0, max: 3 });
    options[correctIndex].isCorrect = true;

    const quiz = new Quiz({
      lesson: lesson._id,
      question: faker.lorem.sentence() + "?",
      options: options,
    });
    await quiz.save();
    quizzes.push(quiz);
  }

  return quizzes;
};

const seedQuizzes = async () => {
  try {
    console.log("Starting quiz seeding process...");

    // Get all lessons that don't have quizzes yet
    const lessons = await Lesson.find({ quiz: { $size: 0 } });
    console.log(`Found ${lessons.length} lessons without quizzes.`);

    let totalQuizzesCreated = 0;

    for (const lesson of lessons) {
      const quizzes = await generateQuizForLesson(lesson);
      lesson.quiz = quizzes.map((quiz) => quiz._id);
      await lesson.save();
      totalQuizzesCreated += quizzes.length;

      console.log(
        `Created ${quizzes.length} quizzes for lesson: ${lesson.title}`
      );
    }

    console.log(`Total quizzes created: ${totalQuizzesCreated}`);
    console.log("Quiz seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding quizzes:", error);
  } finally {
    mongoose.disconnect();
  }
};

seedQuizzes();
