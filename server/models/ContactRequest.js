const mongoose = require("mongoose");

const contactRequestSchema = new mongoose.Schema(
  {
    safeReturnId: {
      type: String,
      required: true,
      index: true,
    },

    identity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Identity",
      required: true,
    },

    finderName: {
      type: String,
      required: true,
      trim: true,
    },

    finderContact: {
      type: String,
      required: true,
      trim: true,
    },

    // Populated for authenticated Google/password users; optional for anonymous requests.
    finderEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Resolved"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ContactRequest",
  contactRequestSchema
);