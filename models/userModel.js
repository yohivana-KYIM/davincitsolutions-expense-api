import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  alertThresholds: {
    seventyFivePercent: {
      type: Boolean,
      default: false,
    },
    fiftyPercent: {
      type: Boolean,
      default: false,
    },
    twentyFivePercent: {
      type: Boolean,
      default: false,
    },
    tenPercent: {
      type: Boolean,
      default: false,
    },
    fivePercent: {
      type: Boolean,
      default: false,
    },
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;