import mongoose, { Schema } from "mongoose";

const commentType = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: "users", required: true },
  comment: [{ type: Schema.Types.ObjectId, required: true }],
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
});

export const commentModel = mongoose.model("comment", commentType);
