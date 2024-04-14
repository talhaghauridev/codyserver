const express = require("express");
const router = express.Router();
const Course = require("../models/courseModel");

router.delete("/topics/:courseId/:topicId", async (req, res) => {
  try {
    const { courseId, topicId } = req.params;

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $pull: { topics: { _id: topicId } },
      },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).send({ message: "Course not found" });
    }

    res.status(200).send({ message: "Topic deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Internal server error", error });
  }
});

router.patch("/topics/:courseId/:topicId", async (req, res) => {
    try {
      const { courseId, topicId } = req.params;
      const { title, description, duration } = req.body;
  
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).send({ message: "Course not found" });
      }
  
      const topic = course.topics.find(topic => topic._id.toString() === topicId);
      if (!topic) {
        return res.status(404).send({ message: "Topic not found" });
      }
      
       topic.title = title;
       topic.description = description;
       topic.duration = duration;
      await course.save({
        validateBeforeSave:false
      });
  
      res.status(200).send({ message: "Topic updated successfully" });
    } catch (error) {
      res.status(500).send({ message: "Internal server error", error });
    }
  });

module.exports = router;
