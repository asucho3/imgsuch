const User = require("../model/userModel");
const Story = require("../model/storyModel");
const Comment = require("../model/commentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Email = require("../utils/email");

exports.updateComment = catchAsync(async (req, res, next) => {
  // check that the comment is not empty
  if (!req.body.comment) return next(new AppError("comment cannot be empty"));

  const updatedComment = await Comment.findByIdAndUpdate(
    req.params.id,
    { comment: req.body.comment },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    data: updatedComment,
  });
});

exports.toggleRateComment = catchAsync(async function (req, res, next) {
  // adjust the rate variable for upvote/remove upvote
  let rate;
  if (req.user.ratedComments.includes(String(req.params.id))) {
    rate = -1;
    req.user.ratedComments = req.user.ratedComments.filter(
      (commentID) => String(commentID) !== String(req.params.id)
    );
  } else {
    rate = 1;
    req.user.ratedComments = [...req.user.ratedComments, req.params.id];
  }

  req.model.rating = Number(req.model.rating);
  req.model.rating += rate;

  // execute the query
  const updatedComment = await Comment.findByIdAndUpdate(
    req.params.id,
    {
      rating: req.model.rating,
    },
    { new: true }
  );
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      ratedComments: req.user.ratedComments,
    },
    { new: true }
  );

  const data = { updatedComment, updatedUser };

  res.status(200).json({
    status: "success",
    data,
  });
});

exports.disableComment = catchAsync(async (req, res, next) => {
  //delete the comment
  const updatedComment = await Comment.findByIdAndUpdate(
    req.params.id,
    { disabled: true },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    data: updatedComment,
  });
});

exports.removeComment = catchAsync(async (req, res, next) => {
  //delete the comment
  await Comment.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
  });
});
