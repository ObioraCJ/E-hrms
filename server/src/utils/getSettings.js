const Settings = require('../models/Settings');

// Ensures a Settings document always exists, creating one with schema
// defaults on the very first call if none exists yet. Every controller
// that needs settings calls this instead of Settings.findOne() directly,
// so we never have to handle "what if settings don't exist yet" logic
// in more than one place.
const getSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
};

module.exports = getSettings;