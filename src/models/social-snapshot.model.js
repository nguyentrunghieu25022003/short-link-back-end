const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SocialSnapshotSchema = new Schema({
  userInfo: {
    type: String,
    required: true
  },
  email: [
    {
      type: String,
      default: null,
    },
  ],
  phoneNumber: [
    {
      type: String,
      default: null,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SocialSnapshot = mongoose.model("SocialSnapshot", SocialSnapshotSchema);

module.exports = SocialSnapshot;