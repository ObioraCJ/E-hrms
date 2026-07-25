const Settings = require('../models/Settings');
const getSettings = require('../utils/getSettings');

exports.getSettingsData = async (req, res) => {
  try {
    const settings = await getSettings();
    res.status(200).json({ settings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await getSettings();

    const { companyName, workSchedule, payrollRates, leaveAllocations } = req.body;

    if (companyName !== undefined) settings.companyName = companyName;

    // Merge rather than replace wholesale - if the frontend only sends
    // { workSchedule: { startHour: 8 } } without graceMinutes/fullDayHours,
    // we don't want those to silently reset to undefined.
    if (workSchedule) {
      Object.assign(settings.workSchedule, workSchedule);
    }
    if (payrollRates) {
      Object.assign(settings.payrollRates, payrollRates);
    }
    if (leaveAllocations) {
      Object.assign(settings.leaveAllocations, leaveAllocations);
    }

    await settings.save();
    res.status(200).json({ message: 'Settings updated', settings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.addHoliday = async (req, res) => {
  try {
    const { name, date } = req.body;
    if (!name || !date) {
      return res.status(400).json({ message: 'Name and date are required' });
    }

    const settings = await getSettings();
    settings.holidays.push({ name, date });
    // Keep holidays sorted chronologically, so the list always displays
    // in a sensible order regardless of the order they were added in.
    settings.holidays.sort((a, b) => new Date(a.date) - new Date(b.date));

    await settings.save();
    res.status(201).json({ message: 'Holiday added', settings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const settings = await getSettings();
    settings.holidays = settings.holidays.filter(
      (h) => h._id.toString() !== req.params.holidayId
    );
    await settings.save();
    res.status(200).json({ message: 'Holiday removed', settings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};