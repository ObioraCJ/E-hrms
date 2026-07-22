const Employee = require('../models/Employee');
const Department = require('../models/Department');

exports.getSummary = async (req, res) => {
  try {
    // Start of the current calendar month, used to count "new hires"
    // joined since then. Setting date to 1 and zeroing the time gives
    // us midnight on the 1st of this month.
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Running these counts concurrently (Promise.all) rather than one
    // after another - since they're independent queries, there's no
    // reason to make the request wait for them sequentially.

     const [
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      terminatedEmployees,
      totalDepartments,
      newHiresThisMonth,
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'active' }),
      Employee.countDocuments({ status: 'on-leave' }),
      Employee.countDocuments({ status: 'terminated' }),
      Department.countDocuments(),
      Employee.countDocuments({ dateOfJoining: { $gte: startOfMonth } }),
    ]);

    res.status(200).json({
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      terminatedEmployees,
      totalDepartments,
      newHiresThisMonth,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};