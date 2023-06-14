const express = require("express");
const storyController = require("./../controllers/storyController");
const authController = require("./../controllers/authController");

const router = express.Router();

//use protect middleware to protect all the following routes
router.use(authController.protect);

router.patch("/:id/updateStory", storyController.updateStory);
router.delete("/:id/removeStory", storyController.removeStory);

router.post("/:id/addComment", storyController.addComment);
router.get("/:id/getComments", storyController.getComments);

router.use(authController.restrictTo("admin"));
router.get("/", storyController.getAllStories);

module.exports = router;
