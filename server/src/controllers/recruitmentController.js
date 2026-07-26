const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const JobVacancy = require('../models/JobVacancy');
const Application = require('../models/Application');
const { createNotificationForMany } = require('../utils/createNotification');
const User = require('../models/User');

// ---- PUBLIC: list open vacancies (no auth) ----
exports.getPublicVacancies = async (req, res) => {
  try {
    const vacancies = await JobVacancy.find({ status: 'open' })
      .select('-postedBy')
      .sort({ createdAt: -1 });
    res.status(200).json({ vacancies });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- PUBLIC: view one open vacancy (no auth) ----
exports.getPublicVacancyById = async (req, res) => {
  try {
    const vacancy = await JobVacancy.findOne({ _id: req.params.id, status: 'open' }).select(
      '-postedBy'
    );
    if (!vacancy) {
      return res.status(404).json({ message: 'Vacancy not found or no longer open' });
    }
    res.status(200).json({ vacancy });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- PUBLIC: submit an application (no auth, includes file upload) ----
exports.applyToVacancy = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If validation fails AFTER multer already saved the file to disk,
    // clean it up rather than leaving an orphaned file with no
    // associated application record.
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const vacancy = await JobVacancy.findOne({ _id: req.params.id, status: 'open' });
    if (!vacancy) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: 'Vacancy not found or no longer open' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'A resume file is required' });
    }

    const { candidateName, candidateEmail, candidatePhone, coverLetter } = req.body;

    const application = await Application.create({
      vacancy: vacancy._id,
      candidateName,
      candidateEmail,
      candidatePhone,
      coverLetter,
      resumePath: req.file.path,
      resumeOriginalName: req.file.originalname,
    });

    // Notify HR/admin about the new application.
    const hrUsers = await User.find({
      role: { $in: ['super_admin', 'hr_manager'] },
      isActive: true,
    }).select('_id');

    if (hrUsers.length > 0) {
      await createNotificationForMany({
        recipients: hrUsers.map((u) => u._id),
        type: 'announcement',
        title: 'New job application',
        message: `${candidateName} applied for ${vacancy.title}.`,
        link: `/recruitment/applications/${application._id}`,
      });
    }

    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- ADMIN: create vacancy ----
exports.createVacancy = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, department, description, requirements, employmentType, closingDate } = req.body;

    const vacancy = await JobVacancy.create({
      title,
      department,
      description,
      requirements,
      employmentType,
      closingDate: closingDate || null,
      postedBy: req.user._id,
    });

    res.status(201).json({ message: 'Vacancy created', vacancy });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- ADMIN: list all vacancies (including closed) ----
exports.getAllVacancies = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const vacancies = await JobVacancy.find(filter)
      .populate('postedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Attach a live application count to each vacancy, same pattern
    // as Department's employeeCount - computed fresh, never stored.
    const withCounts = await Promise.all(
      vacancies.map(async (v) => {
        const applicationCount = await Application.countDocuments({ vacancy: v._id });
        return { ...v.toObject(), applicationCount };
      })
    );

    res.status(200).json({ vacancies: withCounts });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- ADMIN: update vacancy (e.g. close it) ----
exports.updateVacancy = async (req, res) => {
  try {
    const vacancy = await JobVacancy.findById(req.params.id);
    if (!vacancy) {
      return res.status(404).json({ message: 'Vacancy not found' });
    }

    const fields = ['title', 'department', 'description', 'requirements', 'employmentType', 'status', 'closingDate'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) vacancy[field] = req.body[field];
    });

    await vacancy.save();
    res.status(200).json({ message: 'Vacancy updated', vacancy });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- ADMIN: list applications (optionally filtered by vacancy/status) ----
exports.getApplications = async (req, res) => {
  try {
    const { vacancyId, status } = req.query;
    const filter = {};
    if (vacancyId) filter.vacancy = vacancyId;
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate('vacancy', 'title department')
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- ADMIN: get one application ----
exports.getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('vacancy', 'title department')
      .populate('interviews.interviewer', 'firstName lastName')
      .populate('offer.sentBy', 'firstName lastName');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.status(200).json({ application });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- ADMIN: download a candidate's resume (protected, not public) ----
exports.downloadResume = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (!fs.existsSync(application.resumePath)) {
      return res.status(404).json({ message: 'Resume file not found on server' });
    }

    res.download(application.resumePath, application.resumeOriginalName || 'resume.pdf');
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- ADMIN: update application status (shortlist/reject/hire/etc) ----
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, internalNotes } = req.body;
    const validStatuses = ['applied', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (status !== undefined) application.status = status;
    if (internalNotes !== undefined) application.internalNotes = internalNotes;

    await application.save();
    res.status(200).json({ message: 'Application updated', application });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- ADMIN: schedule an interview round ----
exports.scheduleInterview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const { scheduledAt, mode, interviewer, notes } = req.body;

    application.interviews.push({ scheduledAt, mode, interviewer, notes });
    if (application.status === 'shortlisted' || application.status === 'applied') {
      application.status = 'interview_scheduled';
    }

    await application.save();
    res.status(201).json({ message: 'Interview scheduled', application });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- ADMIN: send an offer ----
exports.sendOffer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const { position, salary, startDate } = req.body;

    application.offer = {
      position,
      salary,
      startDate,
      sentAt: new Date(),
      sentBy: req.user._id,
    };
    application.status = 'offered';

    await application.save();
    res.status(200).json({ message: 'Offer sent', application });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};