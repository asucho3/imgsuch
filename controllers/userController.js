const User = require("./../model/userModel");
const Story = require("./../model/storyModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Email = require("./../utils/email");

exports.addFriend = catchAsync(async function (req, res, next) {
  const friend = await User.findById(req.params.id);
  if (!friend) return next(new AppError("no friend with that ID"));
  if (!req.user.friends.includes(friend.id)) {
    req.user.friends = [...req.user.friends, friend.id];
    await User.findByIdAndUpdate(
      req.user.id,
      { friends: req.user.friends },
      { new: true }
    );
    res.status(200).json({
      status: "success",
      data: req.user,
    });
  } else return next(new AppError("that friend already exists for this user", 400));
});

exports.getFriends = catchAsync(async function (req, res, next) {
  const user = await User.findById(req.user.id)
    .populate("friends")
    .select("friends");

  res.status(200).json({
    status: "success",
    data: user,
  });
});

exports.removeFriend = catchAsync(async function (req, res, next) {
  const friend = await User.findById(req.params.id);
  if (!friend) return next(new AppError("no friend with that ID"));

  if (req.user.friends.includes(friend.id)) {
    updatedFriends = req.user.friends.filter((el) => {
      // 'el' is of typeof object
      return String(el) !== friend.id;
    });
    req.user = await User.findByIdAndUpdate(
      req.user.id,
      { friends: updatedFriends },
      { new: true }
    );
    res.status(200).json({
      status: "success",
      data: req.user,
    });
  } else return next(new AppError("that friend does not exist for this user", 400));
});

exports.getAllUsers = catchAsync(async function (req, res, next) {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    data: users,
  });
});

exports.createStory = catchAsync(async function (req, res, next) {
  req.body.author = req.user.id;
  const story = await Story.create(req.body);
  res.status(200).json({
    status: "success",
    data: story,
  });
});

exports.getMyStories = catchAsync(async function (req, res, next) {
  const story = await Story.find({ author: req.user.id });
  res.status(200).json({
    status: "success",
    data: story,
  });
});
