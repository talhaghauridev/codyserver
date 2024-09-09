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

const programmingCategories = [
  { name: "Web Development", icon: "🌐" },
  { name: "Mobile Development", icon: "📱" },
  { name: "Data Science", icon: "📊" },
  { name: "DevOps", icon: "🛠️" },
  { name: "Artificial Intelligence", icon: "🤖" },
];

const courseData = [
  {
    title: "Master HTML5",
    category: "Web Development",
    description: `
# Master HTML5: The Foundation of Web Development

## Course Overview
This comprehensive course will take you from HTML basics to advanced techniques, ensuring you have a solid foundation in web development.

## What You'll Learn
- HTML5 document structure
- Semantic elements and their importance
- Forms and input types
- Multimedia integration
- Accessibility best practices

## Course Highlights
- Hands-on projects
- Real-world examples
- Best practices for modern web development

By the end of this course, you'll be able to create structured, semantic, and accessible web pages with confidence.
    `,
    difficulty: "beginner",
  },
  {
    title: "CSS3 Mastery",
    category: "Web Development",
    description: `
# CSS3 Mastery: Styling the Modern Web

## Course Overview
Dive deep into CSS3 and learn how to create beautiful, responsive designs for the web.

## What You'll Learn
- CSS selectors and specificity
- Flexbox and Grid layouts
- Animations and transitions
- Responsive design techniques
- CSS preprocessors (Sass)

## Course Highlights
- Interactive coding exercises
- Design challenges
- Cross-browser compatibility techniques

Master the art of styling web applications and create visually stunning interfaces with CSS3.
    `,
    difficulty: "intermediate",
  },
  {
    title: "JavaScript Essentials",
    category: "Web Development",
    description: `
# JavaScript Essentials: Bringing Interactivity to the Web

## Course Overview
Learn the fundamentals of JavaScript and how to create dynamic, interactive web applications.

## What You'll Learn
- Variables, data types, and functions
- DOM manipulation
- Asynchronous JavaScript (Promises, async/await)
- ES6+ features
- Error handling and debugging

## Course Highlights
- Coding challenges
- Building mini-projects
- Best practices for clean, efficient code

Gain the skills to add interactivity and functionality to your web pages with JavaScript.
    `,
    difficulty: "intermediate",
  },
  {
    title: "React.js: Building Modern UIs",
    category: "Web Development",
    description: `
# React.js: Building Modern User Interfaces

## Course Overview
Master React.js and learn to build efficient, scalable, and maintainable user interfaces.

## What You'll Learn
- React components and JSX
- State management with hooks
- Context API and Redux
- Routing with React Router
- Performance optimization techniques

## Course Highlights
- Building a full-scale React application
- Testing React components
- Integrating with backend APIs

Become proficient in React.js and create powerful single-page applications with ease.
    `,
    difficulty: "advanced",
  },
  {
    title: "Node.js Backend Development",
    category: "Web Development",
    description: `
# Node.js Backend Development: Server-Side JavaScript

## Course Overview
Learn to build scalable and efficient backend systems with Node.js and Express.

## What You'll Learn
- Setting up a Node.js environment
- Creating RESTful APIs with Express
- Database integration (MongoDB)
- Authentication and authorization
- Deployment and scaling Node.js applications

## Course Highlights
- Building a complete backend for a web application
- Performance optimization techniques
- Best practices for secure Node.js applications

Master server-side JavaScript and become a full-stack developer with Node.js.
    `,
    difficulty: "advanced",
  },
];

const generateCategories = async () => {
  const categories = [];
  for (const category of programmingCategories) {
    const newCategory = new Category({
      name: category.name,
      icon: category.icon,
      courseCount: 0,
    });
    await newCategory.save();
    categories.push(newCategory);
  }
  return categories;
};

const generateCourses = async (categories) => {
  const courses = [];
  const categoryUpdateOps = categories.map((category) => ({
    updateOne: {
      filter: { _id: category._id },
      update: { $inc: { courseCount: 0 } },
    },
  }));

  for (const courseInfo of courseData) {
    const category = categories.find((c) => c.name === courseInfo.category);
    const course = new Course({
      title: courseInfo.title,
      category: category._id,
      banner: faker.image.url(),
      logo: faker.image.url(),
      certificate: true,
      coverImage: faker.image.url(),
      tags: [
        courseInfo.category.toLowerCase(),
        ...courseInfo.title.toLowerCase().split(" "),
      ],
      lessonsCount: faker.number.int({ min: 10, max: 20 }),
      duration: faker.number.int({ min: 600, max: 1800 }),
      studentsEnrolled: faker.number.int({ min: 100, max: 10000 }),
      difficulty: courseInfo.difficulty,
      description: courseInfo.description,
      status: "published",
      publishedAt: faker.date.past(),
    });
    await course.save();
    courses.push(course);

    categoryUpdateOps.find((op) => op.updateOne.filter._id.equals(category._id))
      .updateOne.update.$inc.courseCount++;
  }

  await Category.bulkWrite(categoryUpdateOps);

  return courses;
};

const seedDatabase = async () => {
  try {
    await Category.deleteMany({});
    await Course.deleteMany({});

    console.log("Existing data cleared.");

    const categories = await generateCategories();
    console.log(`${categories.length} categories created.`);

    const courses = await generateCourses(categories);
    console.log(`${courses.length} courses created.`);

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
