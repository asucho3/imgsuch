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
  comment: {
    type: String,
    required: [true, "a comment must be provided"],
  },
});

const Comment = mongoose.model("comment", commentSchema);
module.exports = Comment;
