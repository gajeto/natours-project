/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Email not valid'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please insert a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //Only works on SAVE or CREATE
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//Hash password
userSchema.pre('save', async function (next) {
  //Only run if password was entered
  if (!this.isModified('password')) return next();

  if (process.env.NODE_ENV === 'LOADER') {
    this.isNew = true;
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; //This not persists in DB
  next();
});

//Before saving new password, update changedAt field
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  //If the token is sent before saving the document rest 1 second
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//Query middleware to show only active users
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//Function available for all documents using the Schema
userSchema.methods.checkCorrectPassword = async function (
  unhashedPassword,
  userPassword
) {
  return await bcrypt.compare(unhashedPassword, userPassword);
};

//Check if user changed password after jwt signing
userSchema.methods.changesPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }
  return false; //Not changed
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); //plain text token

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken; //Unencrypted token
};

const User = mongoose.model('User', userSchema);

module.exports = User;
