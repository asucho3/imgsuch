/* eslint-disable import/no-useless-path-segments */
/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const Story = require("./../model/storyModel");
const Comment = require("./../model/commentModel");
const User = require("./../model/userModel");
const { faker } = require("@faker-js/faker");
const random = require("lodash.random");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("DB connection succesful");
  });

const NUM_STORIES = 10;
const NUM_AVAILABLE_STORY_IMAGES = 10;

const NUM_AVAILABLE_USER_PHOTOS = 26;
const NUM_USERS = NUM_AVAILABLE_USER_PHOTOS;

// const stories = JSON.parse(
//   fs.readFileSync(`${__dirname}/stories.json`, "utf-8")
// );
// const comments = JSON.parse(
//   fs.readFileSync(`${__dirname}/comments.json`, "utf-8")
// );

// prepare the array of fake user photos to avoid duplication
let i = 0;
const availableUserPhotos = Array.from(
  { length: NUM_AVAILABLE_USER_PHOTOS },
  (el) => (el = `user-${i++}.jpg`)
);

const users = Array.from({ length: NUM_USERS }, (el) => {
  el = {};
  el.name = faker.internet.userName().toLowerCase();
  el.email = `${el.name}@example.com`;
  el.role = "user";
  el.password = "test1234";
  el.photo = availableUserPhotos.pop();
  return el;
});

// // const stories = Array.from({ length: NUM_STORIES }, (el) => {
// //   el = {};
// //   el.title = faker.word.words(2);
// //   el.text = faker.word.words({ count: { min: 5, max: 10 } });
// //   el.private = Math.random() * 10 < 2 ? true : false;
// //   return el;
// // });

// import/delete test data to/from database
if (process.argv[2] === "--import") {
  (async function () {
    try {
      // create all the fake users
      const usersIDs = await User.create(users, { validateBeforeSave: false });
      let stories = [];
      // loop through the fake users and add up to STORY_COUNT stories with their IDs
      for (let index of usersIDs) {
        const STORY_COUNT = Math.ceil(Math.random() * 10);
        for (let i = 0; i < STORY_COUNT; i++) {
          const story = {};
          story.images = Array.from({ length: 3 });
          story.author = index._id;
          story.title = faker.word.words(2);
          story.text = faker.word.words({ count: { min: 5, max: 10 } });
          story.images[0] = `story-${random(
            0,
            NUM_AVAILABLE_STORY_IMAGES
          )}.jpg`;
          story.images[1] = `story-${random(
            0,
            NUM_AVAILABLE_STORY_IMAGES
          )}.jpg`;
          story.images[2] = `story-${random(
            0,
            NUM_AVAILABLE_STORY_IMAGES
          )}.jpg`;
          story.private = Math.random() * 20 < 2 ? true : false;
          stories = [...stories, story];
        }
      }
      const storiesIDs = await Story.create(stories);

      // loop through the fake stories and add up to COMMENT_COUNT with a random UserID each time
      let comments = [];
      const COMMENT_COUNT = 5;
      for (let storyIndex of storiesIDs) {
        for (let i = 0; i < COMMENT_COUNT; i++) {
          const randomIndex = random(0, usersIDs.length - 1, false);
          const comment = {};
          comment.story = storyIndex.id;
          comment.author = usersIDs[randomIndex].id;
          comment.comment = faker.hacker.phrase();
          comments = [...comments, comment];
        }
      }
      const commentsIDs = await Comment.create(comments);

      //   await Story.create(stories);
      //   await Comment.create(comments);
      console.log("done importing data");
    } catch (err) {
      console.log(err);
    }
    process.exit();
  })();
}
if (process.argv[2] === "--delete") {
  (async function () {
    try {
      await User.deleteMany();
      await Story.deleteMany();
      await Comment.deleteMany();
      console.log("done deleting data");
    } catch (err) {
      console.log(err);
    }
    process.exit();
  })();
}
