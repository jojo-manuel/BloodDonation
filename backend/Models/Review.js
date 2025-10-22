// models/Review.js
// Review model for donor reviews by users

const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["donor", "bloodbank"],
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Donor",
    required: function() { return this.type === "donor"; }
  },
  bloodBankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BloodBank",
    required: function() { return this.type === "bloodbank"; }
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Compound index to prevent duplicate reviews from same user to same entity (donor or bloodbank)
ReviewSchema.index({ reviewerId: 1, type: 1, donorId: 1, bloodBankId: 1 }, { unique: true });

// Index for efficient queries
ReviewSchema.index({ type: 1, donorId: 1, createdAt: -1 });
ReviewSchema.index({ type: 1, bloodBankId: 1, createdAt: -1 });

const Review = mongoose.model("Review", ReviewSchema);

module.exports = Review;
