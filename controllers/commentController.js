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

  // find the author of this story
  const author = await User.findOne({ _id: req.model.author });

  // adjust the rating on the temporary variables
  req.model.rating = Number(req.model.rating);
  req.model.rating += rate;
  author.rating = Number(author.rating);
  author.rating += rate;

  // execute the query
  // update the comment rating
  const updatedComment = await Comment.findByIdAndUpdate(
    req.params.id,
    {
      rating: req.model.rating,
    },
    { new: true }
  );
  // update the rated comments on the user doing the rating
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      ratedComments: req.user.ratedComments,
    },
    { new: true }
  );
  // update the rating on the author of the comment
  const updatedAuthor = await User.findByIdAndUpdate(
    author._id,
    {
      rating: author.rating,
    },
    { new: true }
  );

  const data = { updatedComment, updatedUser, updatedAuthor };

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
