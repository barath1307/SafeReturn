const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Password is optional for accounts created through Google Sign-In.
    password: { type: String, required: false, select: true },
    googleId: { type: String, unique: true, sparse: true },
    authProvider: { type: String, enum: ["local", "google", "both"], default: "local" },
    avatar: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
