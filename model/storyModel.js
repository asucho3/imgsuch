const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
      required: [true, "a story must have an author"],
    },
    title: {
      type: String,
      required: [true, "a title is required"],
    },
    images: [
      {
        type: String,
        required: [true, "at least one image is required for a story"],
        default: "defaultImage.jpg",
      },
    ],
    text: {
      type: String,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

storySchema.virtual("comments", {
  ref: "comment",
  foreignField: "story",
  localField: "_id",
});

const Story = mongoose.model("story", storySchema);
module.exports = Story;
