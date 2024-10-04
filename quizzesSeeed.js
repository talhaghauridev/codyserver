const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const Quiz = require("./models/quizModel");
const Category = require("./models/category");

mongoose.connect(
  "mongodb+srv://alighouridev:wMSxuw2Dx5EPjInL@cluster0.5gfj4zc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
  }
);

const difficulties = ["beginner", "intermediate", "advanced"];
const icons = [
  "html5",
  "css3",
  "js",
  "react",
  "node",
  "python",
  "java",
  "swift",
  "kotlin",
];

const generateQuizQuestion = () => {
  const options = [
    { optionText: faker.lorem.sentence(), isCorrect: false },
    { optionText: faker.lorem.sentence(), isCorrect: false },
    { optionText: faker.lorem.sentence(), isCorrect: false },
    { optionText: faker.lorem.sentence(), isCorrect: true },
  ];

  return {
    question: faker.lorem.sentence() + "?",
    options: faker.helpers.shuffle(options),
  };
};

const generateQuiz = (categoryId) => {
  const questionCount = faker.number.int({ min: 5, max: 20 });
  const questions = Array.from({ length: questionCount }, generateQuizQuestion);

  return {
    title: faker.lorem.words({ min: 3, max: 6 }),
    icon: faker.helpers.arrayElement(icons),
    category: categoryId,
    info: `${questionCount} questions • ${faker.number.int({ min: 10, max: 60 })} min`,
    difficulty: faker.helpers.arrayElement(difficulties),
    attempts: faker.number.int({ min: 0, max: 10000 }),
    description: faker.lorem.paragraph(),
    tags: faker.helpers.arrayElements(
      [
        "JavaScript",
        "React",
        "Node.js",
        "Python",
        "Java",
        "SQL",
        "NoSQL",
        "AWS",
        "Docker",
        "Kubernetes",
      ],
      { min: 2, max: 5 }
    ),
    questions: questions,
  };
};

const seedDatabase = async (quizCount = 20) => {
  try {
    // Fetch existing categories
    const categories = await Category.find();
    if (categories.length === 0) {
      console.error(
        "No categories found in the database. Please create categories first."
      );
      return;
    }
    console.log(`Found ${categories.length} existing categories`);

    // Clear existing quizzes
    await Quiz.deleteMany({});
    console.log("Cleared existing quizzes");

    const quizzes = [];
    for (let i = 0; i < quizCount; i++) {
      const randomCategory = faker.helpers.arrayElement(categories);
      const quiz = generateQuiz(randomCategory._id);
      quizzes.push(quiz);
    }

    await Quiz.insertMany(quizzes);
    console.log(`${quizCount} quizzes seeded successfully`);

    // Update category counts
    for (const category of categories) {
      const count = await Quiz.countDocuments({ category: category._id });
      await Category.findByIdAndUpdate(category._id, { courseCount: count });
    }
    console.log("Category counts updated");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

// Run the seeding process
seedDatabase();
