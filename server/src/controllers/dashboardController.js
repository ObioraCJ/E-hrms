const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');

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

     const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const canViewPayroll = ['super_admin', 'hr_manager'].includes(req.user.role);

     const [
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      terminatedEmployees,
      totalDepartments,
      newHiresThisMonth,
      todaysAttendanceCount,
      pendingLeaveRequests,
      monthlyPayrollTotal,
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'active' }),
      Employee.countDocuments({ status: 'on-leave' }),
      Employee.countDocuments({ status: 'terminated' }),
      Department.countDocuments(),
      Employee.countDocuments({ dateOfJoining: { $gte: startOfMonth } }),
      Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
      Leave.countDocuments({ status: 'pending' }),
      // Only actually compute this expensive aggregation if the
      // logged-in user is even allowed to see payroll figures at all -
      // no point running the query just to discard the result.
      canViewPayroll
        ? Payroll.aggregate([
            { $match: { month: today.getMonth() + 1, year: today.getFullYear() } },
            { $group: { _id: null, total: { $sum: '$netPay' } } },
          ])
        : Promise.resolve(null),
    ]);

    res.status(200).json({
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      terminatedEmployees,
      totalDepartments,
      newHiresThisMonth,
      todaysAttendanceCount,
      pendingLeaveRequests,
      // The aggregate returns an array like [{ _id: null, total: 45000 }]
      // or an empty array if no matching payroll records exist yet -
      // this safely extracts just the number, defaulting to 0.
      monthlyPayrollTotal: canViewPayroll ? (monthlyPayrollTotal[0]?.total || 0) : null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getChartsData = async (req, res) => {
  try {
    // Attendance trend: count of attendance records per day, for the
    // last 7 days including today.
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const attendanceRecords = await Attendance.find({
      date: { $gte: sevenDaysAgo },
    }).select('date status');

    // Builds a map of "YYYY-MM-DD" -> count, pre-filled with 0 for
    // every day in the range (so days with zero attendance still show
    // up as a bar/point at 0, rather than being missing from the chart
    // entirely).
    const attendanceTrend = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      attendanceTrend[d.toISOString().slice(0, 10)] = 0;
    }
    attendanceRecords.forEach((rec) => {
      const key = rec.date.toISOString().slice(0, 10);
      if (attendanceTrend[key] !== undefined) attendanceTrend[key] += 1;
    });

    // Department distribution: how many active employees are in each department.
    const departments = await Department.find().select('name');
    const departmentDistribution = await Promise.all(
      departments.map(async (dept) => ({
        department: dept.name,
        count: await Employee.countDocuments({ department: dept.name, status: { $ne: 'terminated' } }),
      }))
    );

    // Leave statistics: breakdown of ALL leave requests by status.
    const leaveStatusCounts = await Leave.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const leaveStats = leaveStatusCounts.map((item) => ({
      status: item._id,
      count: item.count,
    }));

    res.status(200).json({
      attendanceTrend: Object.entries(attendanceTrend).map(([date, count]) => ({ date, count })),
      departmentDistribution,
      leaveStats,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};