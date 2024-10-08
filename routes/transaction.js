import express from "express";
import { addmoneytowallet, getWallet, updatetransactionstatus } from "../controller/transaction.js";
import { isAuthenticated } from "../middlewares/auth.js";
const transactionRoute = express.Router();


// transactionRoute.use(isAuthenticated);
transactionRoute.post("/addMoney", isAuthenticated,addmoneytowallet)
transactionRoute.post("/updatetransactionstatus/:id/:tid/:amount", updatetransactionstatus);
transactionRoute.get("/get-wallet",isAuthenticated, getWallet);

export default transactionRoute;