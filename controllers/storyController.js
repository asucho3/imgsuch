const User = require("./../model/userModel");
const Story = require("./../model/storyModel");
const Comment = require("./../model/commentModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Email = require("./../utils/email");

exports.addComment = catchAsync(async (req, res, next) => {
  // assemble the comment
  let comment = {};
  comment.author = req.user.id;
  comment.story = req.params.id;
  comment.comment = req.body.comment;
  comment.rating = 0;

  // create the comment document
  await Comment.create(comment);

  // there's no need to add it to the user/story because those models use virtual populates for the comments
  res.status(200).json({
    status: "success",
    data: comment,
  });
});

exports.getComments = catchAsync(async (req, res, next) => {
  // get all the comments for this story id
  const story = await Story.findById(req.params.id).populate("comments");
  res.status(200).json({
    status: "success",
    data: story,
  });
});

exports.updateStory = catchAsync(async function (req, res, next) {
  // assemble the story components via destructuring
  const { title, images, text } = req.body;

  // check that the necessary fields are not empty
  if (!title || (!images && !text))
    return next(
      new AppError(
        "A story must have at least a title and an image or some text"
      )
    );

  // check if the user is the author of this story
  const story = await Story.findById(req.params.id);
  if (!(req.user.id === String(story.author)))
    return next(new AppError("you are not the author of this story!"));

  // perform the update
  const updatedStory = await Story.findByIdAndUpdate(
    req.params.id,
    { title, images, text },
    {
      new: true,
    }
  );
  res.status(200).json({
    status: "success",
    data: updatedStory,
  });
});

exports.removeStory = catchAsync(async function (req, res, next) {
  // check if the user is the author of this story
  const story = await Story.findById(req.params.id);
  if (!(req.user.id === String(story.author)))
    return next(new AppError("you are not the author of this story!"));

  // delete the story document
  await Story.findByIdAndDelete(req.params.id);

  // filter out the stories that do not match this id
  const updatedStories = req.user.stories.filter((el) => {
    return String(el) !== String(story._id);
  });

  // remove the document id from the user 'stories' field
  await User.findByIdAndUpdate(req.user.id, { stories: [...updatedStories] });

  res.status(204).json({
    status: "success",
  });
});

exports.getStory = catchAsync(async function (req, res, next) {
  const story = await Story.findById(req.params.id).populate("comments");

  // only show the story if it is public, OR the author is the requesting user, OR the author is a friend of the user
  if (
    story.private &&
    String(story.author) !== String(req.user.id) &&
    !req.user.friends.includes(story.author)
  )
    return next(
      new AppError("this story is only shared with friends of this user")
    );
  res.status(200).json({
    status: "success",
    data: story,
  });
});

exports.getAllStories = catchAsync(async function (req, res, next) {
  const story = await Story.find().populate("comments");
  res.status(200).json({
    status: "success",
    data: story,
  });
});
