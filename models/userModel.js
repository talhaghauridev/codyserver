const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  AvailableLoginProviders,
  LoginProviders,
  AvailableUserRoles,
  UserRoles,
} = require("../constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter Your Name"],
      trim: true,
      maxLength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please Enter Your Email"],
      unique: true,
      validate: [validator.isEmail, "Please Enter a valid Email"],
    },
    password: {
      type: String,
      required: [true, "Please Enter Your Password"],
      minLength: [8, "Password should have at least 8 chars"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: {
        type: String,
      },
    },
    role: {
      type: String,
      enum: AvailableUserRoles,
      default: UserRoles.USER,
    },
    provider: {
      type: String,
      enum: AvailableLoginProviders,
      default: LoginProviders.EMAIL_PASSWORD,
    },
    providerId: {
      type: String,
      unique: true,
      sparse: true,
    },
    enrolledCourses: [
      {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        progress: { type: Number, default: 0 },
        lessonsCompleted: [
          {
            lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
            completed: { type: Boolean, default: false },
            progress: { type: Number, default: 0 },
          },
        ],
      },
    ],
    otp: {
      type: String,
      select: false,
    },
    otpExpire: {
      type: Date,
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.generateOTPToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "10m", // OTP token expires in 10 minutes
  });
};
// Generate JWT token
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error("Password is not set");
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate Reset Password Token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

// Generate OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = crypto.createHash("sha256").update(otp).digest("hex");
  this.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

userSchema.methods.verifyOTP = function (otp) {
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  return this.otp === hashedOTP;
};

module.exports = mongoose.model("User", userSchema);
