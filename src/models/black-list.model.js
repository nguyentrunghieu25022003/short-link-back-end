const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BlackListSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    index: { expires: "7d" },
  },
});

const BlackList = mongoose.model("BlackList", BlackListSchema);

module.exports = BlackList;