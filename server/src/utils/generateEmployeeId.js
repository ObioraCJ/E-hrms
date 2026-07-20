const Employee = require('../models/Employee');

// Generates a human-friendly, sequential employee ID like "EMP0001",
// "EMP0002", etc. This runs on the server so admins never type it
// manually (no typos, no accidental duplicates from human entry).
const generateEmployeeId = async () => {
  const count = await Employee.countDocuments();
  const nextNumber = count + 1;
  // padStart(4, '0') turns 1 into "0001", 23 into "0023", etc.
  return `EMP${String(nextNumber).padStart(4, '0')}`;
};

module.exports = generateEmployeeId;