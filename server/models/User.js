import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['citizen', 'admin', 'village_authority', 'mandal_authority', 'district_authority'], default: 'citizen' },
  jurisdiction: { type: String },
  phone: { type: String, required: true },
  govId: { type: String },
  ward: { type: String },
  address: {
    houseNo: { type: String },
    street: { type: String },
    colony: { type: String },
    landmark: { type: String },
    city: { type: String },
    district: { type: String },
    state: { type: String },
    pincode: { type: String }
  },
  avatar: { type: String, default: 'https://i.pravatar.cc/150?u=chandu' },
  canPost: { type: Boolean, default: true },
  passwordChanged: { type: Boolean, default: false },
  notifications: [{ 
      message: { type: String }, 
      read: { type: Boolean, default: false }, 
      date: { type: Date, default: Date.now },
      type: { type: String, default: 'system' }
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
