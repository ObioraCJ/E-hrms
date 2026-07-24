const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    month: {
      type: Number, // 1-12
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },

     // Snapshot of the employee's salary AT THE TIME payroll was
    // generated - deliberately copied here rather than referencing
    // Employee.salary live, so that if someone's salary changes next
    // month, this month's already-generated payslip doesn't silently
    // change too. Payroll records are historical facts, not live views.
    basicSalary: {
      type: Number,
      required: true,
    },

    allowances: { type: Number, default: 0, min: 0 },
    overtimeHours: { type: Number, default: 0, min: 0 },
    overtimeRate: { type: Number, default: 0, min: 0 }, // pay per overtime hour
    bonuses: { type: Number, default: 0, min: 0 },

    tax: { type: Number, default: 0, min: 0 },
    pension: { type: Number, default: 0, min: 0 },
    otherDeductions: { type: Number, default: 0, min: 0 },

    // Computed and stored (not derived live) once generated - see
    // computePayroll() in the controller. Same "historical fact,
    // not a live calculation" reasoning as basicSalary above.
    grossPay: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },
    netPay: { type: Number, required: true },

    status: {
      type: String,
      enum: ['draft', 'finalized', 'paid'],
      default: 'draft',
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// One payroll record per employee per month/year - prevents
// accidentally generating duplicate payslips for the same period.
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);