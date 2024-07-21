// models/Certificate.js
const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    courseName: {
        type: String,
        required: true,
        trim: true
    },
    courseDuration: {
        type: String,
        required: true,
        trim: true
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    certificateNumber: {
        type: String,
        unique: true,
        required: true
    },
    referenceNumber: {
        type: String,
        unique: true,
        required: true
    }
});

module.exports = mongoose.model('Certificate', CertificateSchema);