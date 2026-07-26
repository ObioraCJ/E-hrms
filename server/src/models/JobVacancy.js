const mongoose = require('mongoose');

const jobVacancySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    requirements: { type: String, trim: true },

    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'intern'],
      default: 'full-time',
    },

    // "open" vacancies show up on the public listing; "closed" ones
    // stay in the system (for record-keeping/reporting) but disappear
    // from what candidates can see and apply to.
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },

    closingDate: { type: Date, default: null },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobVacancy', jobVacancySchema);