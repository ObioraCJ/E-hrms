const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    // Links this Employee record to its login credentials in the User
    // collection. `ref: 'User'` lets us later call .populate('user') to
    // pull in the name/email/role without duplicating that data here.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one employee profile per user account
    },

    // A human-friendly ID like "EMP0001", separate from Mongo's internal
    // _id, since HR staff will reference this in conversation/paperwork.
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },

    dateOfJoining: {
      type: Date,
      required: true,
    },
    dateOfBirth: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },

    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'intern'],
      default: 'full-time',
    },

    // Employment status is separate from User.isActive (which controls
    // login access) - an employee could be "on-leave" but still able to
    // log in, for example.
    status: {
      type: String,
      enum: ['active', 'on-leave', 'terminated'],
      default: 'active',
    },

    // Optional reporting line - references another Employee (their manager).
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },

    salary: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);