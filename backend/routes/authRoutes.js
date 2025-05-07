const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Authentication middleware
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

// Company middleware
function companyAuth(req, res, next) {
  if (req.user.role !== 'company') return res.status(403).json({ msg: 'Forbidden' });
  next();
}

// ===== AUTH ROUTES =====

// Register Student
router.post('/register/student', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await Student.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Student already exists' });
    const hash = await bcrypt.hash(password, 10);
    const student = await Student.create({ name, email, password: hash });
    res.json(student);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Register Company
router.post('/register/company', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await Company.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Company already exists' });
    const hash = await bcrypt.hash(password, 10);
    const company = await Company.create({ name, email, password: hash });
    res.json(company);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Login (Student or Company)
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body; // role: 'student' or 'company'
    let user;
    if (role === 'student') user = await Student.findOne({ email });
    else if (role === 'company') user = await Company.findOne({ email });
    else return res.status(400).json({ msg: 'Invalid role' });
    if (!user) return res.status(400).json({ msg: 'User not found' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Simple Password Reset (for testing)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, role } = req.body;
    let user;
    if (role === 'student') user = await Student.findOne({ email });
    else if (role === 'company') user = await Company.findOne({ email });
    else return res.status(400).json({ msg: 'Invalid role' });
    if (!user) return res.status(400).json({ msg: 'User not found' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ msg: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ===== COMPANY DASHBOARD ROUTES =====

// Get company dashboard statistics
router.get('/company/dashboard/stats', auth, companyAuth, async (req, res) => {
  try {
    const activePostings = await Opportunity.countDocuments({ 
      company: req.user.id,
      status: 'active'
    });

    const totalApplications = await Application.countDocuments({
      opportunity: { $in: await Opportunity.find({ company: req.user.id }).select('_id') }
    });

    const scheduledInterviews = await Application.countDocuments({
      opportunity: { $in: await Opportunity.find({ company: req.user.id }).select('_id') },
      'interview.date': { $exists: true }
    });

    res.json({
      activePostings,
      totalApplications,
      scheduledInterviews
    });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Get company profile
router.get('/company/profile', auth, companyAuth, async (req, res) => {
  try {
    const company = await Company.findById(req.user.id)
      .select('-password')
      .populate('opportunities');
    res.json(company);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Update company profile
router.put('/company/profile', auth, companyAuth, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'industry', 'location', 'description', 'website', 'contactEmail', 'logo'];
    const updates = Object.keys(req.body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const company = await Company.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!company) {
      return res.status(404).json({ msg: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Upload company logo
router.post('/company/profile/logo', auth, companyAuth, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    // Create full URL for the logo
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const logoUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    // Update company profile with new logo URL
    const company = await Company.findByIdAndUpdate(
      req.user.id,
      { logo: logoUrl },
      { new: true }
    ).select('-password');

    if (!company) {
      return res.status(404).json({ msg: 'Company not found' });
    }

    res.json({ logoUrl });
  } catch (error) {
    // If there's an error, try to delete the uploaded file
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({ msg: 'Failed to upload logo', error: error.message });
  }
});

// Get company's active opportunities with application counts
router.get('/company/opportunities/active', auth, companyAuth, async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ 
      company: req.user.id,
      status: 'active'
    });

    const opportunitiesWithStats = await Promise.all(
      opportunities.map(async (opp) => {
        const applicationCount = await Application.countDocuments({ opportunity: opp._id });
        const interviewCount = await Application.countDocuments({ 
          opportunity: opp._id,
          'interview.date': { $exists: true }
        });

        return {
          ...opp.toObject(),
          stats: {
            totalApplications: applicationCount,
            scheduledInterviews: interviewCount
          }
        };
      })
    );

    res.json(opportunitiesWithStats);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Get company's applications with filtering and sorting
router.get('/company/applications', auth, companyAuth, async (req, res) => {
  try {
    const { status, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;
    
    const query = {
      opportunity: { $in: await Opportunity.find({ company: req.user.id }).select('_id') }
    };
    
    if (status) query.status = status;

    const applications = await Application.find(query)
      .populate('student', 'name email profile')
      .populate('opportunity', 'title')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.json({
      applications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Add application note
router.post('/company/applications/:id/notes', auth, companyAuth, async (req, res) => {
  try {
    const { note } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: { text: note, addedBy: req.user.id, date: new Date() } } },
      { new: true }
    );
    res.json(application);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

module.exports = router; 