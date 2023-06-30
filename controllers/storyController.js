const User = require("./../model/userModel");
const Story = require("./../model/storyModel");
const Comment = require("./../model/commentModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Email = require("./../utils/email");

exports.addComment = catchAsync(async (req, res, next) => {
  // check that the comment is not empty
  if (!req.body.comment) return next(new AppError("comment cannot be empty"));

  // assemble the comment
  let comment = {};
  comment.author = req.user.id;
  comment.story = req.params.id;
  comment.comment = req.body.comment;
  comment.private = req.model.private;
  comment.rating = 0;

  // create the comment document
  const newComment = await Comment.create(comment);

  // there's no need to add it to the user/story because those models use virtual populates for the comments
  res.status(200).json({
    status: "success",
    data: newComment,
  });
});

exports.getComments = catchAsync(async (req, res, next) => {
  // deep clone the req.model.comments array
  const filteredFields = JSON.parse(JSON.stringify(req.model.comments));

  // if this user is not an admin, map filteredFields, iterate throught the keys of the authors and delete the keys if they are not allowed
  if (req.user.role !== "admin") {
    const allowedFields = ["photo", "name", "createdOn", "id"];
    filteredFields.map((comment) => {
      for (const key of Object.keys(comment.author)) {
        if (!allowedFields.includes(key)) {
          delete comment.author[key];
        }
      }
    });
  }

  // now, filter out the disabled comments
  filteredDisabled = filteredFields.filter(
    (comment) => comment.disabled === false
  );

  // make a final copy in case we add more filters some time in the future
  const filteredComments = [...filteredDisabled];

  // for (const [i, comment] of filteredComments.entries()) {
  //   if (comment.disabled) {
  //     filteredComments.splice();
  //   }
  // }

  // console.log(filteredComments);

  res.status(200).json({
    status: "success",
    data: filteredComments,
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

  // perform the update
  const updatedStory = await Story.findByIdAndUpdate(
    req.params.id,
    { title, text },
    {
      new: true,
    }
  );
  res.status(200).json({
    status: "success",
    data: updatedStory,
  });
});

exports.getStory = catchAsync(async function (req, res, next) {
  res.status(200).json({
    status: "success",
    data: req.model,
  });
});

exports.toggleRateStory = catchAsync(async function (req, res, next) {
  // adjust the rate variable for upvote/remove upvote
  let rate;
  if (req.user.ratedStories.includes(String(req.model._id))) {
    rate = -1;
    req.user.ratedStories = req.user.ratedStories.filter(
      (storyID) => String(storyID) !== String(req.params.id)
    );
  } else {
    rate = 1;
    req.user.ratedStories = [...req.user.ratedStories, req.params.id];
  }

  req.model.rating = Number(req.model.rating);
  req.model.rating += rate;

  // execute the query
  const updatedStory = await Story.findByIdAndUpdate(
    req.params.id,
    {
      rating: req.model.rating,
    },
    { new: true }
  );
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      ratedStories: req.user.ratedStories,
    },
    { new: true }
  );

  const data = { updatedStory, updatedUser };
  res.status(200).json({
    status: "success",
    data,
  });
});

exports.getAllStories = catchAsync(async function (req, res, next) {
  const story = await Story.find().populate("comments");
  res.status(200).json({
    status: "success",
    data: story,
  });
});

exports.disableStory = catchAsync(async function (req, res, next) {
  // delete the story document
  const updatedStory = await Story.findByIdAndUpdate(
    req.params.id,
    {
      disabled: true,
    },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    data: updatedStory,
  });
});

exports.removeStory = catchAsync(async function (req, res, next) {
  // delete the story document
  await Story.findByIdAndDelete(req.params.id);

  // filter out the stories that do not match this id
  const updatedStories = req.user.stories.filter((el) => {
    return String(el) !== String(req.params.id);
  });

  // remove the document id from the user 'stories' field
  await User.findByIdAndUpdate(req.user.id, { stories: [...updatedStories] });

  res.status(204).json({
    status: "success",
  });
});
