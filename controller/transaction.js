import axios from 'axios';
import sha256 from 'crypto-js/sha256.js';
import { Buffer } from 'buffer';
import Advertiser from '../models/advertiser.js';  
import Transaction from '../models/transaction.js'; 
import { v4 as uuidv4 } from 'uuid'; 

import  { startOfMonth } from "date-fns"

export const addmoneytowallet = async (req, res) => {
  const id = req.user;
  const { amount } = req.body;

  console.log(req.user,"reqiser")
  try {
    const user = await Advertiser.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const transactionId = uuidv4();
    const newTransaction = new Transaction({
      amount: amount,
      type: "Wallet",
      transactionid: transactionId,
    });

    console.log(user.firstname,user._id)

    
    const savedTransaction = await newTransaction.save();
    await Advertiser.updateOne({ _id: id }, { $push: { transactions: savedTransaction._id } });

    const payload = {
      merchantId: process.env.MERCHANT_ID,
      merchantTransactionId: savedTransaction._id,
      merchantUserId: user._id,
      amount: amount*100,
      redirectUrl: "https://ads.grovyo.com/main/wallet",
      redirectMode: "REDIRECT",
      callbackUrl: `https://adsserver.grovyo.xyz/api/v1/transactions/updatetransactionstatus/${id}/${savedTransaction._id}/${amount}`,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64string = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
    const shaString = sha256(base64string + '/pg/v1/pay' + process.env.PHONE_PAY_KEY).toString();
    const checkSum = `${shaString}###${process.env.KEY_INDEX}`;

    const response = await axios.post(
      'https://api.phonepe.com/apis/hermes/pg/v1/pay',
      { request: base64string },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checkSum,
          accept: 'application/json',
        },
      }
    );
    
    return res.status(200).json({
      success: true,
      url: response.data.data.instrumentResponse.redirectInfo.url,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updatetransactionstatus = async (req, res) => {
  const { id, tid, amount } = req.params;
  try {
    console.log(id)
    const user = await Advertiser.findById(id);


    if (!user) {
      console.log("user nti found")
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const checksum = generateChecksum(process.env.MERCHANT_ID, tid, process.env.PHONE_PAY_KEY, process.env.KEY_INDEX);
    
    const transaction = await Transaction.findById(tid);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    const response = await axios.get(
      `https://api.phonepe.com/apis/hermes/pg/v1/status/${process.env.MERCHANT_ID}/${tid}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': process.env.MERCHANT_ID,
        },
      }
    );

    if (response.data.code === "PAYMENT_SUCCESS") {
      await Transaction.updateOne({ _id: transaction._id }, { $set: { status: "completed" } });
      await Advertiser.updateOne({ _id: id }, { $inc: { currentbalance: amount } });
      return res.status(200).json({ success: true });
    } else {
      await Transaction.updateOne({ _id: transaction._id }, { $set: { status: "failed" } });
      return res.status(200).json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

const generateChecksum = (merchantId, transactionId, saltKey, saltIndex) => {
  const stringToHash = `/pg/v1/status/${merchantId}/${transactionId}` + saltKey;
  const shaHash = sha256(stringToHash).toString();
  return `${shaHash}###${saltIndex}`;
};

// export const getWallet = async (req, res) => {

//   const id = req.user;
//   const { start, end } = req.query;
//   console.log("Received Request:", { id, start, end });
  
//   try {
//     const user = await Advertiser.findById(id)
//       .populate("transactions")
//       .select("currentbalance totalspent amountspent transactions")
//       .lean();

//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     const totalCredits = user.amountspent.reduce((total, entry) => {
//       return total + (Number(entry.amount) || 0);
//     }, 0);

//     let transactions = user.transactions || [];
    
//     if (start ||end) {
//       const startDate = start ? new Date(start) : new Date(0);
//       const endDate = end ? new Date(end) : new Date(); 

//       console.log("Start Date:", startDate);
//       console.log("End Date:", endDate);
//       console.log("Transactions Before Filtering:", transactions);
      
//       transactions = transactions.filter(transaction => {
//         const transactionDate = new Date(transaction.createdAt);
//         console.log("Transaction Date:", transactionDate);
//         return transactionDate >= startDate && transactionDate <= endDate;
//       });
      
//       console.log("Transactions After Filtering:", transactions);
//     }

//     transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
//     transactions.reverse();

//     const walletData = {
//       currentBalance: user.currentbalance,
//       totalCredits: totalCredits,
//       transactions: transactions,
//       lastTransaction: transactions.length > 0 ? transactions[0] : null,
//       lastPaymentDate: transactions.length > 0 ? transactions[0].date : null,
//     };

//     return res.status(200).json({ success: true, data: walletData });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, message: "Something went wrong" });
//   }
// };

export const getWallet = async (req, res) => {
  const userId = req.user;
  const { start, end } = req.query;

  try {
    const user = await Advertiser.findById(userId)
      .populate("transactions")
      .select("currentbalance totalspent amountspent transactions")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let transactions = user.transactions || [];
    const now = new Date();
    const firstDayOfCurrentMonth = startOfMonth(now);

    // Apply date filter if provided
    if (start || end) {
      const startDate = start ? new Date(start) : new Date(0);
      const endDate = end ? new Date(end) : new Date(); 

      transactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    // Sort and reverse transactions
    transactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).reverse();

    // Calculate total credits and payments
    const credits = [];
    let totalPayments = 0;

    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (t.type === "Credits") {
        credits.push(Number(t.amount));
      }
      if (t.status === 'completed') {
        totalPayments += Number(t.amount);
      }
    }

    const totalCredits = credits.reduce((acc, curr) => acc + curr, 0);

    // Filter total spent from start of month to now
    const filteredTotalSpent = user.totalspent.filter(spent => {
      const spentDate = new Date(spent.date);
      return spentDate >= firstDayOfCurrentMonth && spentDate <= now;
    });

    const sumOfFilteredTotalSpent = filteredTotalSpent.reduce((acc, curr) => acc + curr.amount, 0);
    const eighteenPercent = (sumOfFilteredTotalSpent * 0.18);
    const netCost = sumOfFilteredTotalSpent - eighteenPercent;

    // Prepare the wallet data
    const walletData = {
      currentBalance: user.currentbalance,
      totalCredits: totalCredits,
      totalPayments: totalPayments,
      netCost: netCost,
      transactions: transactions,
      lastTransaction: transactions.length > 0 ? transactions[0] : null,
      lastPaymentDate: transactions.length > 0 ? transactions[0].createdAt : null,
    };


    console.log(walletData,"walletData")

    return res.status(200).json({ success: true, data: walletData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
