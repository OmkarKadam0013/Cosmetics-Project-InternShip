const mongoose=require('mongoose');
const bcrypt=require('bcrypt');

const userSchema = new mongoose.Schema({
    firstName: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[A-Za-z]+$/.test(v); // Only letters allowed
        },
        message: "First name should only contain letters (upper or lower case).",
      },
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[A-Za-z]+$/.test(v); // Only letters allowed
        },
        message: "Last name should only contain letters (upper or lower case).",
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Ensures email is stored in lowercase
      validate: {
        validator: function (v) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v); // Valid email format
        },
        message: "Please enter a valid email address.",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      validate: {
        validator: function (v) {
          // Password should contain at least one uppercase, one lowercase, and one special character
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).+$/.test(v);
        },
        message:
          "Password should contain at least one uppercase letter, one lowercase letter, and one special character.",
      },
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v); // Validates 10-digit phone number
        },
        message: "Please enter a valid 10-digit phone number.",
      },
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    otp: { type: String },
  
    otpExpiry: { type: Date },
  
    role: { type: String, enum: ["user", "admin"], default: "user" },
    
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',  // Reference to the Cart model
      default: null,  // Initially empty
    },
  });
  
  // Pre-save middleware to hash the password
  userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  });
  
  const User = mongoose.model("User", userSchema);
  
  module.exports = User;
  