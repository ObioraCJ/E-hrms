const { validationResult } = require('express-validator');
const PerformanceReview = require('../models/PerformanceReview');
const Employee = require('../models/Employee');
const { createNotification } = require('../utils/createNotification');

// ---- CREATE (manager/HR creates a draft review) ----
exports.createReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { employee, reviewPeriod, kpis, goals, managerFeedback, overallRating } = req.body;

    const review = await PerformanceReview.create({
      employee,
      reviewer: req.user._id,
      reviewPeriod,
      kpis: kpis || [],
      goals: goals || [],
      managerFeedback,
      overallRating,
    });

    await review.populate({
      path: 'employee',
      select: 'employeeId department user',
      populate: { path: 'user', select: 'firstName lastName' },
    });

    res.status(201).json({ message: 'Performance review created', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- LIST (HR/managers - all reviews, with filters) ----
exports.getReviews = async (req, res) => {
  try {
    const { employeeId, status } = req.query;
    const filter = {};
    if (employeeId) filter.employee = employeeId;
    if (status) filter.status = status;

    const reviews = await PerformanceReview.find(filter)
      .populate({
        path: 'employee',
        select: 'employeeId department user',
        populate: { path: 'user', select: 'firstName lastName' },
      })
      .populate('reviewer', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ reviews });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- GET ONE ----
exports.getReviewById = async (req, res) => {
  try {
    const review = await PerformanceReview.findById(req.params.id)
      .populate({
        path: 'employee',
        select: 'employeeId department designation user',
        populate: { path: 'user', select: 'firstName lastName email' },
      })
      .populate('reviewer', 'firstName lastName');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json({ review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- UPDATE (only while status is 'draft', OR submitting it) ----
exports.updateReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const review = await PerformanceReview.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    if (review.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft reviews can be edited' });
    }

    const { kpis, goals, managerFeedback, overallRating, status } = req.body;

    if (kpis !== undefined) review.kpis = kpis;
    if (goals !== undefined) review.goals = goals;
    if (managerFeedback !== undefined) review.managerFeedback = managerFeedback;
    if (overallRating !== undefined) review.overallRating = overallRating;

    const wasSubmitted = status === 'submitted' && review.status === 'draft';
    if (status !== undefined) review.status = status;

    await review.save();
    await review.populate({
      path: 'employee',
      select: 'employeeId department user',
      populate: { path: 'user', select: 'firstName lastName' },
    });

    // Only notify the employee at the moment their review actually
    // becomes visible to them (submitted), not while it's still a
    // work-in-progress draft the manager might still be editing.
    if (wasSubmitted) {
      await createNotification({
        recipient: review.employee.user._id,
        type: 'announcement', // reusing this type - a dedicated 'review_submitted'
        // type could be added to the Notification enum later if this
        // needs its own distinct icon/handling on the frontend.
        title: 'Performance review available',
        message: `Your performance review for ${review.reviewPeriod} is now available.`,
        link: `/my-reviews/${review._id}`,
      });
    }

    res.status(200).json({ message: 'Review updated', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- ACKNOWLEDGE (employee, self) ----
exports.acknowledgeReview = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: 'No employee profile linked to this account' });
    }

    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      employee: employee._id,
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    if (review.status !== 'submitted') {
      return res.status(400).json({ message: 'Only submitted reviews can be acknowledged' });
    }

    review.status = 'acknowledged';
    review.acknowledgedAt = new Date();
    await review.save();

    res.status(200).json({ message: 'Review acknowledged', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- MY REVIEWS (employee, self - only submitted/acknowledged, never drafts) ----
exports.getMyReviews = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: 'No employee profile linked to this account' });
    }

    const reviews = await PerformanceReview.find({
      employee: employee._id,
      status: { $in: ['submitted', 'acknowledged'] },
    })
      .populate('reviewer', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ reviews });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMyReviewById = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: 'No employee profile linked to this account' });
    }

    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      employee: employee._id,
      status: { $in: ['submitted', 'acknowledged'] },
    }).populate('reviewer', 'firstName lastName');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json({ review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};