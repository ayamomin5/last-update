const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  phone: { type: String },
  title: { type: String },
  location: { type: String },
  profileImage: { type: String },
  skills: [{ type: String }],
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'senior', 'expert'],
    default: 'entry'
  },
  education: [{ type: Object }],
  experience: [{ type: Object }],

  savedOpportunities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' }],
  applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],
  notifications: [{ type: String }],

}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

module.exports = mongoose.model('Student', StudentSchema); 