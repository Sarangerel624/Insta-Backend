import jwt from "jsonwebtoken";
export const authMiddleware = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) throw new Error("need auth header");

  const accessToken = authHeader.split(" ")[1];

  if (!accessToken) throw new Error("need auth token");

  const user = jwt.verify(accessToken, process.env.JWT_SECRET );

  if (!user) throw new Error("need to sign in ");

  req.user = user.data;

  next();
};
