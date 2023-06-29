const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  story: {
    type: mongoose.Schema.ObjectId,
    ref: "story",
    required: [true, "a comment must belong to a story"],
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
    required: [true, "a comment must have an author"],
  },
  rating: {
    type: Number,
    default: 0,
  },
  private: {
    type: Boolean,
    default: false,
  },
  comment: {
    type: String,
    required: [true, "a comment must be provided"],
    maxLength: 200,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  createdOn: {
    type: Date,
    default: Date.now(),
  },
});

const Comment = mongoose.model("comment", commentSchema);
module.exports = Comment;
