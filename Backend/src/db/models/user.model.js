import mongoose from "mongoose";
import { GenderEnum, ProviderEnum, roleEnum } from "../../common/enums/index.js";

const userSchema = new mongoose.Schema(
  {
    FirstName: {
      type: String,
      required: true,
      minlength: [
        2,
        "FirstName must be more than 2 char you have entered {VALUE}",
      ],
      maxlength: 25,
      trim: true,
    },
    LastName: {
      type: String,
      required: true,
      maxlength: 25,
      trim: true,
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    Gender: {
      type: Number,
      enum: Object.values(GenderEnum),
      default: GenderEnum.Male,
    },
    Provider: {
      type: Number,
      enum: Object.values(ProviderEnum),
      default: ProviderEnum.System,
    },
    role:{
      type: Number,
      enum: Object.values(roleEnum),
      default: roleEnum.User,
    }
    ,

    ConfirmEmail: Date,
    ChangeCredentialsTime: Date,

    ProfilePicture: String,
    CoverPicture: [String],
  },
  {
    collection: "App_Users",
    timestamps: true,
    strict: true,
    strictQuery: true,
    optimisticConcurrency: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    autoIndex: true,
  },
);

userSchema
  .virtual("fullName")
  .set(function (value) {
    const [ FirstName, LastName ] = value.split(" ");
    this.FirstName = FirstName
    this.LastName = LastName
  })
  .get(function () {
    return this.FirstName + " " + this.LastName;
  });

export const UserModel =
  mongoose.model.User || mongoose.model("User", userSchema);
