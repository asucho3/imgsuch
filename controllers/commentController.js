const User = require("../model/userModel");
const Story = require("../model/storyModel");
const Comment = require("../model/commentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Email = require("../utils/email");

exports.updateComment = catchAsync(async (req, res, next) => {
  // check that the comment is not empty
  if (!req.body.comment) return next(new AppError("comment cannot be empty"));

  let comment = await Comment.findById(req.params.id);

  // check that the user is the author of this comment
  if (req.user.id !== String(comment.author))
    return next(new AppError("you are not the author of this comment!"));

  // perform the update
  comment.comment = req.body.comment;
  await Comment.findByIdAndUpdate(req.params.id, comment, { new: true });

  res.status(200).json({
    status: "success",
    data: comment,
  });
});

exports.removeComment = catchAsync(async (req, res, next) => {
  // check that the user is the author of this comment
  let comment = await Comment.findById(req.params.id);
  if (req.user.id !== String(comment.author))
    return next(new AppError("you are not the author of this comment!"));

  //delete the comment
  await Comment.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: "success",
  });
});
