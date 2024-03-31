const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Course = require('./models/courseModel');
const Lesson = require('./models/lessonModel');
const cors = require('cors'); // Import CORS
const app = express();

app.use(cors()); // Use CORS with default options - allows all origins
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://alighouridev:wMSxuw2Dx5EPjInL@cluster0.5gfj4zc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(() => {
    console.log('MongoDB connected');
})
// Courses
// Add a new course
app.get('/', async (req, res) => {
    res.status(201).send('Api is Live 🔥');
});
app.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find().populate('lessons');
        res.status(200).send(courses);
    } catch (error) {
        res.status(500).send(error);
    }
});
app.get('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('topics.lessons');
        if (!course) {
            return res.status(404).send();
        }
        res.status(200).send(course);
    } catch (error) {
        res.status(500).send(error);
    }
});
app.get('/lessons', async (req, res) => {
    try {
        const lessons = await Lesson.find();
        res.status(200).send(lessons);
    } catch (error) {
        res.status(500).send(error);
    }
});
app.get('/lessons/:id', async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).send();
        }
        res.status(200).send(lesson);
    } catch (error) {
        res.status(500).send(error);
    }
});
app.get('/courses/:courseId/topics', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).send();
        }
        res.status(200).send(course.topics);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post('/courses', async (req, res) => {
    const course = new Course(req.body);
    try {
        await course.save();
        res.status(201).send(course);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete a course
app.delete('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) {
            return res.status(404).send();
        }
        res.send(course);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Lessons
app.post('/courses/:courseId/lessons', async (req, res) => {
    const lesson = new Lesson({
        ...req.body,
        courseId: req.params.courseId,
    });
    try {
        const savedLesson = await lesson.save();
        await Course.findByIdAndUpdate(req.params.courseId, { $push: { lessons: savedLesson._id } });
        res.status(201).send(savedLesson);
    } catch (error) {
        res.status(400).send(error);
    }
});


// Delete a lesson
app.delete('/lessons/:id', async (req, res) => {
    try {
        const lesson = await Lesson.findByIdAndDelete(req.params.id);
        if (!lesson) {
            return res.status(404).send();
        }
        res.send(lesson);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Course Sections (Topics)
// Add a topic to a course
app.post('/courses/:id/topics', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).send();
        }
        course.topics.push(req.body);
        await course.save();
        res.status(201).send(course);
    } catch (error) {
        res.status(400).send(error);
    }
});
app.get('/courses/:courseId/topics/:topicId/lessons', async (req, res) => {
    const { courseId, topicId } = req.params;

    try {
        const course = await Course.findById(courseId);
        // Ensure the course exists
        if (!course) {
            return res.status(404).send({ error: 'Course not found' });
        }

        // Find the specific topic by ID within the course
        const topic = course.topics.id(topicId);
        if (!topic) {
            return res.status(404).send({ error: 'Topic not found' });
        }
        console.log(topic);
        // Assuming topic.lessons is an array of lesson IDs
        // Use the $in operator to find lessons whose IDs are listed in topic.lessons
        const lessons = await Lesson.find({
            '_id': { $in: topic.lessons }
        });

        res.status(200).send(lessons);
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Server error' });
    }
});

app.post('/courses/:courseId/topics/:topicId/lessons', async (req, res) => {
    const { courseId, topicId } = req.params;
    const lesson = new Lesson({
        ...req.body,
    });
    try {
        const savedLesson = await lesson.save();
        const course = await Course.findById(courseId);
        // Find the topic by topicId and push the lesson ID
        const topic = course.topics.id(topicId); // Accessing the specific topic by ID
        if (!topic) {
            return res.status(404).send({ error: 'Topic not found' });
        }
        topic.lessons.push(savedLesson._id); // Assumes `lessons` is a field in the topic schema
        await course.save();

        res.status(201).send(savedLesson);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete a topic from a course
app.delete('/courses/:courseId/topics/:topicId', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).send();
        }
        const topic = course.topics.id(req.params.topicId);
        if (!topic) {
            return res.status(404).send();
        }
        topic.remove();
        await course.save();
        res.send(course);
    } catch (error) {
        res.status(500).send(error);
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
