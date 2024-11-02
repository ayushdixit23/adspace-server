import express from "express";
import {
  addAdImpression,
  createAd,
  createAdwithCommunity,
  getAds,
  getAdsStats,
  getCommunities,
  handleAdClick,
  updateAdStatus,
} from "../controller/ads.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { singleFile, AnyFile } from "../middlewares/multer.js";

const adsRouter = express.Router();

adsRouter.use(isAuthenticated);

adsRouter.post("/new", singleFile, createAd);
adsRouter.post("/createAdwithCommunity", AnyFile, createAdwithCommunity);
adsRouter.get("/click/:adId", handleAdClick);
adsRouter.get("/ad-stats", getAdsStats);
adsRouter.put("/updateAd/:adId/:status/:actualStatus", updateAdStatus);
adsRouter.get("/", getAds);
adsRouter.get("/addImpression/:adId", addAdImpression);
adsRouter.get("/communities/:id", getCommunities);

export default adsRouter;
