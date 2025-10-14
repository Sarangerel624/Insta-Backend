import mongoose, { Schema } from "mongoose";

const userType = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  bio: { type: String, required: false, default: null },
  profilePicture: [{ type: String, required: true }],
  followers: [{ type: Schema.Types.ObjectId, required: true }],
  following: [{ type: Schema.Types.ObjectId, required: true }],
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
});

export const userModel = mongoose.model("users", userType);
