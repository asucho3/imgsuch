const express = require("express");
const commentController = require("./../controllers/commentController");
const authController = require("./../controllers/authController");

const router = express.Router();

//use protect middleware to protect all the following routes
router.use(authController.protect);

router.patch("/:id/updateComment", commentController.updateComment);
router.delete("/:id/removeComment", commentController.removeComment);

module.exports = router;
