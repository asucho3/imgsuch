const express = require("express");
const storyController = require("./../controllers/storyController");
const authController = require("./../controllers/authController");
const Story = require("../model/storyModel");
const router = express.Router();

// user must be logged in
router.use(authController.protect);

// first check if the doc exists
// check if story is private and apply restriction
router.use("/:id/", authController.checkIfExists(Story));
router.use("/:id/", authController.checkIfFriends);

router.get("/:id/getStory", storyController.getStory);
router.patch("/:id/toggleRateStory", storyController.toggleRateStory);
router.post("/:id/addComment", storyController.addComment);
router.get("/:id/getComments", storyController.getComments);

// user must be the author
router.use("/:id/", authController.checkIfAuthor(Story));
router.patch("/:id/updateStory", storyController.updateStory);
router.delete("/:id/disableStory", storyController.disableStory);

// must be admin
router.use(authController.restrictTo("admin"));
router.get("/", storyController.getAllStories);
router.delete("/:id/removeStory", storyController.removeStory);

module.exports = router;
