const express = require("express");
const commentController = require("./../controllers/commentController");
const authController = require("./../controllers/authController");
const Comment = require("../model/commentModel");

const router = express.Router();

// user must be logged in
router.use(authController.protect);

// first check if the doc exists
// check if story is private and apply restriction
router.use("/:id/", authController.checkIfExists(Comment));
router.use("/:id/", authController.checkIfFriends);

router.patch("/:id/toggleRateComment", commentController.toggleRateComment);

// user must be author
router.use("/:id/", authController.checkIfAuthor(Comment));
router.patch("/:id/updateComment", commentController.updateComment);
router.delete("/:id/disableComment", commentController.disableComment);

// must be admin
router.use(authController.restrictTo("admin"));
router.delete("/:id/removeComment", commentController.removeComment);

module.exports = router;
