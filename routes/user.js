const express = require("express");
const User = require("../models/userModel");
const router = express.Router();
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const sendToken = require("../utils/sendToken");
const crypto = require("crypto");
const Course = require("../models/courseModel");
const Lesson = require("../models/lessonModel");
const ErrorHandler = require("../utils/ErrorHandler");
const isAuthenticated = require("../middlewares/auth");
const { AvailableLoginProviders, LoginProviders } = require("../constants");
const { sendEmail } = require("../utils/sendMail");
const jwt = require("jsonwebtoken");
router.post(
  "/signup",
  asyncErrorHandler(async (req, res, next) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return next(new ErrorHandler("Please Enter all fields", 400));
    }

    // Check if the email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorHandler("Email is already in use", 401));
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
    });

    // Generate OTP
    const otp = user.generateOTP();
    const otpToken = user.generateOTPToken();
    // Save user with OTP
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    await sendEmail({
      email: user.email,
      subject: "Verify your email",
      message: `Your verification code is ${otp}. It will expire in 10 minutes.`,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email.",
      otpToken,
    });
  })
);

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

  if (!user.isVerified) {
    throw new ErrorResponse("Please verify your email to login", 403);
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
    message: "Login Successfully",

  });
});

// Verify OTP
router.post(
  "/verify-otp",
  asyncErrorHandler(async (req, res, next) => {
    const { otp, token } = req.body;

    if (!otp || !token) {
      throw new ErrorResponse("Please provide OTP and token", 400);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("+otp +otpExpire");

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
    if (user.isVerified) {
      return next(new ErrorHandler("User is already verified", 400));
    }
    // Check if OTP is expired
    if (user.otpExpire < Date.now()) {
      return next(new ErrorHandler("OTP has expired", 400));
    }

    if (!user.verifyOTP(otp)) {
      return next(new ErrorHandler("Invalid OTP", 400));
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;

    await user.save({ validateBeforeSave: false });
    const userToken = user.getJWTToken();

    res.status(200).json({
      success: true,
      message: `Successfull Verified`,
      user,
      token: userToken,
    });
  })
);

router.post(
  "/request-otp",
  asyncErrorHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw new ErrorResponse("Please provide an email address", 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ErrorResponse("User not found", 404);
    }

    if (user.isVerified) {
      throw new ErrorResponse("User is already verified", 400);
    }

    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    // Send OTP via email
    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  })
);
router.post(
  "/social-login",
  asyncErrorHandler(async (req, res, next) => {
    const { name, email, provider, providerId } = req.body;

    if (!name || !email || !provider || !providerId) {
      return next(new ErrorHandler("Please provide all required fields", 400));
    }

    const mappedProvider = LoginProviders[provider];
    if (!mappedProvider) {
      return next(new ErrorHandler("Invalid provider", 400));
    }

    let user = await User.findOne({ email });

    if (user) {
      if (user.provider !== mappedProvider) {
        return next(
          new ErrorHandler(
            `Account exists with different provider: ${user.provider}`,
            400
          )
        );
      }

      if (user.providerId !== providerId) {
        return next(new ErrorHandler("Authentication failed", 401));
      }
    } else {
      user = new User({
        name,
        email,
        provider: mappedProvider,
        providerId,
        password: Math.random(),
        isVerified: true,
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = user.getJWTToken();

    res.status(200).json({
      success: true,
      message: `Login with ${mappedProvider} successful`,
      user,
      token,
    });
  })
);

router.get("/me", isAuthenticated, async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
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

router.patch("/update-profile", isAuthenticated, async (req, res, next) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return next(new ErrorHandler("Please fill all fields", 400));
  }
  const newUserData = {
    name,
    email,
  };

  // if (req.body.avatar !== "") {
  //     const user = await User.findById(req.user.id);

  //     const imageId = user.avatar.public_id;

  //     await cloudinary.v2.uploader.destroy(imageId);

  //     const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
  //         folder: "avatars",
  //         width: 150,
  //         crop: "scale",
  //     });

  //     newUserData.avatar = {
  //         public_id: myCloud.public_id,
  //         url: myCloud.secure_url,
  //     }
  // }

  await User.findByIdAndUpdate(req.user.id, newUserData, {
    runValidators: false,
  });

  res.status(200).json({
    success: true,
    message: "Profile has been updated!",
  });
});

router.patch("/change-password", isAuthenticated, async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Please fill all fields", 400));
  }
  console.log(req.body);
  const user = await User.findById(req.user?._id).select("+password");
  console.log({ user });
  const isPasswordMatched = await user.comparePassword(oldPassword);
  console.log({ isPasswordMatched });
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old Password is Invalid", 400));
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true,
    message: "Password Updated Successfully",
  });
});

module.exports = router;
