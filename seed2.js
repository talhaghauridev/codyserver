const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const Category = require("./models/category");
const Course = require("./models/courseModel");

mongoose.set("strictQuery", false);

mongoose.connect(
  "mongodb+srv://alighouridev:wMSxuw2Dx5EPjInL@cluster0.5gfj4zc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
  }
);

const generateUniqueValue = (generator) => {
  const used = new Set();
  return function () {
    let value;
    do {
      value = generator();
    } while (used.has(value));
    used.add(value);
    return value;
  };
};

const uniqueWordNoun = generateUniqueValue(() => faker.word.noun());
const uniqueWords = generateUniqueValue(() => faker.lorem.words(3));

const generateCategories = async (count) => {
  const categories = [];
  for (let i = 0; i < count; i++) {
    const category = new Category({
      name: uniqueWordNoun(),
      icon: faker.image.avatar(),
      courseCount: 0, // Initialize courseCount to 0
    });
    await category.save();
    categories.push(category);
  }
  return categories;
};

const generateCourses = async (categories, count) => {
  const courses = [];
  const categoryUpdateOps = categories.map((category) => ({
    updateOne: {
      filter: { _id: category._id },
      update: { $inc: { courseCount: 0 } }, // Will be incremented later
    },
  }));

  for (let i = 0; i < count; i++) {
    const randomCategory = faker.helpers.arrayElement(categories);
    const course = new Course({
      title: uniqueWords(),
      category: randomCategory._id,
      banner: faker.image.url(),
      logo: faker.image.url(),
      certificate: faker.datatype.boolean(),
      coverImage: faker.image.url(),
      tags: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
        faker.word.noun()
      ),
      lessonsCount: faker.number.int({ min: 5, max: 20 }),
      duration: faker.number.int({ min: 60, max: 300 }),
      studentsEnrolled: faker.number.int({ min: 0, max: 1000 }),
      difficulty: faker.helpers.arrayElement([
        "beginner",
        "intermediate",
        "advanced",
      ]),
      description: faker.lorem.paragraph(),
      status: faker.helpers.arrayElement(["published"]),
      publishedAt: faker.date.past(),
    });
    await course.save();
    courses.push(course);

    // Increment the courseCount for the category
    categoryUpdateOps.find((op) =>
      op.updateOne.filter._id.equals(randomCategory._id)
    ).updateOne.update.$inc.courseCount++;
  }

  // Bulk update categories with their course counts
  await Category.bulkWrite(categoryUpdateOps);

  return courses;
};

const seedDatabase = async () => {
  try {
    await Category.deleteMany({});
    await Course.deleteMany({});

    console.log("Existing data cleared.");

    const categories = await generateCategories(5);
    console.log(`${categories.length} categories created.`);

    const courses = await generateCourses(categories, 10);
    console.log(`${courses.length} courses created.`);

    // Fetch and log updated categories
    const updatedCategories = await Category.find();
    updatedCategories.forEach((category) => {
      console.log(
        `Category "${category.name}" has ${category.courseCount} courses.`
      );
    });

    console.log("Database seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    mongoose.disconnect();
  }
};

seedDatabase();
