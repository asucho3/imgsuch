const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "please provide a valid email"],
    },
    photo: {
      type: String,
      default: "default.jpg",
    },
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
    password: {
      type: String,
      required: [true, "password is required"],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "please confirm your password"],
      validate: {
        //this only works on CREATE and SAVE methods
        validator: function (val) {
          return val === this.password;
        },
        message: "please confirm your password correctly",
      },
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    ignoreList: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "user",
      },
    ],
    friendsRequestsReceived: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "user",
      },
    ],
    friendsRequestsSent: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "user",
      },
    ],
    friends: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "user",
      },
    ],
    stories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "story",
      },
    ],
    rating: {
      type: Number,
      default: 0,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("comments", {
  ref: "comment",
  foreignField: "author",
  localField: "_id",
});

//encrypt the password
userSchema.pre("save", async function (next) {
  //only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  //hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

//update the changedPasswordAfter
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//check if given password is the same as the stored in the database
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  //in instance methods, the 'this' method points at the current document
  //but because we have the password set to 'select: false', this.password won't be available!
  return await bcrypt.compare(candidatePassword, userPassword);
};

//check if the user has changed his password after the token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

//create a reset token for the user
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("user", userSchema);
module.exports = User;
