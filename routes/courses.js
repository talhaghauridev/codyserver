const express = require('express');
const router = express.Router();
const Course = require('../models/courseModel');
const Lesson = require('../models/lessonModel');
const User = require('../models/userModel');


router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find().populate('lessons');
        res.status(200).send(courses);
    } catch (error) {
        res.status(500).send(error);
    }
});
router.get('/courses/:id', async (req, res) => {
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


router.get('/courses/:courseId/topics', async (req, res) => {
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

router.post('/courses', async (req, res) => {
    const course = new Course(req.body);
    try {
        await course.save();
        res.status(201).send(course);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete a course
router.delete('/courses/:id', async (req, res) => {
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
router.post('/courses/:courseId/lessons', async (req, res) => {
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
router.delete('/lessons/:id', async (req, res) => {
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
router.post('/courses/:id/topics', async (req, res) => {
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
router.get('/courses/:courseId/topics/:topicId/lessons', async (req, res) => {
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

router.post('/courses/:courseId/topics/:topicId/lessons', async (req, res) => {
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
router.delete('/courses/:courseId/topics/:topicId', async (req, res) => {
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



router.post('/enroll', async (req, res) => {
    // Assuming req.user is populated from JWT middleware
    const { courseId } = req.body;
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $push: { enrolledCourses: { courseId, progress: 0 } }
        });
        res.status(200).send({ message: 'Enrolled successfully' });
    } catch (error) {
        res.status(500).send(error);
    }
});


router.post('/completeLesson', async (req, res) => {
    const { userId, courseId, lessonId } = req.body;

    try {
        const user = await User.findById(userId);
        const course = await Course.findById(courseId); // Assuming you have a Course model
        if (!course) {
            return res.status(404).send({ message: 'Course not found' });
        }

        const totalLessons = course.topics.reduce((acc, topic) => acc + topic.lessons.length, 0);

        const courseIndex = user.enrolledCourses.findIndex(enrollment => enrollment.courseId.equals(courseId));

        if (courseIndex !== -1) {
            const lessonsCompleted = user.enrolledCourses[courseIndex].lessonsCompleted;
            const lessonIndex = lessonsCompleted.findIndex(lesson => lesson.lessonId.equals(lessonId));

            if (lessonIndex === -1) {
                lessonsCompleted.push({ lessonId, completed: true });
            } else {
                lessonsCompleted[lessonIndex].completed = true;
            }

            // Calculate and update course progress
            const completedLessonsCount = lessonsCompleted.filter(lesson => lesson.completed).length;
            const progress = (completedLessonsCount / totalLessons) * 100;
            user.enrolledCourses[courseIndex].progress = progress;

            await user.save();
            res.status(200).send({ message: 'Lesson marked as completed, progress updated' });
        } else {
            res.status(404).send({ message: 'Course not found in user enrollments' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

module.exports = router;