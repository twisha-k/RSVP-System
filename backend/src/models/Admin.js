const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'super-admin'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: [
      'manage-users',
      'manage-events',
      'manage-comments',
      'view-analytics',
      'manage-admins',
      'system-settings'
    ]
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  sessionToken: String,
  sessionExpire: Date
}, {
  timestamps: true
});

// Index for better query performance
adminSchema.index({ role: 1 });
adminSchema.index({ status: 1 });

// Virtual for account lock status
adminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Match password method
adminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Increment login attempts
adminSchema.methods.incLoginAttempts = function() {
  // Set default values if not set
  if (!this.loginAttempts) this.loginAttempts = 0;
  
  this.loginAttempts += 1;
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  }
  
  return this.save();
};

// Reset login attempts
adminSchema.methods.resetLoginAttempts = function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  return this.save();
};

// Generate session token
adminSchema.methods.generateSessionToken = function() {
  const crypto = require('crypto');
  const sessionToken = crypto.randomBytes(32).toString('hex');
  
  this.sessionToken = crypto
    .createHash('sha256')
    .update(sessionToken)
    .digest('hex');
  
  // Session expires in 24 hours
  this.sessionExpire = Date.now() + 24 * 60 * 60 * 1000;
  
  return sessionToken;
};

// Check if user has permission
adminSchema.methods.hasPermission = function(permission) {
  return this.role === 'super-admin' || this.permissions.includes(permission);
};

// Get default permissions based on role
adminSchema.statics.getDefaultPermissions = function(role) {
  if (role === 'super-admin') {
    return [
      'manage-users',
      'manage-events',
      'manage-comments',
      'view-analytics',
      'manage-admins',
      'system-settings'
    ];
  } else if (role === 'admin') {
    return [
      'manage-users',
      'manage-events',
      'manage-comments',
      'view-analytics'
    ];
  }
  return [];
};

// Transform output (remove sensitive data)
adminSchema.methods.toJSON = function() {
  const admin = this.toObject();
  delete admin.passwordHash;
  delete admin.resetPasswordToken;
  delete admin.resetPasswordExpire;
  delete admin.sessionToken;
  delete admin.sessionExpire;
  delete admin.loginAttempts;
  delete admin.lockUntil;
  return admin;
};

// Static method to create super admin
adminSchema.statics.createSuperAdmin = async function(email, password, name) {
  const existingAdmin = await this.findOne({ email });
  if (existingAdmin) {
    throw new Error('Admin with this email already exists');
  }
  
  const permissions = this.getDefaultPermissions('super-admin');
  
  const admin = new this({
    email,
    passwordHash: password,
    name,
    role: 'super-admin',
    permissions,
    status: 'active'
  });
  
  return admin.save();
};

// Static method for login with attempt tracking
adminSchema.statics.loginWithAttempts = async function(email, password) {
  const admin = await this.findOne({ email, status: 'active' });
  
  if (!admin) {
    throw new Error('Invalid credentials');
  }
  
  // Check if account is locked
  if (admin.isLocked) {
    throw new Error('Account is temporarily locked due to too many failed login attempts');
  }
  
  const isMatch = await admin.matchPassword(password);
  
  if (!isMatch) {
    await admin.incLoginAttempts();
    throw new Error('Invalid credentials');
  }
  
  // Reset login attempts on successful login
  await admin.resetLoginAttempts();
  
  return admin;
};

module.exports = mongoose.model('Admin', adminSchema);