const User = require("./../model/userModel");
const Story = require("./../model/storyModel");
const Comment = require("./../model/commentModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Email = require("./../utils/email");

exports.addComment = catchAsync(async (req, res, next) => {
  let comment = {};
  comment.author = req.user.id;
  comment.story = req.params.id;
  comment.comment = req.body.comment;
  comment.rating = 0;
  await Comment.create(comment);
  res.status(200).json({
    status: "success",
    data: comment,
  });
});

exports.getComments = catchAsync(async (req, res, next) => {
  const story = await Story.findById(req.params.id).populate("comments");
  res.status(200).json({
    status: "success",
    data: story,
  });
});

exports.updateStory = catchAsync(async function (req, res, next) {
  const story = await Story.findById(req.params.id);
  if (!(req.user.id === String(story.author)))
    return next(new AppError("you are not the author of this story!"));
  const updatedStory = await Story.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.status(200).json({
    status: "success",
    data: updatedStory,
  });
});

exports.removeStory = catchAsync(async function (req, res, next) {
  const story = await Story.findById(req.params.id);
  if (!(req.user.id === String(story.author)))
    return next(new AppError("you are not the author of this story!"));
  await Story.findByIdAndDelete(req.params.id);
  res.status(201).json({
    status: "success",
  });
});

exports.getAllStories = catchAsync(async function (req, res, next) {
  const story = await Story.find();
  res.status(200).json({
    status: "success",
    data: story,
  });
});
