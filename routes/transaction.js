import express from "express";
import { addmoneytowallet, getWallet, updatetransactionstatus } from "../controller/transaction.js";
import { isAuthenticated } from "../middlewares/auth.js";
const transactionRoute = express.Router();

transactionRoute.get("/updatetransactionstatus/:id/:tid/:amount", updatetransactionstatus);
transactionRoute.use(isAuthenticated);
transactionRoute.post("/addMoney", addmoneytowallet)
transactionRoute.get("/get-wallet", getWallet);

export default transactionRoute;