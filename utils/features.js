import mongoose from "mongoose";
import adStats from "../models/adStats.js";
import { config as configDotenv } from 'dotenv';
import aesjs from "aes-js"
configDotenv();

const key = process.env.key;

const connectDB = (url) => {
  mongoose.connect(url)
  .then(() => {
    console.log('MongoDB Connected');
  })
  .catch(err => {
    console.error('MongoDB Connection Error: ', err);
    process.exit(1);
  });
};

const sendToken = (res, user, statusCode, message) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  
  console.log("Authenticated: " + user._id + " mode: Token");

  return res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      message,
      token 
    });
};

function mapRequestToAdSchema(body) {
  return {
    adname: body.name,
    goal: body.objective,
    headline: body.headline,
    desc: body.description,
    cta: body.actionAndUrl?.action,
    ctalink: body.actionAndUrl?.url,
    content: body.file ? body.file : [], // Assuming file is optional and can be an array or null
    type: body.placements,
    impressions: body.estImpressions || 0,
    clicks: body.estClicks || 0,
    dailybudget: parseFloat(body.dailyBudget) || 0,
    totalbudget: parseFloat(body.totalBudget) || 0,
    category: body.communityTags || [],
    tags: body.interestTags || [],
    gender: body.gender,
    agerange: body.ageGroup,
    location: body.location || [],
    startdate: body.startDate,
    enddate: body.endDate,
    focusOn: body.focusOn, // New field
    cpc: parseFloat(body.costPerAction) || 0, // Assuming costPerAction corresponds to cpc
    popularity: 1, // Default value
  };
}

const checkUniqueView = async (adId, userId) => {
  console.log('adId:', adId);
  const stats = await adStats.findOne({ adId: adId });
  if (stats) {
    const hasViewed = stats.views.some(view => view.userId.toString() === userId);
    if (!hasViewed) {
      return true;
    }
  }
  return false;
};


const decryptaes = (data) => {
	try {
		const encryptedBytes = aesjs.utils.hex.toBytes(data);
		const aesCtr = new aesjs.ModeOfOperation.ctr(
			JSON.parse(key),
			new aesjs.Counter(5)
		);
		const decryptedBytes = aesCtr.decrypt(encryptedBytes);
		const decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
   
		return decryptedText;
	} catch (e) {
		console.log(e);
	}
};

const encryptaes = (data) => {
  
	try {
		const textBytes = aesjs.utils.utf8.toBytes(data);
		const aesCtr = new aesjs.ModeOfOperation.ctr(
			JSON.parse(key),
			new aesjs.Counter(5)
		);
		const encryptedBytes = aesCtr.encrypt(textBytes);
		const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
		return encryptedHex;
	} catch (e) {
		console.log(e);
	}
}


export { connectDB, mapRequestToAdSchema, checkUniqueView ,decryptaes,encryptaes, sendToken };