import express from "express";
import { addClient, addUser, createAccount, login, loginforAdspace, loginWithPhone, loginwithworkspace, profile, updateUser } from "../controller/user.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { singleAvatar } from "../middlewares/multer.js";
const userRouter = express.Router();

userRouter.post("/new", singleAvatar, createAccount);
userRouter.post("/signin", login);
userRouter.post("/signinphone", loginWithPhone);
userRouter.get("/loginforAdspace/:id", loginforAdspace);
userRouter.get("/loginwithworkspace/:id/:postid", loginwithworkspace);
// userRouter.post("/logout", logout);
userRouter.use(isAuthenticated);
userRouter.get("/me", profile)
userRouter.put("/updateUser", updateUser);
userRouter.put('/add-client/:advertiserId', addClient);
userRouter.post('/add-user', addUser);

export default userRouter;