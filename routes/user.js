import express from "express";
import { addClient, createAccount, login, profile, updateUser } from "../controller/user.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { singleAvatar } from "../middlewares/multer.js";
const userRouter = express.Router();

userRouter.post("/new", singleAvatar, createAccount);
userRouter.post("/signin", login);
// userRouter.post("/logout", logout);
userRouter.use(isAuthenticated);
userRouter.get("/me", profile)
userRouter.put("/updateUser", updateUser);
userRouter.put('/add-client/:advertiserId', addClient);

export default userRouter;