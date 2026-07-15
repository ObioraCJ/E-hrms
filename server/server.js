require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');   // ← was './app', now points into src/

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:');
    console.error(err);
    process.exit(1);
  });
