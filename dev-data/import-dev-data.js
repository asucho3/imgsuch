/* eslint-disable import/no-useless-path-segments */
/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const Story = require("./../model/storyModel");
const Comment = require("./../model/commentModel");
const User = require("./../model/userModel");
const { faker } = require("@faker-js/faker");

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

const NUM_USERS = 10;
const NUM_STORIES = 10;

// const stories = JSON.parse(
//   fs.readFileSync(`${__dirname}/stories.json`, "utf-8")
// );
// const comments = JSON.parse(
//   fs.readFileSync(`${__dirname}/comments.json`, "utf-8")
// );

const users = Array.from({ length: NUM_USERS }, (el) => {
  el = {};
  el.name = faker.internet.userName().toLowerCase();
  el.email = `${el.name}@example.com`;
  el.role = "user";
  el.password = "test1234";
  return el;
});

// const stories = Array.from({ length: NUM_STORIES }, (el) => {
//   el = {};
//   el.title = faker.word.words(2);
//   el.text = faker.word.words({ count: { min: 5, max: 10 } });
//   el.private = Math.random() * 10 < 2 ? true : false;
//   return el;
// });

// import/delete test data to/from database
if (process.argv[2] === "--import") {
  (async function () {
    try {
      const usersIDs = await User.create(users, { validateBeforeSave: false });
      for (let index of usersIDs) {
        const STORY_COUNT = Math.ceil(Math.random() * 10);
        for (let i = 0; i < STORY_COUNT; i++) {
          const story = {};
          story.author = index._id;
          story.title = faker.word.words(2);
          story.text = faker.word.words({ count: { min: 5, max: 10 } });
          story.private = Math.random() * 10 < 2 ? true : false;
          await Story.create(story);
        }
      }
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
      //   await Comment.deleteMany();
      console.log("done deleting data");
    } catch (err) {
      console.log(err);
    }
    process.exit();
  })();
}
