const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'resumes');

// Ensure the upload folder actually exists on disk before multer tries
// to write into it - a fresh clone of this repo won't have an
// uploads/ folder yet (it's gitignored, same reasoning as node_modules
// or .env - generated/user content doesn't belong in version control).
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Prefixes with a timestamp so two candidates uploading files both
    // named "resume.pdf" don't overwrite each other on disk.
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Restricts uploads to PDF and Word documents only - resumes should
// never realistically be images, executables, or anything else, and
// this also closes off a class of potential abuse (uploading arbitrary
// file types to the server).
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Word documents are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = upload;