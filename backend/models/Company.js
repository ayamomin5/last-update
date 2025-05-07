const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: { type: Object, default: {} },
  opportunities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' }],
  industry: String,
  location: String,
  description: String,
  website: String,
  contactEmail: String,
  logo: String,
}, { 
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

module.exports = mongoose.model('Company', CompanySchema); 