const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

const router = express.Router();

router.get("/checkConsistency", userController.checkConsistency);

router.get("/isLoggedIn", authController.isLoggedIn);
router.post("/signup", authController.signup);
router.post("/logout", authController.logout);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

//use protect middleware to protect all the following routes
router.use(authController.protect);

router.patch("/updatePassword", authController.updatePassword);
router.delete("/:id/disableUser", authController.disableUser);

// profile
router.patch(
  "/:id/updateProfile/",
  userController.uploadPhotoImage,
  userController.resizePhotoImage,
  userController.updateProfile
);

// friends
router.post("/:id/sendFriendRequest/", userController.sendFriendRequest);
router.post("/:id/cancelFriendRequest/", userController.cancelFriendRequest);
router.post("/:id/acceptFriendRequest/", userController.acceptFriendRequest);
router.get("/getFriends", userController.getFriends);
router.delete("/:id/removeFriend/", userController.removeFriend);

// stories
router.post(
  "/createStory",
  userController.uploadStoryImage,
  userController.resizeStoryImage,
  userController.createStory
);
router.get("/getMyStories", userController.getMyStories);
router.get("/:id/getUserStories/", userController.getUserStories);
router.get("/getFriendsStories", userController.getFriendsStories);

router.get("/", userController.getAllUsers);
router.use(authController.restrictTo("admin"));
router.get("/", userController.getAllUsersAdmin);

module.exports = router;
