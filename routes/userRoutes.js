const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

//use protect middleware to protect all the following routes
router.use(authController.protect);

router.patch("/updatePassword", authController.updatePassword);

// friends
router.post("/:id/addFriend/", userController.addFriend);
router.get("/getFriends", userController.getFriends);
router.delete("/:id/removeFriend/", userController.removeFriend);

// stories
router.post("/createStory", userController.createStory);
router.get("/getMyStories", userController.getMyStories);

router.use(authController.restrictTo("admin"));
router.get("/", userController.getAllUsers);

module.exports = router;
