const cron = require('node-cron');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { createNotificationForMany } = require('./createNotification');

const checkBirthdaysToday = async () => {
  try {
    const today = new Date();
    const month = today.getMonth() + 1; // JS months are 0-indexed
    const day = today.getDate();

    // MongoDB can't directly query "month/day matches, ignoring year"
    // with a simple field comparison, since dateOfBirth is stored as a
    // full date. $expr + $month/$dayOfMonth lets us compare just those
    // two components server-side, which is far more efficient than
    // pulling every employee into Node and checking in JavaScript.
    const employeesWithBirthdayToday = await Employee.find({
      dateOfBirth: { $ne: null },
      $expr: {
        $and: [
          { $eq: [{ $month: '$dateOfBirth' }, month] },
          { $eq: [{ $dayOfMonth: '$dateOfBirth' }, day] },
        ],
      },
      status: 'active',
    }).populate('user', 'firstName lastName');

    if (employeesWithBirthdayToday.length === 0) return;

    // Notify every active HR/admin user about each birthday - matches
    // your spec's "Birthday Reminder" as a company-wide/HR-facing
    // notification, not a message sent to the birthday person themselves.
    const hrUsers = await User.find({
      role: { $in: ['super_admin', 'hr_manager'] },
      isActive: true,
    }).select('_id');

    if (hrUsers.length === 0) return;

    for (const emp of employeesWithBirthdayToday) {
      await createNotificationForMany({
        recipients: hrUsers.map((u) => u._id),
        type: 'birthday',
        title: 'Birthday today 🎂',
        message: `Today is ${emp.user?.firstName} ${emp.user?.lastName}'s birthday!`,
        link: `/employees/${emp._id}/edit`,
      });
    }

    console.log(`Birthday check: notified HR about ${employeesWithBirthdayToday.length} birthday(s) today`);
  } catch (err) {
    console.error('Birthday reminder job failed:', err.message);
  }
};

// Schedules the check to run every day at 7:00 AM server time.
// Cron syntax: minute hour day-of-month month day-of-week
// "0 7 * * *" = at minute 0 of hour 7, every day, every month, every weekday.
const startBirthdayReminderJob = () => {
  cron.schedule('0 7 * * *', () => {
    console.log('Running daily birthday reminder check...');
    checkBirthdaysToday();
  });
  console.log('Birthday reminder job scheduled (daily at 7:00 AM)');
};

module.exports = { startBirthdayReminderJob, checkBirthdaysToday };