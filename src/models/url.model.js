const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UrlSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  originalUrl: {
    type: String,
    required: true,
  },
  shortId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  thumbnail: {
    type: String,
    default: null,
  },
  visits: [
    {
      ip: {
        type: String,
        default: null,
      },
      location: {
        type: Object,
        default: null,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Url = mongoose.model("Url", UrlSchema);

module.exports = Url;