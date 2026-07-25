const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // This collection will only ever have ONE document - it's a
    // singleton representing company-wide configuration, not a list
    // of separate records like Employee or Department.
    companyName: {
      type: String,
      default: 'My Company',
      trim: true,
    },
    companyLogo: {
      type: String, // URL/path to an uploaded logo, added later if needed
      default: null,
    },

    workSchedule: {
      startHour: { type: Number, default: 9, min: 0, max: 23 },
      graceMinutes: { type: Number, default: 60, min: 0 }, // minutes after startHour before marked 'late'
      fullDayHours: { type: Number, default: 8, min: 1 },
    },

    payrollRates: {
      taxRate: { type: Number, default: 0.1, min: 0, max: 1 },
      pensionRate: { type: Number, default: 0.08, min: 0, max: 1 },
    },

    leaveAllocations: {
      annual: { type: Number, default: 20, min: 0 },
      sick: { type: Number, default: 10, min: 0 },
      casual: { type: Number, default: 7, min: 0 },
      maternity: { type: Number, default: 90, min: 0 },
      paternity: { type: Number, default: 14, min: 0 },
    },

    // Public holidays - attendance/leave logic can check against this
    // list later (e.g. to exclude holidays from leave day-counting).
    holidays: [
      {
        name: { type: String, required: true },
        date: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);