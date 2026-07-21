const { validationResult } = require('express-validator');
const Department = require('../models/Department');
const Employee = require('../models/Employee');

exports.createDepartment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description, manager } = req.body;

    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: 'A department with this name already exists' });
    }

    const department = await Department.create({ name, description, manager: manager || null });
    await department.populate('manager', 'employeeId');
    if (department.manager) {
      await department.populate('manager.user', 'firstName lastName');
    }

    res.status(201).json({ message: 'Department created successfully', department });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate({
        path: 'manager',
        select: 'employeeId user',
        populate: { path: 'user', select: 'firstName lastName' },
      })
      .sort({ name: 1 });

    // Attach a live employee count to each department. Done here
    // (rather than storing a count field on Department) so it's
    // always accurate - no risk of a stale number if employees are
    // added/removed/transferred without remembering to update a count.
    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await Employee.countDocuments({
          department: dept.name,
          status: { $ne: 'terminated' },
        });
        return { ...dept.toObject(), employeeCount };
      })
    );

    res.status(200).json({ departments: departmentsWithCounts });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).populate({
      path: 'manager',
      select: 'employeeId user',
      populate: { path: 'user', select: 'firstName lastName' },
    });

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const employees = await Employee.find({ department: department.name })
      .populate('user', 'firstName lastName email')
      .select('employeeId designation status user');

    res.status(200).json({ department, employees });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const { name, description, manager } = req.body;

    // If renaming a department, every Employee record pointing at the
    // OLD name string needs to be updated too, since Employee.department
    // is a plain string, not a reference. Skipping this would silently
    // "orphan" existing employees from their department.
    if (name && name !== department.name) {
      const existing = await Department.findOne({ name, _id: { $ne: department._id } });
      if (existing) {
        return res.status(409).json({ message: 'A department with this name already exists' });
      }
      await Employee.updateMany({ department: department.name }, { department: name });
      department.name = name;
    }

    if (description !== undefined) department.description = description;
    if (manager !== undefined) department.manager = manager;

    await department.save();
    await department.populate({
      path: 'manager',
      select: 'employeeId user',
      populate: { path: 'user', select: 'firstName lastName' },
    });

    res.status(200).json({ message: 'Department updated successfully', department });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const employeeCount = await Employee.countDocuments({
      department: department.name,
      status: { $ne: 'terminated' },
    });

    if (employeeCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${employeeCount} active employee(s) are still assigned to this department. Reassign them first.`,
      });
    }

    await department.deleteOne();
    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};