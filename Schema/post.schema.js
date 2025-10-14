import mongoose, { Schema } from "mongoose";

const postType = new mongoose.Schema({
  like: [{ type: Schema.Types.ObjectId, required: true }],
  images: [{ type: String, required: true }],
  comment: [{ type: Schema.Types.ObjectId, required: true }],
  user: { type: Schema.Types.ObjectId, ref: "users", required: true },
  caption: { type: String, required: true },
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
  profilePic: [{ type: String, required: true }],
});

export const postModel = mongoose.model("posts", postType);
