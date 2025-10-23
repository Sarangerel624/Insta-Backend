import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { userModel } from "./Schema/user.schema.js";
import { postModel } from "./Schema/post.schema.js";
import { hash, compare } from "bcrypt";
import { authMiddleware } from "./middleware/auth-middleware.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { commentModel } from "./Schema/comment.schema.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const Port = 5000;

const connectToDb = async () => {
  await mongoose.connect(process.env.MONGO_DB_URL);
};
connectToDb();

app.post("/user", async (req, res) => {
  const body = req.body;
  const JWT_SECRET = process.env.JWT_SECRET;
  const username = body.username;
  const password = body.password;
  const email = body.email;
  const saltRound = 10;
  const hashedPassword = await hash(password, saltRound);
  const isExisting = await userModel.findOne({ email });

  if (isExisting) {
    res.status(400).json({ message: "user already exist!" });
  } else {
    const createdUser = await userModel.create({
      username: username,
      password: hashedPassword,
      email: email,
    });
    const accessToken = jwt.sign(
      {
        data: createdUser,
      },
      JWT_SECRET,
      { expiresIn: "5h" }
    );

    res.json(accessToken);
  }
});

app.post("/post", authMiddleware, async (req, res) => {
  const body = req.body;
  const user = req.user;
  const { caption, images } = body;
  const createdUser = await postModel.create({
    user: user._id,
    caption,
    images,
  });
  res.status(200).json(createdUser);
});
app.get("/profilePost", authMiddleware, async (req, res) => {
  const user = req.user;

  const posts = await postModel.find({
    user: user._id,
  });

  res.status(200).json(posts);
});

app.post("/login", async (req, res) => {
  const body = req.body;
  const JWT_SECRET = process.env.JWT_SECRET;
  const { email, password } = body;
  const user = await userModel.findOne({ email });

  if (user) {
    const hashedPassword = user.password;
    const isValid = await compare(password, hashedPassword);
    if (isValid) {
      // res.json(user);
      const accessToken = jwt.sign(
        {
          data: user,
        },
        JWT_SECRET,
        { expiresIn: "5h" }
      );

      res.json(accessToken);
    } else {
      res.status(404).json({ message: "you're password wrong" });
    }
  } else {
    res.status(404).json({ message: "you should register" });
  }
});

app.get("/allpost", authMiddleware, async (req, res) => {
  const posts = await postModel.find({}).populate("user");
  res.json(posts);
});

app.post("/follow-toggle/:followedUserId", authMiddleware, async (req, res) => {
  const followingUserId = req.user._id;
  const followedUserId = req.params.followedUserId;
  const followingUser = await userModel.findById(followingUserId);
  const followedUser = await userModel.findById(followedUserId);
  const followedfollowers = followedUser.followers;
  const isFollowed = followedfollowers.includes(followingUserId);
  if (followedUserId === followingUserId) {
    res.status(400).json({ message: "ooriigoo dagaj bolohgui sht!" });
    return;
  }

  if (isFollowed) {
    await userModel.findByIdAndUpdate(followingUserId, {
      following: followingUser.following.filter(
        (item) => item.toString() !== followedUserId
      ),
    });

    await userModel.findByIdAndUpdate(followedUserId, {
      followers: followingUser.followers.filter(
        (item) => item.toString() !== followedUserId
      ),
    });
  } else {
    await userModel.findByIdAndUpdate(followingUserId, {
      following: [...followingUser.following, followedUserId],
    });

    await userModel.findByIdAndUpdate(followedUserId, {
      followers: [...followedUser.followers, followingUserId],
    });
  }

  res.status(200).json({ message: "nice" });
});

app.get("/profileHeader/:userId", async (req, res) => {
  const userId = req.params.userId;
  const userData = await userModel.find({ _id: userId });
  if (userData) {
    res.status(200).json(userData);
  } else {
    res.status(400).json({ message: "alda garla" });
  }
});

app.get("/profilePosts/:userId", authMiddleware, async (req, res) => {
  const userId = req.params.userId;

  const userData = await postModel.find({ user: userId }).populate("user");

  res.status(200).json(userData);
});

app.get("/userPost/:userId", async (req, res) => {
  const userId = req.params.userId;
  const posts = await postModel.find({ user: userId }).populate("user");
  res.json(posts);
});

app.post("/toggle-like/:postId", authMiddleware, async (req, res) => {
  const user = req.user;

  const params = req.params;

  const postId = params.postId;

  const post = await postModel.findById(postId);

  const postLike = post.like;
  const isLiked = postLike.includes(user._id);

  if (isLiked) {
    await postModel.findByIdAndUpdate(postId, {
      like: postLike.filter((like) => like.toString() !== user._id),
    });
  } else {
    await postModel.findByIdAndUpdate(postId, {
      like: [...postLike, user._id],
    });
  }

  res.status(200).json({ message: "amjilttai like darlaa" });
});

app.post("/comment", authMiddleware, async (req, res) => {
  const userId = req.user._id;
  const { comment, postId } = req.body;
  const createdComment = await commentModel.create({
    user: userId,
    post: postId,
    comment,
  });

  res.status(200).json(createdComment);
});

// app.post("/comments/:postId", authMiddleware, async (req, res) => {
//   const postId = req.params.postId;
//   console.log(postId);
//   const comModelpostId = (await commentModel.find({ post: postId })).includes();

//   const post = await postModel.findById(postId);
//   const postComment = post.comments;
//   if (!comModelpostId) {
//     await postModel.findByIdAndUpdate(postId, {
//       comment: [...postComment, postId],
//     });
//   } else {
//     await postModel.findByIdAndUpdate(postId, {
//       comment: [...postComment, postId],
//     });
//   }

//   res.status(200).json({ message: "success" });
// });

app.get("/getPosts/:postId", authMiddleware, async (req, res) => {
  const postId = req.params.postId;
  const comment = await commentModel
    .find({
      post: postId,
    })
    .populate({
      path: "post",
      populate: { path: "user", select: "username profilePicture" },
    })
    .populate("user", "username profilePicture");

  res.status(200).json(comment);
});

app.get("/searchUsers/:searchParam", authMiddleware, async (req, res) => {
  const searchParam = req.params.searchParam;

  const users = await userModel.find({
    username: new RegExp(searchParam, "i"),
  });
  res.status(200).json(users);
});

app.get("/userPostyee/:postId", authMiddleware, async (req, res) => {
  const postId = req.params.postId;

  const post = await postModel
    .findById({ _id: postId })
    .populate({ path: "user" });
  res.status(200).json(post);
});

app.get("/editUserdata/:userId", authMiddleware, async (req, res) => {
  const userId = req.params.userId;
  const user = await userModel.findById({ _id: userId });
  res.status(200).json(user);
});

app.post("/editUserProfile", authMiddleware, async (req, res) => {
  const userId = req.body._id;
  const body = req.body;
  const { username, bio } = body;

  await userModel.findByIdAndUpdate(userId, {
    username: username,
    bio: bio,
  });

  console.log(userId);
  console.log(body, "body");

  res.status(200).json({ message: "amjiltta soligdloo" });
});

app.delete("/userPostDelete/:postId", authMiddleware, async (req, res) => {
  const postId = req.params.postId;

  const post = await postModel.findById(postId);

  await postModel.findByIdAndDelete(postId);

  res.status(200).json({ message: "amjilttai ustaglaa" });
});

app.delete(
  "/postCommentDelete/:commentId",
  authMiddleware,
  async (req, res) => {
    const commentId = req.params.commentId;
  }
);
app.listen(Port, () => {
  console.log("server is running on http://localhost/" + Port);
});
