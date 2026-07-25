const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const { generateExcelReport, generatePdfReport } = require('../utils/reportBuilders');

// Shared dispatcher: every report handler builds the same shape
// ({filename, title, columns, rows}) and hands it here, which decides
// whether to build an Excel file or a PDF based on ?format=.
const sendReport = async (req, res, { filename, title, columns, rows }) => {
  const format = req.query.format === 'pdf' ? 'pdf' : 'excel';
  if (format === 'pdf') {
    generatePdfReport(res, { filename, title, columns, rows });
  } else {
    await generateExcelReport(res, { filename, sheetName: title, columns, rows });
  }
};

exports.employeeReport = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('user', 'firstName lastName email')
      .sort({ employeeId: 1 });

    const columns = [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'department', label: 'Department' },
      { key: 'designation', label: 'Designation' },
      { key: 'status', label: 'Status' },
      { key: 'dateOfJoining', label: 'Date Joined' },
    ];

    const rows = employees.map((e) => ({
      employeeId: e.employeeId,
      name: `${e.user?.firstName} ${e.user?.lastName}`,
      email: e.user?.email,
      department: e.department,
      designation: e.designation,
      status: e.status,
      dateOfJoining: e.dateOfJoining ? e.dateOfJoining.toISOString().slice(0, 10) : '',
    }));

    await sendReport(req, res, { filename: 'employees-report', title: 'Employees Report', columns, rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.departmentReport = async (req, res) => {
  try {
    const departments = await Department.find().populate({
      path: 'manager',
      select: 'employeeId user',
      populate: { path: 'user', select: 'firstName lastName' },
    });

    // Same live-count approach as departmentController.getDepartments -
    // computed fresh for the report rather than trusting a stored count.
    const rows = await Promise.all(
      departments.map(async (d) => {
        const employeeCount = await Employee.countDocuments({
          department: d.name,
          status: { $ne: 'terminated' },
        });
        return {
          name: d.name,
          description: d.description || '',
          manager: d.manager?.user
            ? `${d.manager.user.firstName} ${d.manager.user.lastName}`
            : 'Unassigned',
          employeeCount,
        };
      })
    );

    const columns = [
      { key: 'name', label: 'Department' },
      { key: 'description', label: 'Description' },
      { key: 'manager', label: 'Manager' },
      { key: 'employeeCount', label: 'Employees' },
    ];

    await sendReport(req, res, { filename: 'departments-report', title: 'Departments Report', columns, rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.attendanceReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 1);
      filter.date = { $gte: start, $lt: end };
    }

    const records = await Attendance.find(filter)
      .populate({
        path: 'employee',
        select: 'employeeId user',
        populate: { path: 'user', select: 'firstName lastName' },
      })
      .sort({ date: -1 });

    const columns = [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'date', label: 'Date' },
      { key: 'clockIn', label: 'Clock In' },
      { key: 'clockOut', label: 'Clock Out' },
      { key: 'hours', label: 'Hours' },
      { key: 'status', label: 'Status' },
    ];

    const rows = records.map((r) => ({
      employeeId: r.employee?.employeeId,
      name: `${r.employee?.user?.firstName} ${r.employee?.user?.lastName}`,
      date: r.date.toISOString().slice(0, 10),
      clockIn: r.clockIn
        ? new Date(r.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '',
      clockOut: r.clockOut
        ? new Date(r.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '',
      hours: r.workingHours ?? '',
      status: r.status,
    }));

    await sendReport(req, res, { filename: 'attendance-report', title: 'Attendance Report', columns, rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.leaveReport = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const leaves = await Leave.find(filter)
      .populate({
        path: 'employee',
        select: 'employeeId department user',
        populate: { path: 'user', select: 'firstName lastName' },
      })
      .sort({ createdAt: -1 });

    const columns = [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'department', label: 'Department' },
      { key: 'leaveType', label: 'Type' },
      { key: 'startDate', label: 'Start' },
      { key: 'endDate', label: 'End' },
      { key: 'days', label: 'Days' },
      { key: 'status', label: 'Status' },
    ];

    const rows = leaves.map((l) => ({
      employeeId: l.employee?.employeeId,
      name: `${l.employee?.user?.firstName} ${l.employee?.user?.lastName}`,
      department: l.employee?.department,
      leaveType: l.leaveType,
      startDate: l.startDate.toISOString().slice(0, 10),
      endDate: l.endDate.toISOString().slice(0, 10),
      days: l.numberOfDays,
      status: l.status,
    }));

    await sendReport(req, res, { filename: 'leave-report', title: 'Leave Report', columns, rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.payrollReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const payrolls = await Payroll.find(filter)
      .populate({
        path: 'employee',
        select: 'employeeId department user',
        populate: { path: 'user', select: 'firstName lastName' },
      })
      .sort({ year: -1, month: -1 });

    const columns = [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'department', label: 'Department' },
      { key: 'period', label: 'Period' },
      { key: 'basicSalary', label: 'Basic Salary' },
      { key: 'grossPay', label: 'Gross Pay' },
      { key: 'totalDeductions', label: 'Deductions' },
      { key: 'netPay', label: 'Net Pay' },
      { key: 'status', label: 'Status' },
    ];

    const rows = payrolls.map((p) => ({
      employeeId: p.employee?.employeeId,
      name: `${p.employee?.user?.firstName} ${p.employee?.user?.lastName}`,
      department: p.employee?.department,
      period: `${p.month}/${p.year}`,
      basicSalary: p.basicSalary,
      grossPay: p.grossPay,
      totalDeductions: p.totalDeductions,
      netPay: p.netPay,
      status: p.status,
    }));

    await sendReport(req, res, { filename: 'payroll-report', title: 'Payroll Report', columns, rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};