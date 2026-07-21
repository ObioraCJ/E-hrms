const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // The employee who manages this department. References Employee
    // (not User directly) since "manager" is an HR/organizational
    // concept, and Employee is where HR-specific data lives.
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);