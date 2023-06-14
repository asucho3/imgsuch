const AppError = require("./../utils/appError");

const sendErrorDev = (err, req, res) => {
  //API errors
  //req.originalUrl: the URL without the hostn
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    //RENDERED WEBSITE errors
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong",
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith("/api")) {
    //operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      //programming or unknown error: don't leak to client
    } else {
      //1) log error
      console.log("ERROR!!! ", err);
      //2) send generic message to client
      return res.status(500).json({
        status: "error",
        message: "something went wrong",
      });
    }
  } else {
    // RENDERED WEBSITE
    if (err.isOperational) {
      return res.status(err.statusCode).render("error", {
        title: "Something went wrong",
        msg: err.message,
      });
      //programming or unknown error: don't leak to client
    } else {
      //1) log error
      console.log("ERROR!!! ", err);
      //2) send generic message to client
      return res.status(500).render("error", {
        title: "Something went wrong",
        msg: "Please try again later",
      });
    }
  }
};

const handleCastErrorDB = function (error) {
  const message = `invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = function (error) {
  const value = error.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `duplicate field value: ${value}. please use another value`;
  return new AppError(message, 400);
};

const handleValidatorErrorDB = function (error) {
  // let myErrors = '';
  // Object.entries(error.errors).forEach((el) => (myErrors += `${el[1]}. `));
  const errors = Object.values(error.errors).map((el) => el.message);
  const message = `validation failed. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) => {
  return new AppError("invalid token", 401);
};

const handleJWTExpiredError = (err) => {
  return new AppError("token expired, log in again", 401);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  // eslint-disable-next-line no-use-before-define

  let error = Object.create(err);

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    if (error.name === "CastError") {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === "ValidationError") {
      error = handleValidatorErrorDB(error);
    }
    if (error.name === "JsonWebTokenError") {
      error = handleJWTError(error);
    }
    if (error.name === "TokenExpiredError") {
      error = handleJWTExpiredError(error);
    }
    sendErrorProd(error, req, res);
  }
};
