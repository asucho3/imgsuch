const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("./../model/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Email = require("./../utils/email");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  //defining the cookie
  //cookie is a piece of text that is sent to the browser and it can only be used to be sent back along with each new request that the browser makes
  //cookies with the same name override each other

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 //milliseconds
    ),
    //secure: true, //only send cookie through https
    httpOnly: true, //cookie cannot be accesed by the browser
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });

  //remove the password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    role: req.body.role,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  const url = `${req.protocol}://${req.get("host")}`;
  await new Email(newUser, url).sendWelcome();

  //log in the user immediately after signing up
  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if email and password actually exist
  if (!email || !password)
    return next(new AppError("provide email and password!", 400));

  // 2) check if user exists & password is correct
  const user = await User.findOne({ email }).select("+password");

  //use the instance method 'correctPassword' to compare the plaintext password and the hash saved in the DB
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("incorrect email or password", 401));
  }

  // 3) if everything is ok, send token back to client ("log in the client")
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res, next) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) get the token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) return next(new AppError("you are not logged in"), 401);

  // 2) verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) if the verification is succesful, check if user still exists
  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError("the user belonging to this token no longer exists", 401)
    );
  }

  // 4) check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "user has changed the password after the token has been issued",
        401
      )
    );
  }

  // grant access to protected route
  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array
    //the middleware function forms a closure
    if (!roles.includes(req.user.role))
      return next(new AppError("you do not have permission to do this", 403));
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError("there is no user with that email", 404));

  // 2) generate a random token
  const resetToken = user.createPasswordResetToken();

  //now that we have modified the user object (because we changed the passwordResetToken), we have to save() the document, but because we are not specifying all the mandatory fields we have to pass a special options object
  await user.save({ validateBeforeSave: false });

  // 3) send it as an email
  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "token sent to email",
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("there was an error sending the email. try again later", 500)
    );
  }

  res.status(200).json({
    status: "success",
    message: "token sent to email",
  });

  next();
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // 2) if token has not expired, and there is a user, set the new password
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  console.log(user);
  if (!user) return next(new AppError("invalid token", 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) update changedPasswordAt property for the user
  //this is done through 'pre' document middleware

  // 4) log the user in, send JWT to the client
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async function (req, res, next) {
  // 1) get the user from the collection
  const user = await User.findById(req.user.id).select("+password");

  // 2) check if the POSTed password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError("wrong password", 401));

  // 3) update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();
  console.log("proceeding");
  // 4) log the user in, send the JWT
  createSendToken(user, 200, req, res);
});
