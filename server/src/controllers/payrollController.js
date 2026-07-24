const { validationResult } = require('express-validator');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

// Simple flat-rate assumptions, since there's no Settings module yet
// for company-specific tax brackets or pension percentages. These are
// deliberately basic placeholders - a real payroll system would need
// proper tax bracket logic, which varies heavily by country/region.
const TAX_RATE = 0.1; // 10% flat tax on gross pay
const PENSION_RATE = 0.08; // 8% of basic salary

// Given the raw inputs, computes gross pay, total deductions, and net
// pay. Pulled into one function since both generatePayroll (creating
// new records) and updatePayroll (editing a draft) need to redo this
// exact math whenever any component changes.
const computePayroll = ({
  basicSalary,
  allowances = 0,
  overtimeHours = 0,
  overtimeRate = 0,
  bonuses = 0,
  tax,
  pension,
  otherDeductions = 0,
}) => {
  const overtimePay = overtimeHours * overtimeRate;
  const grossPay = basicSalary + allowances + overtimePay + bonuses;

  // If tax/pension weren't explicitly provided, auto-calculate using
  // the flat rates above - but if HR explicitly set a value (e.g.
  // during an update), respect that instead of overwriting it.
  const computedTax = tax !== undefined ? tax : grossPay * TAX_RATE;
  const computedPension = pension !== undefined ? pension : basicSalary * PENSION_RATE;

  const totalDeductions = computedTax + computedPension + otherDeductions;
  const netPay = grossPay - totalDeductions;

  return {
    overtimePay,
    grossPay: Number(grossPay.toFixed(2)),
    tax: Number(computedTax.toFixed(2)),
    pension: Number(computedPension.toFixed(2)),
    totalDeductions: Number(totalDeductions.toFixed(2)),
    netPay: Number(netPay.toFixed(2)),
  };
};

// ---- GENERATE (bulk, for a given month/year) ----
// Creates a draft payroll record for every active employee who
// doesn't already have one for this period. Skips anyone who already
// has a record rather than erroring the whole batch, so this is safe
// to re-run (e.g. after adding a new employee mid-month).
exports.generatePayroll = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { month, year } = req.body;

    const activeEmployees = await Employee.find({ status: 'active' });

    const existing = await Payroll.find({ month, year }).select('employee');
    const alreadyGenerated = new Set(existing.map((p) => p.employee.toString()));

    const toCreate = activeEmployees.filter(
      (emp) => !alreadyGenerated.has(emp._id.toString()) && emp.salary
    );

    const skippedNoSalary = activeEmployees.filter((emp) => !emp.salary).length;

    const records = toCreate.map((emp) => {
      const calc = computePayroll({ basicSalary: emp.salary });
      return {
        employee: emp._id,
        month,
        year,
        basicSalary: emp.salary,
        overtimePay: calc.overtimePay,
        grossPay: calc.grossPay,
        tax: calc.tax,
        pension: calc.pension,
        totalDeductions: calc.totalDeductions,
        netPay: calc.netPay,
        generatedBy: req.user._id,
      };
    });

    const created = records.length > 0 ? await Payroll.insertMany(records) : [];

    res.status(201).json({
      message: `Generated ${created.length} payroll record(s)`,
      generated: created.length,
      alreadyExisted: alreadyGenerated.size,
      skippedNoSalary,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- LIST (HR/managers, with filters) ----
exports.getPayrolls = async (req, res) => {
  try {
    const { month, year, employeeId, status } = req.query;
    const filter = {};
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (employeeId) filter.employee = employeeId;
    if (status) filter.status = status;

    const payrolls = await Payroll.find(filter)
      .populate({
        path: 'employee',
        select: 'employeeId department user',
        populate: { path: 'user', select: 'firstName lastName' },
      })
      .sort({ year: -1, month: -1 });

    res.status(200).json({ payrolls });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- GET ONE (HR/managers) ----
exports.getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate({
      path: 'employee',
      select: 'employeeId department designation user',
      populate: { path: 'user', select: 'firstName lastName email' },
    });

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }

    res.status(200).json({ payroll });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- UPDATE (only while status is 'draft') ----
exports.updatePayroll = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    if (payroll.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft payroll records can be edited' });
    }

    const fields = ['allowances', 'overtimeHours', 'overtimeRate', 'bonuses', 'tax', 'pension', 'otherDeductions'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) payroll[field] = req.body[field];
    });

    const calc = computePayroll({
      basicSalary: payroll.basicSalary,
      allowances: payroll.allowances,
      overtimeHours: payroll.overtimeHours,
      overtimeRate: payroll.overtimeRate,
      bonuses: payroll.bonuses,
      // Only pass tax/pension through if THIS request explicitly set
      // them - otherwise let computePayroll auto-calculate from rates,
      // preserving the "explicit overrides auto-calc" behavior.
      tax: req.body.tax !== undefined ? payroll.tax : undefined,
      pension: req.body.pension !== undefined ? payroll.pension : undefined,
      otherDeductions: payroll.otherDeductions,
    });

    payroll.grossPay = calc.grossPay;
    payroll.tax = calc.tax;
    payroll.pension = calc.pension;
    payroll.totalDeductions = calc.totalDeductions;
    payroll.netPay = calc.netPay;

    await payroll.save();
    res.status(200).json({ message: 'Payroll updated', payroll });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- FINALIZE / MARK PAID ----
exports.updatePayrollStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['finalized', 'paid'].includes(status)) {
      return res.status(400).json({ message: 'Status must be finalized or paid' });
    }

    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }

    // Enforce the natural progression: draft -> finalized -> paid.
    // Can't skip straight from draft to paid, and can't go backwards.
    const validTransitions = { draft: 'finalized', finalized: 'paid' };
    if (validTransitions[payroll.status] !== status) {
      return res.status(400).json({
        message: `Cannot move from '${payroll.status}' to '${status}'`,
      });
    }

    payroll.status = status;
    await payroll.save();

    res.status(200).json({ message: `Payroll marked as ${status}`, payroll });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- MY PAYSLIPS (employee, self - only finalized/paid, never drafts) ----
exports.getMyPayslips = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: 'No employee profile linked to this account' });
    }

    const payrolls = await Payroll.find({
      employee: employee._id,
      status: { $in: ['finalized', 'paid'] },
    }).sort({ year: -1, month: -1 });

    res.status(200).json({ payrolls });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMyPayslipById = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: 'No employee profile linked to this account' });
    }

    const payroll = await Payroll.findOne({
      _id: req.params.id,
      employee: employee._id,
      status: { $in: ['finalized', 'paid'] },
    }).populate({
      path: 'employee',
      select: 'employeeId department designation user',
      populate: { path: 'user', select: 'firstName lastName email' },
    });

    if (!payroll) {
      return res.status(404).json({ message: 'Payslip not found' });
    }

    res.status(200).json({ payroll });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};