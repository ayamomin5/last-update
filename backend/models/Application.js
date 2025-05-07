const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  date: { type: Date, default: Date.now }
});

const InterviewRoundSchema = new mongoose.Schema({
  round: { type: Number, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  link: { type: String },
  type: { type: String, enum: ['phone', 'video', 'onsite'], required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  feedback: { type: String },
  interviewer: { type: String }
});

const ApplicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'new', 'under_review', 'reviewing', 'interview', 'interview_scheduled', 'accepted', 'rejected', 'withdrawn'], 
    default: 'pending' 
  },
  resume: { type: String },
  coverLetter: { type: String },
  interview: { type: Object, default: {} },
  interviewRounds: [InterviewRoundSchema],
  notes: [NoteSchema],
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  lastStatusChange: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Add index for faster queries
ApplicationSchema.index({ opportunity: 1, status: 1 });
ApplicationSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('Application', ApplicationSchema); 