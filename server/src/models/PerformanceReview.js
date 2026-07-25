const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started',
    },
    dueDate: { type: Date },
  },
  { _id: true }
);

const performanceReviewSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    // Who conducted this review - almost always the employee's manager,
    // but stored explicitly rather than assumed, since a manager could
    // change after a review is already on record.
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // A review period like "Q1 2025" or "Annual 2024" - kept as a
    // simple free-text label rather than strict start/end dates, since
    // review cycles vary a lot between companies (quarterly, annual,
    // project-based) and a label is flexible enough to cover all of them.
    reviewPeriod: {
      type: String,
      required: true,
      trim: true,
    },

    // KPIs being measured, each with a target, actual result, and
    // a 1-5 rating - lets a review cover multiple measurable criteria
    // rather than a single overall score.
    kpis: [
      {
        name: { type: String, required: true, trim: true },
        target: { type: String, trim: true },
        actual: { type: String, trim: true },
        rating: { type: Number, min: 1, max: 5 },
      },
    ],

    goals: [goalSchema],

    managerFeedback: {
      type: String,
      trim: true,
    },

    // Overall rating for the whole review period - separate from the
    // individual KPI ratings above, since a manager might weigh some
    // KPIs more heavily than others when forming their overall view.
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
    },

    status: {
      type: String,
      enum: ['draft', 'submitted', 'acknowledged'],
      default: 'draft',
    },

    // Set once the employee views/acknowledges a submitted review -
    // confirms they've actually seen their feedback, not just that HR
    // finished writing it.
    acknowledgedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema);