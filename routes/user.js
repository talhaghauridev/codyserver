const express = require("express");
const User = require("../models/userModel");
const router = express.Router();
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const sendToken = require("../utils/sendToken");
const crypto = require("crypto");
const Course = require("../models/courseModel");
const Lesson = require("../models/lessonModel");
const ErrorHandler = require("../utils/ErrorHandler");

// Regis
router.post("/signup", async (req, res, next) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return next(new ErrorHandler("Please Enter all fields", 400));
  }
  try {
    // Check if the email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorHandler("Email is already in use", 401));
    }

    // If no user with the email exists, create a new user
    const user = await User.create({
      email,
      password,
      name,
    });

    // Implement sendToken function or adjust as needed
    sendToken(user, 201, res);
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter all fields", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }

  // Generate JWT token first
  const token = user.getJWTToken();

  // Convert user to JSON object
  const userObj = user.toObject();

  // Send token and userObj
  res.status(201).json({
    success: true,
    token,
    user: userObj,
  });
});

router.get(
  "/user/:userId/enrolled-courses",
  asyncErrorHandler(async (req, res) => {
    const { userId } = req.params;

    try {
      const userWithCourses = await User.findById(userId).populate({
        path: "enrolledCourses.courseId",
        select: "title duration logo", // Assuming you want to fetch title and description of each course
      });

      if (!userWithCourses) {
        return res.status(404).send({ message: "User not found" });
      }

      // Extract enrolledCourses and send them in the response
      const { enrolledCourses } = userWithCourses;
      res.status(200).json({
        success: true,
        enrolledCourses,
      });
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      res.status(500).send({ message: "Error fetching enrolled courses" });
    }
  })
);
router.get("/mycourses/:userId", async (req, res) => {
  try {
    // Find the user by ID
    const user = await User.findById(req.params.userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all courses
    const allCourses = await Course.find().populate("topics.lessons");

    // Map through all courses to add enrollment, lesson completion details, and progress
    const coursesWithDetails = allCourses.map((course) => {
      const courseObject = course.toObject(); // Convert the course document to a plain object

      // Check if the user is enrolled in this course
      const enrolledCourse = user.enrolledCourses.find((ec) =>
        ec.courseId.equals(course._id)
      );

      if (enrolledCourse) {
        // User is enrolled, add lesson completion details and progress
        courseObject.enrolled = true;
        courseObject.progress = enrolledCourse.progress; // Add overall course progress
        courseObject.topics = courseObject.topics.map((topic) => {
          topic.lessons = topic.lessons.map((lesson) => {
            const lessonCompletion = enrolledCourse.lessonsCompleted.find(
              (lc) => lc.lessonId.equals(lesson._id)
            );
            lesson.completed = lessonCompletion
              ? lessonCompletion.completed
              : false;
            lesson.progress = lessonCompletion ? lessonCompletion.progress : 0; // Add lesson progress
            return lesson;
          });
          return topic;
        });
      } else {
        // User is not enrolled
        courseObject.enrolled = false;
        courseObject.progress = 0; // No progress for non-enrolled courses
      }

      return courseObject;
    });

    // Respond with the courses and details
    res.json(coursesWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/topcourses/:userId", async (req, res) => {
  try {
    // Find the user by ID
    const user = await User.findById(req.params.userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get the top 5 courses based on the number of students enrolled
    const topCourses = await Course.find()
      .sort({ "students.length": -1 })
      .limit(5)
      .populate("topics.lessons");

    // Map through the top courses to add enrollment, lesson completion details, and progress
    const coursesWithDetails = topCourses.map((course) => {
      const courseObject = course.toObject(); // Convert the course document to a plain object

      // Check if the user is enrolled in this course
      const enrolledCourse = user.enrolledCourses.find((ec) =>
        ec.courseId.equals(course._id)
      );

      if (enrolledCourse) {
        // User is enrolled, add lesson completion details and progress
        courseObject.enrolled = true;
        courseObject.progress = enrolledCourse.progress; // Add overall course progress
        courseObject.topics = courseObject.topics.map((topic) => {
          topic.lessons = topic.lessons.map((lesson) => {
            const lessonCompletion = enrolledCourse.lessonsCompleted.find(
              (lc) => lc.lessonId.equals(lesson._id)
            );
            lesson.completed = lessonCompletion
              ? lessonCompletion.completed
              : false;
            lesson.progress = lessonCompletion ? lessonCompletion.progress : 0; // Add lesson progress
            return lesson;
          });
          return topic;
        });
      } else {
        // User is not enrolled
        courseObject.enrolled = false;
        courseObject.progress = 0; // No progress for non-enrolled courses
      }

      return courseObject;
    });

    // Respond with the top 5 courses and details
    res.json(coursesWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user details
router.get(
  "/user/:id",
  asyncErrorHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Exclude the password from the response
    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      user: userObj,
    });
  })
);

// // Logout User
// exports.logoutUser = asyncErrorHandler(async (req, res, next) => {
//     res.cookie("token", null, {
//         expires: new Date(Date.now()),
//         httpOnly: true,
//     });

//     res.status(200).json({
//         success: true,
//         message: "Logged Out",
//     });
// });

// // Get User Details
// exports.getUserDetails = asyncErrorHandler(async (req, res, next) => {

//     const user = await User.findById(req.user.id);

//     res.status(200).json({
//         success: true,
//         user,
//     });
// });

// // Forgot Password
// exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {

//     const user = await User.findOne({ email: req.body.email });

//     if (!user) {
//         return next(new ErrorHandler("User Not Found", 404));
//     }

//     const resetToken = await user.getResetPasswordToken();

//     await user.save({ validateBeforeSave: false });

//     // const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`;
//     const resetPasswordUrl = `https://${req.get("host")}/password/reset/${resetToken}`;

//     // const message = `Your password reset token is : \n\n ${resetPasswordUrl}`;

//     try {
//         await sendEmail({
//             email: user.email,
//             templateId: process.env.SENDGRID_RESET_TEMPLATEID,
//             data: {
//                 reset_url: resetPasswordUrl
//             }
//         });

//         res.status(200).json({
//             success: true,
//             message: `Email sent to ${user.email} successfully`,
//         });

//     } catch (error) {
//         user.resetPasswordToken = undefined;
//         user.resetPasswordExpire = undefined;

//         await user.save({ validateBeforeSave: false });
//         return next(new ErrorHandler(error.message, 500))
//     }
// });

// // Reset Password
// exports.resetPassword = asyncErrorHandler(async (req, res, next) => {

//     // create hash token
//     const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

//     const user = await User.findOne({
//         resetPasswordToken,
//         resetPasswordExpire: { $gt: Date.now() }
//     });

//     if (!user) {
//         return next(new ErrorHandler("Invalid reset password token", 404));
//     }

//     user.password = req.body.password;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpire = undefined;

//     await user.save();
//     sendToken(user, 200, res);
// });

// // Update Password
// exports.updatePassword = asyncErrorHandler(async (req, res, next) => {

//     const user = await User.findById(req.user.id).select("+password");

//     const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

//     if (!isPasswordMatched) {
//         return next(new ErrorHandler("Old Password is Invalid", 400));
//     }

//     user.password = req.body.newPassword;
//     await user.save();
//     sendToken(user, 201, res);
// });

// // Update User Profile
// exports.updateProfile = asyncErrorHandler(async (req, res, next) => {

//     const newUserData = {
//         name: req.body.name,
//         email: req.body.email,
//     }

//     if (req.body.avatar !== "") {
//         const user = await User.findById(req.user.id);

//         const imageId = user.avatar.public_id;

//         await cloudinary.v2.uploader.destroy(imageId);

//         const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
//             folder: "avatars",
//             width: 150,
//             crop: "scale",
//         });

//         newUserData.avatar = {
//             public_id: myCloud.public_id,
//             url: myCloud.secure_url,
//         }
//     }

//     await User.findByIdAndUpdate(req.user.id, newUserData, {
//         new: true,
//         runValidators: true,
//         useFindAndModify: true,
//     });

//     res.status(200).json({
//         success: true,
//     });
// });

module.exports = router;
