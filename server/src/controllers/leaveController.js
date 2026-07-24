const { validationResult } = require('express-validator');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');

// Simple hardcoded annual allocations per leave type, in days. A future
// Settings module could make these configurable per company instead of
// fixed constants - reasonable to hardcode for now.
const ANNUAL_ALLOCATION = {
  annual: 20,
  sick: 10,
  casual: 7,
  maternity: 90,
  paternity: 14,
};

// Counts calendar days inclusive of both start and end date -
// e.g. Mon to Wed is 3 days, not 2.
const countDays = (start, end) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.round((new Date(end) - new Date(start)) / msPerDay);
  return diff + 1;
};

// ---- APPLY (employee, self) ----
exports.applyLeave = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: 'No employee profile linked to this account' });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }

    const numberOfDays = countDays(startDate, endDate);

    const leave = await Leave.create({
      employee: employee._id,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
    });

    res.status(201).json({ message: 'Leave request submitted', leave });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- CANCEL (employee, self - only if still pending) ----
exports.cancelLeave = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: 'No employee profile linked to this account' });
    }

    const leave = await Leave.findOne({ _id: req.params.id, employee: employee._id });
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ message: `Cannot cancel a request that is already ${leave.status}` });
    }

    leave.status = 'cancelled';
    await leave.save();

    res.status(200).json({ message: 'Leave request cancelled', leave });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- MY LEAVE HISTORY (self) ----
exports.getMyLeaves = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: 'No employee profile linked to this account' });
    }

    const leaves = await Leave.find({ employee: employee._id }).sort({ createdAt: -1 });
    res.status(200).json({ leaves });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- MY LEAVE BALANCE (self) ----
exports.getMyBalance = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: 'No employee profile linked to this account' });
    }

    const balance = await computeBalance(employee._id);
    res.status(200).json({ balance });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Shared helper: for a given employee, sums up approved leave days
// taken THIS YEAR per type, and subtracts from the annual allocation.
const computeBalance = async (employeeId) => {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const approvedThisYear = await Leave.find({
    employee: employeeId,
    status: 'approved',
    startDate: { $gte: startOfYear },
  });

  const used = { annual: 0, sick: 0, casual: 0, maternity: 0, paternity: 0 };
  approvedThisYear.forEach((leave) => {
    used[leave.leaveType] += leave.numberOfDays;
  });

  return Object.keys(ANNUAL_ALLOCATION).map((type) => ({
    leaveType: type,
    allocated: ANNUAL_ALLOCATION[type],
    used: used[type],
    remaining: ANNUAL_ALLOCATION[type] - used[type],
  }));
};

// ---- ALL LEAVE REQUESTS (HR/managers) ----
exports.getAllLeaves = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;

    const leaves = await Leave.find(filter)
      .populate({
        path: 'employee',
        select: 'employeeId department user',
        populate: { path: 'user', select: 'firstName lastName' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ leaves });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- APPROVE / REJECT (HR/managers) ----
exports.reviewLeave = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ message: `This request has already been ${leave.status}` });
    }

    const { status, reviewNote } = req.body;

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewNote = reviewNote;

    await leave.save();
    await leave.populate({
      path: 'employee',
      select: 'employeeId department user',
      populate: { path: 'user', select: 'firstName lastName' },
    });

    res.status(200).json({ message: `Leave request ${status}`, leave });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};