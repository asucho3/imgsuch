const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });
const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`app running on port ${port}`);
});

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("DB connection succesful");
  });

console.log("Current environment: ", process.env.NODE_ENV);

// Unhandled exceptions, rejections and SIGTERM
process.on("uncaughtException", (err) => {
  console.log("uncaught exception");
  console.log(err.name, err.message);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION: shutting down");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...🥽");
  server.close(() => {
    console.log("🎨 Process terminated");
  });
});
