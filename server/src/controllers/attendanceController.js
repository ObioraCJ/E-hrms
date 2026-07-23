const { validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');

// Shared helper: given clockIn/clockOut/breakMinutes, computes
// workingHours the same way regardless of whether this is a create
// or an update - keeps the math in exactly one place.
const computeWorkingHours = (clockIn, clockOut, breakMinutes = 0) => {
  if (!clockIn || !clockOut) return null;
  const rawHours = (new Date(clockOut) - new Date(clockIn)) / (1000 * 60 * 60);
  const hours = Math.max(0, rawHours - breakMinutes / 60);
  return Number(hours.toFixed(2));
};

const normalizeDateOnly = (dateInput) => {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ---- CREATE (manual entry, e.g. from thumbprint machine export) ----
exports.createAttendance = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { employee, date, clockIn, clockOut, breakMinutes = 0, status } = req.body;

    const normalizedDate = normalizeDateOnly(date);

    const existing = await Attendance.findOne({ employee, date: normalizedDate });
    if (existing) {
      return res.status(409).json({ message: 'An attendance record for this employee and date already exists' });
    }

    const workingHours = computeWorkingHours(clockIn, clockOut, breakMinutes);

    const attendance = await Attendance.create({
      employee,
      date: normalizedDate,
      clockIn,
      clockOut: clockOut || null,
      breakMinutes,
      workingHours,
      status: status || 'present',
      recordedBy: req.user._id,
    });

    await attendance.populate({
      path: 'employee',
      select: 'employeeId department user',
      populate: { path: 'user', select: 'firstName lastName' },
    });

    res.status(201).json({ message: 'Attendance record created', attendance });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An attendance record for this employee and date already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- READ (list, with filters - HR/managers) ----
exports.getAttendance = async (req, res) => {
  try {
    const { date, month, year, employeeId } = req.query;
    const filter = {};

    if (date) {
      const start = normalizeDateOnly(date);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.date = { $gte: start, $lt: end };
    } else if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 1);
      filter.date = { $gte: start, $lt: end };
    }

    if (employeeId) filter.employee = employeeId;

    const records = await Attendance.find(filter)
      .populate({
        path: 'employee',
        select: 'employeeId department user',
        populate: { path: 'user', select: 'firstName lastName' },
      })
      .sort({ date: -1 });

    res.status(200).json({ attendance: records });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- READ (self - employee viewing their own history, read-only) ----
exports.getMyAttendance = async (req, res) => {
  try {
    const Employee = require('../models/Employee');
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: 'No employee profile linked to this account' });
    }

    const { month, year } = req.query;
    const filter = { employee: employee._id };

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 1);
      filter.date = { $gte: start, $lt: end };
    }

    const records = await Attendance.find(filter).sort({ date: -1 });
    res.status(200).json({ attendance: records });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- UPDATE (correcting a manually-entered record) ----
exports.updateAttendance = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const { clockIn, clockOut, breakMinutes, status } = req.body;

    if (clockIn !== undefined) attendance.clockIn = clockIn;
    if (clockOut !== undefined) attendance.clockOut = clockOut;
    if (breakMinutes !== undefined) attendance.breakMinutes = breakMinutes;
    if (status !== undefined) attendance.status = status;

    attendance.workingHours = computeWorkingHours(
      attendance.clockIn,
      attendance.clockOut,
      attendance.breakMinutes
    );

    await attendance.save();
    await attendance.populate({
      path: 'employee',
      select: 'employeeId department user',
      populate: { path: 'user', select: 'firstName lastName' },
    });

    res.status(200).json({ message: 'Attendance record updated', attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- DELETE ----
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    await attendance.deleteOne();
    res.status(200).json({ message: 'Attendance record deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};