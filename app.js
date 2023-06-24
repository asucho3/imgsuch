const path = require("path");
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const cors = require("cors");

const userRouter = require("./routes/userRoutes");
const storyRouter = require("./routes/storyRoutes");
const commentRouter = require("./routes/commentRoutes");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

//enable CORS
// Because the back end and the front end are in different ports/locations, we must specify the origin and the credentials
app.use(cors({ origin: "http://127.0.0.1:5173", credentials: true }));
// app.use(cors());
app.options("*", cors());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Serve static files in the public directory
app.use(express.static(path.join(__dirname, "public")));

// Limit requests from same API
// const limiter = rateLimit({
//   max: 100,
//   windowMs: 60 * 60 * 1000,
//   message: "Too many requests from this IP, please try again in an hour!",
// });
// app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// log the cookie
app.use((req, res, next) => {
  console.log(req.body);
  console.log(req.cookies);
  next();
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/stories", storyRouter);
app.use("/api/v1/comments", commentRouter);

//add a compression middleware that will compress all text responses
app.use(compression());

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
