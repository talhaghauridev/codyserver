const mongoose = require("mongoose");
const Course = require("./models/courseModel");
const Topic = require("./models/topic");
const Lesson = require("./models/lessonModel");

mongoose.connect(
  "mongodb+srv://alighouridev:wMSxuw2Dx5EPjInL@cluster0.5gfj4zc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const courseTopicsAndLessons = {
  "Master HTML5": [
    {
      title: "HTML Basics",
      lessons: [
        {
          title: "Introduction to HTML",
          content: `
# Introduction to HTML

HTML (Hypertext Markup Language) is the standard markup language for creating web pages. It describes the structure of a web page semantically and originally included cues for the appearance of the document.

## Key Points:
- HTML elements are the building blocks of HTML pages
- HTML elements are represented by tags
- Browsers do not display the HTML tags, but use them to render the content of the page

### Example:
\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <title>My First HTML Page</title>
</head>
<body>
    <h1>Welcome to HTML!</h1>
    <p>This is a paragraph in HTML.</p>
</body>
</html>
\`\`\`

In this lesson, we'll cover the basic structure of an HTML document and introduce you to common HTML tags.
          `,
          duration: 15,
        },
        {
          title: "HTML Document Structure",
          content: `
# HTML Document Structure

Every HTML document has a required structure that includes the following declarations and elements:

## Document Type Declaration
\`\`\`html
<!DOCTYPE html>
\`\`\`
This declaration tells the browser that this is an HTML5 document.

## The HTML Element
\`\`\`html
<html>
  <!-- Your content here -->
</html>
\`\`\`
This is the root element of an HTML page.

## The Head Element
\`\`\`html
<head>
  <title>Page Title</title>
</head>
\`\`\`
This contains meta information about the HTML page.

## The Body Element
\`\`\`html
<body>
  <h1>This is a heading</h1>
  <p>This is a paragraph.</p>
</body>
\`\`\`
This defines the document's body, and is a container for all the visible contents, such as headings, paragraphs, images, hyperlinks, tables, lists, etc.

Understanding this structure is crucial for creating well-formed HTML documents.
          `,
          duration: 20,
        },
      ],
    },
    {
      title: "HTML5 Semantic Elements",
      lessons: [
        {
          title: "Introduction to Semantic HTML",
          content: `
# Introduction to Semantic HTML

Semantic HTML introduces meaning to the web page rather than just presentation. It makes HTML more comprehensible by better defining the different sections and layout of web pages.

## Why Use Semantic Elements?
1. Search engines will consider its contents as important keywords to influence the page's search rankings
2. Screen readers can use it as a signpost to help visually impaired users navigate a page
3. Finding blocks of meaningful code is significantly easier than searching through endless divs
4. Suggests to the developer the type of data that will be populated
5. Semantic naming mirrors proper custom element/component naming

## Common Semantic Elements:
- \`<header>\`: Specifies a header for a document or section
- \`<nav>\`: Defines a set of navigation links
- \`<article>\`: Specifies independent, self-contained content
- \`<section>\`: Defines a section in a document
- \`<aside>\`: Defines content aside from the page content
- \`<footer>\`: Specifies a footer for a document or section

### Example:
\`\`\`html
<header>
  <h1>My Website</h1>
  <nav>
    <ul>
      <li><a href="#home">Home</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
  </nav>
</header>
<main>
  <article>
    <h2>Article Title</h2>
    <p>Article content goes here...</p>
  </article>
  <aside>
    <h3>Related Links</h3>
    <ul>
      <li><a href="#">Link 1</a></li>
      <li><a href="#">Link 2</a></li>
    </ul>
  </aside>
</main>
<footer>
  <p>&copy; 2024 My Website. All rights reserved.</p>
</footer>
\`\`\`

In this lesson, we'll explore how to use semantic elements to create more meaningful and accessible HTML documents.
          `,
          duration: 25,
        },
      ],
    },
  ],
  "CSS3 Mastery": [
    {
      title: "CSS Fundamentals",
      lessons: [
        {
          title: "CSS Selectors and Specificity",
          content: `
# CSS Selectors and Specificity

CSS selectors are patterns used to select and style HTML elements. Understanding selectors and their specificity is crucial for effective styling.

## Types of Selectors:
1. Element Selector: Selects all elements of a specified type.
   \`\`\`css
   p {
     color: blue;
   }
   \`\`\`

2. Class Selector: Selects elements with a specific class attribute.
   \`\`\`css
   .highlight {
     background-color: yellow;
   }
   \`\`\`

3. ID Selector: Selects an element with a specific id attribute.
   \`\`\`css
   #header {
     font-size: 24px;
   }
   \`\`\`

4. Attribute Selector: Selects elements based on an attribute or attribute value.
   \`\`\`css
   input[type="text"] {
     border: 1px solid gray;
   }
   \`\`\`

5. Pseudo-class Selector: Selects elements based on a certain state.
   \`\`\`css
   a:hover {
     text-decoration: underline;
   }
   \`\`\`

## Specificity:
Specificity determines which CSS rule is applied when multiple rules target the same element. It's calculated as follows:

1. Inline styles
2. IDs
3. Classes, attributes, and pseudo-classes
4. Elements and pseudo-elements

The more specific a selector, the higher its priority in applying styles.

### Example:
\`\`\`css
/* Specificity: 0-0-1 */
.text {
  color: black;
}

/* Specificity: 0-1-1 */
#content .text {
  color: blue;
}

/* Specificity: 1-0-0 */
p {
  color: red !important;
}
\`\`\`

In this lesson, we'll dive deeper into various selectors and how specificity affects your CSS rules.
          `,
          duration: 30,
        },
      ],
    },
  ],
  "JavaScript Essentials": [
    {
      title: "JavaScript Basics",
      lessons: [
        {
          title: "Variables and Data Types",
          content: `
# Variables and Data Types in JavaScript

JavaScript is a dynamically typed language, which means you don't have to specify the type of a variable when you declare it. Variables in JavaScript can hold different types of data.

## Declaring Variables
In JavaScript, you can declare variables using \`var\`, \`let\`, or \`const\`.

\`\`\`javascript
var x = 5;
let y = "Hello";
const PI = 3.14;
\`\`\`

- \`var\`: Function-scoped or globally-scoped. Can be redeclared and updated.
- \`let\`: Block-scoped. Can be updated but not redeclared.
- \`const\`: Block-scoped. Cannot be updated or redeclared.

## Data Types
JavaScript has several built-in data types:

1. Number: Represents both integer and floating-point numbers.
   \`\`\`javascript
   let count = 10;
   let price = 99.99;
   \`\`\`

2. String: Represents textual data.
   \`\`\`javascript
   let name = "John";
   let message = 'Hello, World!';
   \`\`\`

3. Boolean: Represents a logical entity and can have only two values: true or false.
   \`\`\`javascript
   let isActive = true;
   let isLoggedIn = false;
   \`\`\`

4. Undefined: Represents a variable that has been declared but has not yet been assigned a value.
   \`\`\`javascript
   let undefinedVar;
   \`\`\`

5. Null: Represents a deliberate non-value or absence of any object value.
   \`\`\`javascript
   let emptyValue = null;
   \`\`\`

6. Object: Represents a collection of related data.
   \`\`\`javascript
   let person = {
     name: "Alice",
     age: 30
   };
   \`\`\`

7. Array: A special type of object used to store multiple values in a single variable.
   \`\`\`javascript
   let fruits = ["Apple", "Banana", "Orange"];
   \`\`\`

8. Symbol (ES6): Represents a unique identifier.
   \`\`\`javascript
   let id = Symbol("id");
   \`\`\`

Understanding these data types and how to work with them is fundamental to JavaScript programming. In this lesson, we'll explore each type in detail and learn how to manipulate them effectively.
          `,
          duration: 25,
        },
      ],
    },
  ],
  "React.js: Building Modern UIs": [
    {
      title: "React Fundamentals",
      lessons: [
        {
          title: "Introduction to React Components",
          content: `
# Introduction to React Components

React is a JavaScript library for building user interfaces, primarily based on the concept of components. Components are the building blocks of any React application, and a single app usually consists of multiple components.

## What is a Component?
A component is a self-contained module that renders some output. We can write interface elements like a button or an input field as a React component.

## Types of Components
There are two main types of components in React:

1. Function Components
2. Class Components

### Function Components
Function components are the simplest way to write components in React. They are pure JavaScript functions that accept props as an argument and return React elements.

\`\`\`jsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}
\`\`\`

### Class Components
Class components are ES6 classes that extend from React.Component and can have state and lifecycle methods.

\`\`\`jsx
class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
\`\`\`

## Creating a Simple Component
Let's create a simple React component:

\`\`\`jsx
import React from 'react';

function HelloWorld() {
  return (
    <div>
      <h1>Hello, World!</h1>
      <p>Welcome to React.</p>
    </div>
  );
}

export default HelloWorld;
\`\`\`

## Using Components
Once you've created a component, you can use it in your application like this:

\`\`\`jsx
import React from 'react';
import HelloWorld from './HelloWorld';

function App() {
  return (
    <div>
      <HelloWorld />
    </div>
  );
}

export default App;
\`\`\`

In this lesson, we'll dive deeper into creating and using components, understanding props, and the component lifecycle. Components are the heart of React, and mastering them is key to becoming proficient in React development.
          `,
          duration: 35,
        },
      ],
    },
  ],
  "Node.js Backend Development": [
    {
      title: "Node.js Basics",
      lessons: [
        {
          title: "Introduction to Node.js",
          content: `
# Introduction to Node.js

Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside of a web browser. Node.js lets developers use JavaScript to write command line tools and for server-side scripting.

## Key Features of Node.js

1. **Asynchronous and Event Driven**: All APIs of Node.js library are asynchronous (non-blocking). This means a Node.js based server never waits for an API to return data.

2. **Very Fast**: Being built on Google Chrome's V8 JavaScript Engine, Node.js library is very fast in code execution.

3. **Single Threaded but Highly Scalable**: Node.js uses a single threaded model with event looping. Event mechanism helps the server to respond in a non-blocking way and makes the server highly scalable.

4. **No Buffering**: Node.js applications never buffer any data. These applications simply output the data in chunks.

## Hello World in Node.js

Let's create a simple "Hello World" program in Node.js:

1. Create a file named \`app.js\`
2. Write the following code:

\`\`\`javascript
console.log("Hello, World!");
\`\`\`

3. Run the program using Node.js:

\`\`\`bash
node app.js
\`\`\`

You should see "Hello, World!" printed in your console.

## Creating a Simple Web Server

Now, let's create a basic HTTP server:

\`\`\`javascript
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World from Node.js!');
});

server.listen(port, hostname, () => {
  console.log(\`Server running at http://\${hostname}:\${port}/\`);
});
\`\`\`

Save this as \`server.js\` and run it using \`node server.js\`. You can then visit \`http://localhost:3000\` in your web browser to see the output.

In this lesson, we'll explore these basics further and start building simple applications with Node.js. Understanding these fundamentals is crucial for backend development with Node.js.
          `,
          duration: 30,
        },
      ],
    },
  ],
};

