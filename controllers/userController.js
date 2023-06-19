const User = require("./../model/userModel");
const Story = require("./../model/storyModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Email = require("./../utils/email");
const mongoose = require("mongoose");
const multer = require("multer");
const sharp = require("sharp");

// Set up Multer for file storage
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    return cb(null, true);
  } else {
    return cb(new AppError("you can only upload images", 400), false);
  }
};

// Set limit for number of files and size per file
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 100000, files: 5 },
});

// Handle story images
exports.uploadStoryImage = upload.any("images");
exports.resizeStoryImage = catchAsync(async (req, res, next) => {
  //if the user did not upload a photo, immediately go to next middleware
  if (!req.files) return next();

  // generate the filenames and add them to req.body.images
  req.body.images = [];
  req.files.forEach((file, i) => {
    file.filename = `user-${req.user.id}-${Date.now()}-${i}.jpeg`;
    req.body.images = [...req.body.images, file.filename];
  });

  //use the sharp library for image processing (ex. resizing)
  //get the image from the buffer
  for (const file of req.files) {
    await sharp(file.buffer)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/stories/${file.filename}`);
  }

  next();
});

// Handle profile photos
exports.uploadPhotoImage = upload.single("photo");
exports.resizePhotoImage = catchAsync(async (req, res, next) => {
  //if the user did not upload a photo, immediately go to next middleware
  if (!req.file) return next();

  // generate the filenames and add them to req.body.images
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  //use the sharp library for image processing (ex. resizing)
  //get the image from the buffer
  await sharp(req.file.buffer)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  const photo = String(req.file.filename);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      photo,
    },
    { new: true }
  );
  res.status(200).json({
    status: "success",
    data: updatedUser,
  });
});

exports.sendFriendRequest = catchAsync(async function (req, res, next) {
  // check if the target is the user
  if (String(req.user.id) === String(req.params.id))
    return next(new AppError("you can't send a friend request to yourself!"));

  // check if the target is already in the friend array
  if (req.user.friends.includes(req.params.id))
    return next(new AppError("you are already friends with this user!"));

  // check if the target exists
  const target = await User.findById(req.params.id);
  if (!target) return next(new AppError("no user with that ID"));

  // if this user has not already sent a friend request to this target, add the user to the target's 'friendRequestsReceived' array, and the target to the user 'friendRequestsSent'
  if (!req.user.friendsRequestsSent.includes(target.id)) {
    req.user.friendsRequestsSent = [...req.user.friendsRequestsSent, target.id];
    target.friendsRequestsReceived = [
      ...target.friendsRequestsReceived,
      req.user.id,
    ];

    req.user = await User.findByIdAndUpdate(
      req.user.id,
      { friendsRequestsSent: req.user.friendsRequestsSent },
      { new: true }
    );

    const targetUser = await User.findByIdAndUpdate(
      target.id,
      { friendsRequestsReceived: target.friendsRequestsReceived },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      data: { user: req.user, targetUser },
    });
  } else return next(new AppError("already sent a friend request for this user", 400));
});

exports.cancelFriendRequest = catchAsync(async function (req, res, next) {
  // check if the friend exists
  const target = await User.findById(req.params.id);
  if (!target) return next(new AppError("no user with that ID"));

  // if this user has sent a friend request to this target, remove the user from the target's 'friendRequestsReceived' array, and the target from the user 'friendRequestsSent'
  if (req.user.friendsRequestsSent.includes(target.id)) {
    req.user.friendsRequestsSent = req.user.friendsRequestsSent.filter(
      (el) => String(el._id) !== String(target.id)
    );
    target.friendsRequestsReceived = target.friendsRequestsReceived.filter(
      (el) => String(el._id) !== String(req.user.id)
    );

    req.user = await User.findByIdAndUpdate(
      req.user.id,
      { friendsRequestsSent: req.user.friendsRequestsSent },
      { new: true }
    );

    const targetUser = await User.findByIdAndUpdate(
      target.id,
      { friendsRequestsReceived: target.friendsRequestsReceived },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      data: { user: req.user, targetUser },
    });
  } else return next(new AppError("you haven't sent a friend request for this user", 400));
});

exports.acceptFriendRequest = catchAsync(async function (req, res, next) {
  // check if the friend exists
  const target = await User.findById(req.params.id);
  if (!target) return next(new AppError("no user with that ID"));

  // if this user has received a friend request from this target,
  if (req.user.friendsRequestsReceived.includes(target.id)) {
    // mutually add each other to their friends array
    req.user.friends = [...req.user.friends, target.id];
    target.friends = [...target.friends, req.user.id];

    // and remove each other from the friendsRequests
    req.user.friendsRequestsReceived = req.user.friendsRequestsReceived.filter(
      (el) => String(el._id) !== String(target.id)
    );
    req.user.friendsRequestsSent = req.user.friendsRequestsSent.filter(
      (el) => String(el._id) !== String(target.id)
    );
    target.friendsRequestsReceived = target.friendsRequestsReceived.filter(
      (el) => String(el._id) !== String(req.user.id)
    );
    target.friendsRequestsSent = target.friendsRequestsSent.filter(
      (el) => String(el._id) !== String(req.user.id)
    );

    req.user = await User.findByIdAndUpdate(
      req.user.id,
      {
        friendsRequestsReceived: req.user.friendsRequestsReceived,
        friendsRequestsSent: req.user.friendsRequestsSent,
        friends: req.user.friends,
      },
      { new: true }
    );

    const targetUser = await User.findByIdAndUpdate(
      target.id,
      {
        friendsRequestsReceived: target.friendsRequestsReceived,
        friendsRequestsSent: target.friendsRequestsSent,
        friends: target.friends,
      },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      data: { user: req.user, targetUser },
    });
  } else return next(new AppError("you haven't received a friend request from this user", 400));
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
  // check that the friend exists
  const target = await User.findById(req.params.id);
  if (!target) return next(new AppError("no friend with that ID"));

  // if this friend exists on the user document, mutually delete them
  if (req.user.friends.includes(target.id)) {
    req.user.friends = req.user.friends.filter(
      (el) => String(el._id) !== String(target.id)
    );
    target.friends = target.friends.filter(
      (el) => String(el._id) !== String(req.user.id)
    );

    req.user = await User.findByIdAndUpdate(
      req.user.id,
      { friends: req.user.friends },
      { new: true }
    );
    const targetUser = await User.findByIdAndUpdate(
      target.id,
      { friends: target.friends },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      data: { user: req.user, targetUser },
    });
  } else return next(new AppError("that friend does not exist for this user", 400));
});

exports.getAllUsers = catchAsync(async function (req, res, next) {
  const users = await User.find().populate("comments");
  res.status(200).json({
    status: "success",
    data: users,
  });
});

exports.createStory = catchAsync(async function (req, res, next) {
  // add an author field in the body
  req.body.author = req.user.id;

  // destructure the req.body
  const { author, title, images, text, private } = req.body;
  if (!title || (images.length === 0 && !text))
    return next(
      new AppError(
        "A story must have at least a title and an image or some text"
      )
    );

  // create the story and add the id to the user document
  const story = await Story.create({ author, title, images, text, private });
  await User.findByIdAndUpdate(
    req.user.id,
    {
      stories: [...req.user.stories, story._id],
    },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    data: story,
  });
});

exports.getMyStories = catchAsync(async function (req, res, next) {
  const stories = await User.findById(req.user.id).select("stories");
  res.status(200).json({
    status: "success",
    data: stories,
  });
});

exports.getUserStories = catchAsync(async function (req, res, next) {
  // get all the stories for this user
  const stories = await Story.find({ author: req.params.id });

  let displayStories = stories;
  // determine if the user is or not a friend of the requesting user
  if (
    String(req.params.id) !== String(req.user.id) &&
    !req.user.friends.includes(req.params.id)
  ) {
    // if this is not a friend, only return the public stories
    displayStories = stories.filter((el) => el.private === false);
  }

  res.status(200).json({
    status: "success",
    data: displayStories,
  });
});

exports.getFriendsStories = catchAsync(async function (req, res, next) {
  // get all the friends for the requesting user
  const user = await User.findById(req.user.id)
    .populate("friends")
    .select("friends");
  const friendsStoriesIds = user.friends.flatMap((friend) => friend.stories);

  // get all the stories of all the friends for this user
  const stories = await Story.find({
    _id: { $in: friendsStoriesIds },
  }).populate("author");

  res.status(200).json({
    status: "success",
    data: stories,
  });
});

exports.checkConsistency = catchAsync(async function (req, res, next) {
  // get all stories
  const stories = await Story.find();

  // get all users
  const users = await User.find();

  // check if the story id is included in the corresponding user
  for (const story of stories) {
    const foundIndex = users.findIndex(
      (user) => String(user._id) === String(story.author)
    );
    users[foundIndex].stories = [...users[foundIndex].stories, story];
    const updatedStories = users[foundIndex].stories;
    await User.findByIdAndUpdate(users[foundIndex], {
      stories: updatedStories,
    });
  }

  res.status(200).json({
    status: "success",
  });
});
