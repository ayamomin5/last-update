const mongoose = require('mongoose');

const OpportunitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  requirements: [{ type: String }],
  location: { type: String },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  status: { 
    type: String, 
    enum: ['draft', 'active', 'closed', 'expired'],
    default: 'active'
  },
  category: { 
    type: String,
    enum: ['software', 'data', 'design', 'marketing', 'business', 'other'],
    required: true
  },
  opportunityType: {
    type: String,
    enum: ['internship', 'externship', 'freelance', 'part-time', 'full-time', 'remote', 'contract', 'research', 'apprenticeship'],
    required: true
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'senior', 'expert'],
    default: 'entry'
  },
  tags: [{ type: String }],
  salary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'USD' }
  },
  duration: { type: String },
  deadline: { type: Date },
  analytics: {
    views: { type: Number, default: 0 },
    applications: { type: Number, default: 0 },
    interviews: { type: Number, default: 0 },
    hires: { type: Number, default: 0 }
  },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }
}, { 
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Add indexes for faster queries
OpportunitySchema.index({ company: 1, status: 1 });
OpportunitySchema.index({ category: 1, status: 1 });
OpportunitySchema.index({ experienceLevel: 1 });
OpportunitySchema.index({ tags: 1 });
OpportunitySchema.index({ deadline: 1 }, { expireAfterSeconds: 0 });

// Add method to check if opportunity is expired
OpportunitySchema.methods.isExpired = function() {
  return this.deadline && new Date() > this.deadline;
};

// Add method to update analytics
OpportunitySchema.methods.updateAnalytics = async function(type) {
  if (this.analytics[type] !== undefined) {
    this.analytics[type]++;
    await this.save();
  }
};

module.exports = mongoose.model('Opportunity', OpportunitySchema); 