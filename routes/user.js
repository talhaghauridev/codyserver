const express = require('express');
const User = require('../models/userModel');
const router = express.Router();
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const sendToken = require('../utils/sendToken');
const crypto = require('crypto');

// Regis
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the email is already in use
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ message: 'Email is already in use' });
        }

        // If no user with the email exists, create a new user
        const user = await User.create({
            email,
            password,
        });

        // Implement sendToken function or adjust as needed
        sendToken(user, 201, res);
    } catch (error) {
        // Log the error and send a generic error message
        console.error('Signup error:', error);
        res.status(500).send({ message: 'Error signing up user' });
    }
});

router.post('/login', asyncErrorHandler(async (req, res, next) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please Enter Email And Password", 400));
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
}));






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