const User = require("../model/userModel");
const Story = require("../model/storyModel");
const Comment = require("../model/commentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Email = require("../utils/email");

exports.updateComment = catchAsync(async (req, res, next) => {
  let comment = await Comment.findById(req.params.id);
  if (req.user.id !== String(comment.author))
    return next(new AppError("you are not the author of this comment!"));
  comment.comment = req.body.comment;
  await Comment.findByIdAndUpdate(req.params.id, comment, { new: true });
  res.status(200).json({
    status: "success",
    data: comment,
  });
});

exports.removeComment = catchAsync(async (req, res, next) => {
  let comment = await Comment.findById(req.params.id);
  if (req.user.id !== String(comment.author))
    return next(new AppError("you are not the author of this comment!"));
  await Comment.findByIdAndDelete(req.params.id);
  res.status(200).json({
    status: "success",
  });
});
