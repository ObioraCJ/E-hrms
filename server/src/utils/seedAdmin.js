require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const exists = await User.findOne({ role: 'admin' });
  if (exists) {
    console.log('Admin already exists');
    process.exit(0);
  }
  await User.create({
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@hrms.com',
    password: 'ChangeMe123!',
    role: 'super_admin',
    isEmailVerified: true,
  });
  console.log('Admin created: admin@hrms.com / ChangeMe123!');
  process.exit(0);
};
seed();
