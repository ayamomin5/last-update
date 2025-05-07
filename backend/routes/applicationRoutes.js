const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Application = require('../models/Application');
const Opportunity = require('../models/Opportunity');
const Student = require('../models/Student');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

function auth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ msg: 'Invalid token' });
  }
}

// Apply to opportunity (student, with file upload)
router.post('/apply/:oppId', auth, upload.single('resume'), async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ msg: 'Forbidden' });
  // Prevent duplicate applications
  const existing = await Application.findOne({
    student: req.user.id,
    opportunity: req.params.oppId
  });
  if (existing) {
    return res.status(400).json({ msg: 'You have already applied to this opportunity.' });
  }
  const { coverLetter } = req.body;
  const resumePath = req.file ? `/uploads/${req.file.filename}` : '';
  const application = await Application.create({
    student: req.user.id,
    opportunity: req.params.oppId,
    resume: resumePath,
    coverLetter,
  });
  await Student.findByIdAndUpdate(req.user.id, { $push: { applications: application._id } });
  await Opportunity.findByIdAndUpdate(req.params.oppId, { $push: { applicants: req.user.id } });
  res.json(application);
});

// Get all applications for student
router.get('/student', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ msg: 'Forbidden' });
  const apps = await Application.find({ student: req.user.id })
    .populate({
      path: 'opportunity',
      populate: {
        path: 'company',
        select: 'name logo industry location'
      }
    });
  res.json(apps);
});

// Get all applications for company
router.get('/company', auth, async (req, res) => {
  if (req.user.role !== 'company') return res.status(403).json({ msg: 'Forbidden' });
  const apps = await Application.find().populate({
    path: 'opportunity',
    match: { company: req.user.id },
  }).populate('student');
  res.json(apps.filter(a => a.opportunity));
});

// Update application status (company)
router.put('/:id/status', auth, async (req, res) => {
  if (req.user.role !== 'company') return res.status(403).json({ msg: 'Forbidden' });
  const { status } = req.body;
  const app = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true });
   if (app && app.student) {
      let notification = null;
      if (status === 'accepted') notification = 'Your application was accepted.';
      if (status === 'rejected') notification = 'Your application was rejected.';
      if (notification) {
        await Student.findByIdAndUpdate(app.student, { $push: { notifications: notification } });
      }
    }
  res.json(app);
});

// Schedule interview (company)
router.put('/:id/interview', auth, async (req, res) => {
  if (req.user.role !== 'company') return res.status(403).json({ msg: 'Forbidden' });
  const { interview } = req.body; // { date, time, link }
  const app = await Application.findByIdAndUpdate(req.params.id, { interview, status: 'interview' }, { new: true });
  if (app && app.student) {
      await Student.findByIdAndUpdate(app.student, { $push: { notifications: 'Your interview is scheduled.' } });
    }
  res.json(app);
});

// Delete application (company or student)
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log(`Attempting to delete application: ${req.params.id}`);
    console.log('User role:', req.user.role);
    console.log('User ID:', req.user.id);
    
    // Find the application first
    const app = await Application.findById(req.params.id);
    console.log('Found application:', app ? 'Yes' : 'No');
    
    // Check if application exists
    if (!app) {
      console.log('Application not found');
      return res.status(404).json({ msg: 'Application not found' });
    }
    
    // Check if user is authorized to delete this application
    // Either the student who applied or the company that posted the opportunity
    const isStudent = req.user.role === 'student' && app.student.toString() === req.user.id;
    const isCompany = req.user.role === 'company';
    
    console.log('Authorization check:', { isStudent, isCompany });
    
    if (!isStudent && !isCompany) {
      console.log('User not authorized to delete application');
      return res.status(403).json({ msg: 'You are not authorized to delete this application' });
    }
    
    // Delete the application
    console.log('Deleting application...');
    const deletedApp = await Application.findByIdAndDelete(req.params.id);
    if (!deletedApp) {
      console.log('Failed to delete application');
      return res.status(500).json({ msg: 'Failed to delete application' });
    }
    
    // Remove from Opportunity.applicants
    console.log('Updating opportunity applicants...');
    const updatedOpp = await Opportunity.findByIdAndUpdate(
      app.opportunity,
      { $pull: { applicants: app.student } },
      { new: true }
    );
    if (!updatedOpp) {
      console.log('Failed to update opportunity');
      return res.status(500).json({ msg: 'Failed to update opportunity' });
    }
    
    // Remove from Student.applications
    console.log('Updating student applications...');
    const updatedStudent = await Student.findByIdAndUpdate(
      app.student,
      { $pull: { applications: app._id } },
      { new: true }
    );
    if (!updatedStudent) {
      console.log('Failed to update student');
      return res.status(500).json({ msg: 'Failed to update student' });
    }
    
    console.log('Application deleted successfully');
    return res.status(200).json({ 
      msg: 'Application deleted successfully',
      application: {
        id: deletedApp._id,
        status: 'deleted'
      }
    });
  } catch (err) {
    console.error('Error deleting application:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    return res.status(500).json({ 
      msg: 'Server error',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Student withdraw their own application
router.put('/:id/withdraw-student', auth, async (req, res) => {
  try {
    // Only students can withdraw
    if (req.user.role !== 'student') {
      return res.status(403).json({ msg: 'Forbidden: Only students can withdraw applications' });
    }
    
    // Find the application
    const app = await Application.findById(req.params.id);
    
    // Check if application exists
    if (!app) {
      return res.status(404).json({ msg: 'Application not found' });
    }
    
    // Verify the student is withdrawing their own application
    if (app.student.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Forbidden: You can only withdraw your own applications' });
    }
    
    // Update status to withdrawn
    app.status = 'withdrawn';
    await app.save();
    
    res.json({ msg: 'Application withdrawn successfully', application: app });
  } catch (err) {
    console.error('Error withdrawing application:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router; 