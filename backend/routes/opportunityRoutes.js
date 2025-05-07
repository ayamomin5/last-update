const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Opportunity = require('../models/Opportunity');
const Student = require('../models/Student');
const Company = require('../models/Company');
const mongoose = require('mongoose');
const Application = require('../models/Application');

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

// Get all opportunities
router.get('/', async (req, res) => {
  try {
    const { category, status, search, opportunityType, location, skills, minSalary, maxSalary, experienceLevel } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (location) {
      // Exact match for location with case-insensitivity
      query.location = {
        $regex: `^${location.trim()}$`,
        $options: 'i'
      };
    }
    if (search) {
      const opportunities = await Opportunity.aggregate([
        {
          $lookup: {
            from: 'companies',
            localField: 'company',
            foreignField: '_id',
            as: 'companyData'
          }
        },
        {
          $match: {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { 'companyData.name': { $regex: search, $options: 'i' } }
            ]
          }
        },
        {
          $lookup: {
            from: 'companies',
            localField: 'company',
            foreignField: '_id',
            as: 'company'
          }
        },
        {
          $unwind: '$company'
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            requirements: 1,
            location: 1,
            category: 1,
            opportunityType: 1,
            tags: 1,
            salary: 1,
            duration: 1,
            deadline: 1,
            status: 1,
            company: {
              _id: 1,
              name: 1,
              logo: 1,
              industry: 1,
              location: 1
            }
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ]);
      return res.json(opportunities);
    }
    if (opportunityType) {
      const types = opportunityType.split(',').map(t => t.trim().toLowerCase());
      query.opportunityType = { $in: types };
    }
    if (skills) {
      const skillsArray = String(skills).split(',').map(s => s.trim());
      query.tags = { $in: skillsArray };
    }
    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }
    
    // Add salary range filter: only include filters if provided
    if (minSalary) {
      // Filter for opportunities with minimum salary >= minSalary
      query['salary.min'] = { $gte: Number(minSalary) };
    }
    if (maxSalary) {
      // Filter for opportunities with maximum salary <= maxSalary
      query['salary.max'] = { $lte: Number(maxSalary) };
    }

    const opportunities = await Opportunity.find(query)
      .populate('company', 'name logo industry location')
      .sort({ createdAt: -1 });
    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Get company opportunities
router.get('/company', auth, async (req, res) => {
  try {
    if (req.user.role !== 'company') return res.status(403).json({ msg: 'Forbidden' });

    const { status, opportunityType } = req.query;
    const query = { company: req.user.id };
    if (status) query.status = status;
    if (opportunityType) query.opportunityType = opportunityType;

    const opportunities = await Opportunity.find(query)
      .populate('company', 'name logo industry location')
      .sort({ createdAt: -1 });

    // Count applications and interviews from Application collection
    const oppIds = opportunities.map(o => o._id);
    const allApplications = await Application.find({ opportunity: { $in: oppIds } });
    const activePostings = opportunities.filter((opp) => opp.status === 'active').length;
    const totalApplications = allApplications.length;
    const interviewsScheduled = allApplications.filter(app => 
      app.interview && 
      app.interview.date && 
      app.status !== 'accepted' && 
      app.status !== 'rejected'
    ).length;
    const acceptedApplications = allApplications.filter(app => app.status === 'accepted').length;
    const rejectedApplications = allApplications.filter(app => app.status === 'rejected').length;

    const stats = { activePostings, totalApplications, interviewsScheduled, acceptedApplications, rejectedApplications };
    res.json({ opportunities, stats });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Get opportunity by id
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('Fetching opportunity with ID:', req.params.id);
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid opportunity ID' });
    }

    const opp = await Opportunity.findById(req.params.id)
      .populate('company', 'name logo industry location description website')
      .populate('applicants', 'name email profile');

    if (!opp) {
      console.log('Opportunity not found:', req.params.id);
      return res.status(404).json({ msg: 'Opportunity not found' });
    }

    console.log('Successfully fetched opportunity:', opp._id);
    res.json(opp);
  } catch (error) {
    console.error('Error in get opportunity route:', error);
    res.status(500).json({ 
      msg: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create opportunity (company only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'company') return res.status(403).json({ msg: 'Forbidden' });

    const {
      title,
      description,
      requirements,
      location,
      category,
      tags,
      salary,
      duration,
      deadline,
      opportunityType
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }

    // Validate category
    const validCategories = ['software', 'data', 'design', 'marketing', 'business', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ msg: 'Invalid category' });
    }

    // Validate deadline if provided
    if (deadline && new Date(deadline) < new Date()) {
      return res.status(400).json({ msg: 'Deadline must be in the future' });
    }

    // Validate opportunityType
    const validTypes = ['internship', 'externship', 'freelance', 'part-time', 'full-time', 'remote', 'contract', 'research', 'apprenticeship'];
    if (!opportunityType || !validTypes.includes(opportunityType)) {
      return res.status(400).json({ msg: 'Invalid or missing opportunityType' });
    }

    // Create opportunity
    const opp = await Opportunity.create({
      title,
      description,
      requirements: requirements || [],
      location,
      category,
      opportunityType,
      tags: tags || [],
      salary: salary || {},
      duration,
      deadline,
      company: req.user.id,
      status: req.body.status || 'active',
      lastUpdatedBy: req.user.id
    });

    // Update company's opportunities
    await Company.findByIdAndUpdate(req.user.id, { $push: { opportunities: opp._id } });

    res.status(201).json(opp);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Update opportunity (company only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'company') return res.status(403).json({ msg: 'Forbidden' });

    const {
      title,
      description,
      requirements,
      location,
      category,
      tags,
      salary,
      duration,
      deadline,
      status,
      opportunityType
    } = req.body;

    // Validate category if provided
    if (category) {
      const validCategories = ['software', 'data', 'design', 'marketing', 'business', 'other'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ msg: 'Invalid category' });
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['draft', 'active', 'closed', 'expired'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ msg: 'Invalid status' });
      }
    }

    // Validate deadline if provided
    if (deadline && new Date(deadline) < new Date()) {
      return res.status(400).json({ msg: 'Deadline must be in the future' });
    }

    // Validate opportunityType if provided
    const validTypes = ['internship', 'externship', 'freelance', 'part-time', 'full-time', 'remote', 'contract', 'research', 'apprenticeship'];
    if (opportunityType && !validTypes.includes(opportunityType)) {
      return res.status(400).json({ msg: 'Invalid opportunityType' });
    }

    const opp = await Opportunity.findOneAndUpdate(
      { _id: req.params.id, company: req.user.id },
      {
        ...req.body,
        lastUpdatedBy: req.user.id
      },
      { new: true }
    );

    if (!opp) return res.status(404).json({ msg: 'Not found' });
    res.json(opp);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Delete opportunity (company only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'company') return res.status(403).json({ msg: 'Forbidden' });

    const opp = await Opportunity.findOneAndDelete({ _id: req.params.id, company: req.user.id });
    if (!opp) return res.status(404).json({ msg: 'Not found' });

    // Remove from company's opportunities
    await Company.findByIdAndUpdate(req.user.id, { $pull: { opportunities: req.params.id } });

    // Remove from students' saved opportunities
    await Student.updateMany(
      { savedOpportunities: req.params.id },
      { $pull: { savedOpportunities: req.params.id } }
    );

    res.json({ msg: 'Deleted' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Save opportunity (student)
router.post('/save/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ msg: 'Forbidden' });

    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ msg: 'Opportunity not found' });
    if (opportunity.status !== 'active') return res.status(400).json({ msg: 'Cannot save inactive opportunity' });

    await Student.findByIdAndUpdate(req.user.id, { $addToSet: { savedOpportunities: req.params.id } });
    res.json({ msg: 'Saved' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Unsave opportunity (student)
router.post('/unsave/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ msg: 'Forbidden' });

    await Student.findByIdAndUpdate(req.user.id, { $pull: { savedOpportunities: req.params.id } });
    res.json({ msg: 'Unsaved' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

module.exports = router; 