const seedTopicsAndLessons = async () => {
  try {
    // Clear existing topics and lessons
    await Topic.deleteMany({});
    await Lesson.deleteMany({});

    console.log("Existing topics and lessons cleared.");

    const courses = await Course.find({});

    for (const course of courses) {
      console.log(`Processing course: ${course.title}`);
      const courseTopics = courseTopicsAndLessons[course.title];
      if (courseTopics) {
        for (const topicData of courseTopics) {
          const topic = new Topic({
            title: topicData.title,
            courseId: course._id,
          });

          const savedTopic = await topic.save();
          console.log(`Created topic: ${savedTopic.title}`);

          const lessonPromises = topicData.lessons.map(async (lessonData) => {
            const lesson = new Lesson({
              topic: savedTopic._id,
              title: lessonData.title,
              content: lessonData.content,
              duration: lessonData.duration,
            });
            const savedLesson = await lesson.save();
            console.log(`Created lesson: ${savedLesson.title}`);
            return savedLesson._id;
          });

          const lessonIds = await Promise.all(lessonPromises);

          // Update topic with lesson references
          savedTopic.lessons = lessonIds;
          await savedTopic.save();

          // Update course with topic reference
          course.topics.push(savedTopic._id);
        }

        // Update course lessonsCount and duration
        const updatedTopics = await Topic.find({
          _id: { $in: course.topics },
        }).populate("lessons");
        course.lessonsCount = updatedTopics.reduce(
          (count, topic) => count + topic.lessons.length,
          0
        );
        course.duration = updatedTopics.reduce(
          (duration, topic) =>
            duration +
            topic.lessons.reduce(
              (lessonDuration, lesson) => lessonDuration + lesson.duration,
              0
            ),
          0
        );

        await course.save();
        console.log(
          `Updated course: ${course.title} with ${course.lessonsCount} lessons and ${course.duration} minutes duration.`
        );
      } else {
        console.log(`No topics found for course: ${course.title}`);
      }
    }

    console.log("Topics and lessons seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding topics and lessons:", error);
  } finally {
    mongoose.disconnect();
  }
};

seedTopicsAndLessons();
