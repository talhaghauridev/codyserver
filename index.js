const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors"); // Import CORS
const courseRoutes = require("./routes/courses");
const lessonRoutes = require("./routes/lessons");
const userRoutes = require("./routes/user");
const topicRoutes = require("./routes/topic");
require("dotenv").config();
const app = express();

app.use(cors()); // Use CORS with default options - allows all origins
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://alighouridev:wMSxuw2Dx5EPjInL@cluster0.5gfj4zc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ssl: true,
      sslValidate: true,
    }
  )
  .then(() => {
    console.log("MongoDB connected");
  });
// Courses
// Add a new course
app.get("/", async (req, res) => {
  res.status(201).send("Api is Live 🔥");
});
app.use("/", courseRoutes);
app.use("/", lessonRoutes);
app.use("/", userRoutes);
app.use("/", topicRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
