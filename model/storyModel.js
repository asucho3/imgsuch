const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    private: {
      type: Boolean,
      default: false,
    },
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
        default: "defaultImage.jpg",
      },
    ],
    rating: {
      type: Number,
      default: 0,
    },
    text: {
      type: String,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    createdOn: {
      type: Date,
      default: () => {
        return new Date();
      },
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
