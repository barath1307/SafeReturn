const mongoose = require("mongoose");

const identitySchema = new mongoose.Schema(
  {
    safeReturnId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "Other",
    },

    description: {
      type: String,
      default: "",
    },

    imageName: {
      type: String,
      default: "",
    },

    analysis: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Identity", identitySchema);