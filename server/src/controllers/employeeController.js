const { validationResult } = require('express-validator');
const Employee = require('../models/Employee');
const User = require('../models/User');
const generateEmployeeId = require('../utils/generateEmployeeId');

// ---- CREATE ----
// Creates a User (login credentials) and an Employee (HR profile) together,
// since in this HRMS every employee needs both to exist as a usable account.
exports.createEmployee = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      designation,
      dateOfJoining,
      dateOfBirth,
      gender,
      phone,
      address,
      employmentType,
      manager,
      salary,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Creating the User first triggers its password-hashing pre-save hook,
    // so we never handle plain-text passwords ourselves here.
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'employee',
    });

    const employeeId = await generateEmployeeId();

    const employee = await Employee.create({
      user: user._id,
      employeeId,
      department,
      designation,
      dateOfJoining,
      dateOfBirth,
      gender,
      phone,
      address,
      employmentType,
      manager: manager || null,
      salary,
    });

    // populate('user', ...) replaces the raw user ObjectId with the
    // actual user document (only the listed fields), so the response
    // is immediately useful to the frontend without a second request.
    await employee.populate('user', 'firstName lastName email role isActive');

    res.status(201).json({ message: 'Employee created successfully', employee });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- READ (list) ----
// Supports optional filtering by department/status, and pagination via
// ?page=&limit= query params, so the frontend never has to load every
// employee at once as the company grows.
exports.getEmployees = async (req, res) => {
  try {
    const { department, status, page = 1, limit = 20, search } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;

    const employees = await Employee.find(filter)
      .populate('user', 'firstName lastName email role isActive')
      .populate('manager', 'employeeId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Optional simple search by name/email, applied after populate since
    // firstName/email live on the User model, not Employee.
    const filtered = search
      ? employees.filter((e) => {
          const fullName = `${e.user?.firstName} ${e.user?.lastName}`.toLowerCase();
          return (
            fullName.includes(search.toLowerCase()) ||
            e.user?.email?.toLowerCase().includes(search.toLowerCase())
          );
        })
      : employees;

    const total = await Employee.countDocuments(filter);

    res.status(200).json({
      employees: filtered,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- READ (single) ----
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'firstName lastName email role isActive')
      .populate('manager', 'employeeId');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ employee });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- UPDATE ----
// Deliberately only touches Employee fields - never firstName/lastName/
// email/password on the linked User, to keep credential changes separate
// from HR-profile changes (see employeeValidators.js for the reasoning).
exports.updateEmployee = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const allowedFields = [
      'department',
      'designation',
      'dateOfJoining',
      'dateOfBirth',
      'gender',
      'phone',
      'address',
      'employmentType',
      'status',
      'manager',
      'salary',
    ];

    // Only copy over fields that were actually sent, so a partial update
    // (e.g. just { status: 'on-leave' }) doesn't wipe out other fields.
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        employee[field] = req.body[field];
      }
    });

    await employee.save();
    await employee.populate('user', 'firstName lastName email role isActive');

    res.status(200).json({ message: 'Employee updated successfully', employee });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- DELETE (soft delete) ----
// Instead of actually removing records, we mark the employee as
// "terminated" and deactivate their login. Real HR systems almost never
// hard-delete people - you need the historical record for compliance,
// payroll history, references, etc.
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.status = 'terminated';
    await employee.save();

    await User.findByIdAndUpdate(employee.user, { isActive: false });

    res.status(200).json({ message: 'Employee terminated and access revoked' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};