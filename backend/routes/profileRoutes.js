const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Company = require('../models/Company');

// Simple JWT auth middleware
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

// Add route to get student notifications
router.get('/notifications', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ msg: 'Forbidden' });
  const student = await Student.findById(req.user.id);
  res.json(student.notifications || []);
});

// Add route to mark all notifications as read
router.post('/notifications/read-all', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ msg: 'Forbidden' });
  const student = await Student.findByIdAndUpdate(
    req.user.id,
    { $set: { notifications: [] } },
    { new: true }
  );
  res.json({ msg: 'All notifications marked as read' });
});

// Add route to mark a single notification as read
router.delete('/notifications/:index', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ msg: 'Forbidden' });
  
  try {
    const index = parseInt(req.params.index);
    
    // Find the student first to get current notifications
    const student = await Student.findById(req.user.id);
    
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    
    // Check if index is valid
    if (isNaN(index) || index < 0 || index >= student.notifications.length) {
      return res.status(400).json({ msg: 'Invalid notification index' });
    }
    
    // Create a new array without the notification at the specified index
    const updatedNotifications = [
      ...student.notifications.slice(0, index),
      ...student.notifications.slice(index + 1)
    ];
    
    // Update the student's notifications
    student.notifications = updatedNotifications;
    await student.save();
    
    res.json({ msg: 'Notification marked as read', notifications: student.notifications });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get profile
router.get('/:role', auth, async (req, res) => {
  try {
    const { role } = req.params;
    let user;
    if (role === 'student') user = await Student.findById(req.user.id);
    else if (role === 'company') user = await Company.findById(req.user.id);
    else return res.status(400).json({ msg: 'Invalid role' });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put('/:role', auth, async (req, res) => {
  try {
    const { role } = req.params;
    // Clone req.body into updateFields (excluding sensitive fields if necessary)
    const updateFields = { ...req.body.profile };
    // Optional: protect certain fields from being updated
    delete updateFields._id;
    delete updateFields.createdAt;

    let user;
    if (role === 'student') {
      user = await Student.findByIdAndUpdate(req.body.profile._id, updateFields, { new: true });
    } else if (role === 'company') {
      user = await Company.findByIdAndUpdate(req.profile.body._id, updateFields, { new: true });
    } else {
      return res.status(400).json({ msg: 'Invalid role' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router; 