import AdStats from "../models/adStats.js";
import ads from "../models/ads.js";
import { checkUniqueView, decryptaes } from "../utils/features.js";
import { kafka } from "../utils/kafka.js";
import s3 from "../utils/awsConfig.js";
import User from "../models/user.js";
import Community from "../models/community.js";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import Topic from "../models/Topic.js";
import Post from "../models/post.js";
import Approvals from "../models/approve.js";
import advertiser from "../models/advertiser.js";
import LocationData from "../models/LocationData.js";
import { constructFrom } from "date-fns";

// const producer = kafka.producer();
// console.log("Connecting Producer...");
// await producer.connect();
// console.log("Producer Connected Successfully");

const createAd = async (req, res) => {
  try {
    const parsedData = req.body;
    const file = req.file;

    let user;

    if (parsedData.creatorid) {
      user = await User.findById(parsedData.creatorid).populate({
        path: "advertiserid",
        select: "_id"
      });

  
      if (user) {
        user = await advertiser.findById(user.advertiserid._id);
        console.log("data from creator ad account", user);
        
      } else {
        
        user = await advertiser.findById(req.user);
        console.log("data from advertiser ad account", user);

      }
    } else {
      user = await advertiser.findById(req.user);
      console.log("data from advertiser ad account", user);
    }

    if (!file&&!parsedData?.file) {
      return res.status(203).json({ message: "Media is required!" });
    }

    let objectName
    const uuidString = uuidv4();

    if(file){
    
      objectName = `${Date.now()}${uuidString}${file.originalname}`;
 
     await s3.send(
       new PutObjectCommand({
         Bucket: process.env.AD_BUCKET,
         Key: objectName,
         Body: file.buffer,
         ContentType: file.mimetype,
       })
     );
 
     await s3.send(
       new PutObjectCommand({
         Bucket: process.env.POST_BUCKET,
         Key: objectName,
         Body: file.buffer,
         ContentType: file.mimetype,
       })
     );
    }
    const cont = parsedData?.file.split(".net/")[1];
    const extensionss = cont.split(".").pop();
    let objectMedia = `${cont}`;
    
   const contents = {
      extension: `${parsedData.isImage}/${extensionss}`,
      name: objectMedia,
    };

    const isFile = file ? {
      extension: req.file.mimetype,
      name: objectName,
    } : contents 

    const newAd = new ads({
      adname: parsedData.name,
      status: parsedData.status,
      engagementrate: parsedData.engagementrate,
      amountspent: parsedData.amountspent,
      postid: parsedData.postid?parsedData.postid:undefined,
      advertiserid: user._id,
      startdate: parsedData.startDate,
      enddate: parsedData.endDate,
      goal: parsedData.objective.name,
      tags:JSON.parse( parsedData.interestTags) || [],
      location: JSON.parse(parsedData.location) || [],
      category:JSON.parse( parsedData.communityTags)||[],
      cta: parsedData.cta || null,
      ctalink: parsedData.ctalink,
      content: [isFile],
      type: parsedData.type,
     
      gender: parsedData.gender,
      minage: parsedData.ageGroup?.minage,
      maxage: parsedData.ageGroup?.maxage,
      totalbudget: parsedData.totalBudget,
      adsDetails:
        parsedData.adsDetails?.map((detail) => ({
          time: detail.time,
          click: detail.click,
          impressions: detail.impressions,
          cpc: detail.cpc,
          cost: detail.cost,
        })) || [],
      dailybudget: parsedData.dailyBudget,
      audiencesize: parsedData.audienceSize,
      editcount:
        parsedData.editCount?.map((edit) => ({
          date: edit.date,
          number: edit.number,
        })) || [],
      creation: parsedData.creation,
      headline: parsedData.headline,
      desc: parsedData.description,
      totalspent: parsedData.totalspent,
      views: parsedData.views,
      impressions: parsedData.impressions,
      cpc: parsedData.cpc,
      clicks: parsedData.clicks,
      popularity: parsedData.popularity,
    });

    const adSaved = await newAd.save();
    user.ads.push(adSaved._id);
    await user.save();

    const initialAdStats = new AdStats({
      adId: newAd._id,
      date: new Date(),
      impressions: [],
      clicks: [],
      costPerClick: newAd.cpc || 0,
      amountSpent: newAd.totalspent || 0,
      views: [],
      engagement: 0,
      reach: 0,
      conversions: 0,
      conversionRate: 0,
    });

    // Save initial statistics
    await initialAdStats.save();

    const topic = await Topic.find({ community: parsedData.comid }).find({
      title: "Posts",
    });

    let idofad;

    if (!parsedData.postid) {
      const post = new Post({
        title: parsedData.headline,
        desc: parsedData.desc,
        community: parsedData.comid,
        sender: user.userid,
        post: [{ content: objectName, type: file.mimetype }],
        topicId: topic[0]._id,
        tags: parsedData.community.category,
        kind: "ad",
       
        isPromoted: true,
        cta: parsedData?.cta,
        ctalink: parsedData.ctalink,
        adtype: parsedData?.type,
        promoid: adSaved._id,
      });
      const savedpost = await post.save();
      const ad = await ads.findById(adSaved._id);
      ad.postid = savedpost._id;

      idofad = await ad.save();
      await Community.updateOne(
        { _id: parsedData?.comid },
        { $push: { posts: savedpost._id }, $inc: { totalposts: 1 } }
      );

      await Topic.updateOne(
        { _id: topic[0]._id.toString() },
        { $push: { posts: savedpost._id }, $inc: { postcount: 1 } }
      );
    } else {
      const post = await Post.findById(parsedData?.postid);
      post.kind = "ad";
      post.isPromoted = true;
      post.cta = parsedData?.cta;
      post.ctalink = parsedData?.ctalink;
      post.adtype = parsedData?.type;
      post.promoid = adSaved._id;

      const savedpost = await post.save();

      const findad = await ads.findById(adSaved._id);
      findad.postid = savedpost._id;
      idofad = await findad.save();
    }

    const approve = new Approvals({
      id: idofad._id,
      type: "ad",
    });

    await approve.save();

    // Respond with success
    return res.status(201).json({
      success: true,
      message: "Ad created successfully!",
      ad: newAd,
      initialStats: initialAdStats,
    });
  } catch (error) {
    console.error(error);

    // Respond with validation error messages
    return res.status(400).json({
      success: false,
      message: error.errors || "Invalid input.",
    });
  }
};

const createAdwithCommunity = async (req, res) => {
  try {
    const parsedData = req.body;

    const id = req.user;
    const user = await advertiser.findById(id);
    const userauth = await User.findById(user.userid);

    const communityImageFile = req.files.find(
      (file) => file.fieldname === "communityImage"
    );
    const file = req.files.find((file) => file.fieldname === "file");

    if (!communityImageFile) {
      return res.status(400).json({ message: "Community Dp is required" });
    }

    if (!file) {
      return res.status(400).json({ message: "Media is required" });
    }

    const uuidString = uuidv4();

    let objectName = `${Date.now()}${uuidString}${file.originalname}`;
    let communityImage = `${Date.now()}${uuidString}${
      communityImageFile.originalname
    }`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: communityImage,
        Body: communityImageFile.buffer,
        ContentType: communityImageFile.mimetype,
      })
    );
    
    const community = new Community({
      title: parsedData?.community,
      creator: userauth?._id,
      dp: communityImage,
      desc: parsedData?.communityDesc,
      category: parsedData?.communityCategory,
      type: "public",
    });
    const savedcom = await community.save();
    const topic1 = new Topic({
      title: "Posts",
      creator: userauth?._id,
      community: savedcom._id,
    });
    await topic1.save();

    const topic2 = new Topic({
      title: "All",
      creator: userauth?._id,
      community: savedcom._id,
    });
    await topic2.save();

    await Community.updateOne(
      { _id: savedcom._id },
      {
        $push: { members: userauth?._id, admins: userauth._id },
        $inc: { memberscount: 1 },
      }
    );

    await Community.updateOne(
      { _id: savedcom._id },
      { $push: { topics: [topic1._id, topic2._id] } }
    );

    await User.findByIdAndUpdate(
      { _id: userauth?._id },
      {
        $push: {
          topicsjoined: [topic1._id, topic2._id],
          communityjoined: savedcom._id,
          communitycreated: savedcom._id,
        },
        $inc: { totaltopics: 3, totalcom: 1 },
      }
    );

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AD_BUCKET,
        Key: objectName,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.POST_BUCKET,
        Key: objectName,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const newAd = new ads({
      adname: parsedData.name,
      status: parsedData.status,
      banner: {
        name: objectName,
        url: `https://${process.env.AD_BUCKET}.s3.amazonaws.com/${objectName}`,
      },
      engagementrate: parsedData.engagementrate,
      amountspent: parsedData.amountspent,
      postid: parsedData.postid?parsedData.postid:undefined,
      advertiserid: req.user,
      startdate: parsedData.startDate,
      enddate: parsedData.endDate,
      goal: parsedData.objective.name,
      tags:JSON.parse( parsedData.interestTags) || [],
      location: JSON.parse(parsedData.location) || [],
      category:JSON.parse( parsedData.communityTags)||[],
      cta: parsedData.cta || null,
      ctalink: parsedData.ctalink,
      content: [isFile],
      type: parsedData.type,
      gender: parsedData.gender,
      minage: parsedData.ageGroup?.minage,
      maxage: parsedData.ageGroup?.maxage,
      totalbudget: parsedData.totalBudget,
      adsDetails:
        parsedData.adsDetails?.map((detail) => ({
          time: detail.time,
          click: detail.click,
          impressions: detail.impressions,
          cpc: detail.cpc,
          cost: detail.cost,
        })) || [],
      dailybudget: parsedData.dailyBudget,
      audiencesize: parsedData.audienceSize,
      editcount:
        parsedData.editCount?.map((edit) => ({
          date: edit.date,
          number: edit.number,
        })) || [],
      creation: parsedData.creation,
      headline: parsedData.headline,
      desc: parsedData.description,
      totalspent: parsedData.totalspent,
      views: parsedData.views,
      impressions: parsedData.impressions,
      cpc: parsedData.cpc,
      clicks: parsedData.clicks,
      popularity: parsedData.popularity,
    });

    const adSaved = await newAd.save();
    user.ads.push(adSaved._id);
    await user.save();

    const initialAdStats = new AdStats({
      adId: newAd._id,
      date: new Date(),
      impressions: [],
      clicks: [],
      costPerClick: newAd.cpc || 0,
      amountSpent: newAd.totalspent || 0,
      views: [],
      engagement: 0,
      reach: 0,
      conversions: 0,
      conversionRate: 0,
    });

    // Save initial statistics
    await initialAdStats.save();

    const topic = await Topic.find({ community: community._id }).find({
      title: "Posts",
    });

    const post = new Post({
      title: parsedData?.headline,
      desc: parsedData?.desc,
      community: community._id,
      sender: userauth?._id,
      topicId: topic[0]._id,
      post: [{ content: objectName, type: file.mimetype }],
      tags: community.category,
      kind: "ad",
      promoid: adSaved._id,
      isPromoted: true,
    });
    const savedpost = await post.save();

    const adstopost = await ads.findById(adSaved?._id);
    adstopost.postid = savedpost._id;
    await adstopost.save();

    const approve = new Approvals({
      id: adSaved._id,
      type: "ad",
    });

    await approve.save();
    await Community.updateOne(
      { _id: community._id },
      { $push: { posts: savedpost._id }, $inc: { totalposts: 1 } }
    );

    await Topic.updateOne(
      { _id: topic[0]._id.toString() },
      { $push: { posts: savedpost._id }, $inc: { postcount: 1 } }
    );

    // Respond with success
    return res.status(201).json({
      success: true,
      message: "Ad created successfully!",
      ad: newAd,
      initialStats: initialAdStats,
    });
  } catch (error) {
    console.error(error);

    // Respond with validation error messages
    return res.status(400).json({
      success: false,
      message: error.errors || "Invalid input.",
    });
  }
};

const getAdsStats = async (req, res) => {
  try {
    const { startDate, endDate, campaignOptions, selectedClient } = req.query;

    let advertiserid;
    if(selectedClient){
      console.log("selectedClient 1", selectedClient);
      
      advertiserid = selectedClient;
    } else {
    advertiserid = req.user;
    }

    if (!advertiserid) {
      return res.status(400).json({ error: "advertiserid is required" });
    }

    if (!campaignOptions || typeof campaignOptions !== "object") {
      return res
        .status(400)
        .json({ error: "campaignOptions is required and must be an object" });
    }

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = {
        timestamp: {
          $gte: thirtyDaysAgo,
        },
      };
    }


    // const activeCampaignOptions = Object.keys(campaignOptions).filter(key => campaignOptions[key] === 'true');
    const activeCampaignOptions = Object.keys(campaignOptions).filter(
      (key) => campaignOptions[key] === "true" || campaignOptions[key] === true
    );

    const Advertiser = await advertiser.findById(advertiserid);
    
    let adsData;

    if (Advertiser.type !== "Individual") {
      const clientIds = Advertiser.clients.map(
        (client) => client.clientadvertiserid
      );
      adsData = await ads.find({
        $or: [{ advertiserid }, { advertiserid: { $in: clientIds } }],
        status: { $in: activeCampaignOptions },
      });
    } else {
      adsData = await ads.find({
        advertiserid,
        status: { $in: activeCampaignOptions },
      });
    }
    if (adsData.length === 0) {
      return res.status(200).json({
        totalStats: {
          totalImpressions: 0,
          totalClicks: 0,
          totalAmountSpent: 0,
          totalViews: 0,
          totalEngagement: 0,
          totalReach: 0,
          totalConversions: 0,
        },
        timeSeries: [],
        ads: [],
      });
    }

    const adIds = adsData.map((ad) => ad._id);

    const statsData = await AdStats.find({
      adId: { $in: adIds },
      $or: [
        { "impressions.timestamp": dateFilter.timestamp },
        { "clicks.timestamp": dateFilter.timestamp },
        { "views.timestamp": dateFilter.timestamp },
      ],
    });

    const totalStats = {
      totalImpressions: 0,
      totalClicks: 0,
      totalAmountSpent: 0,
      totalViews: 0,
      totalEngagement: 0,
      totalReach: 0,
      totalConversions: 0,
    };

    const formattedTimeSeries = {};
    const adStatsMap = {};

    adsData.forEach((ad) => {
      adStatsMap[ad._id] = {
        on: ad.status === "active",
        adname: ad.adname,
        status: ad.status,
        impressions: 0,
        clicks: 0,
        cpc: 0,
        ctr: 0,
        amountSpent: 0,
        adId: ad._id,
      };
    });

    statsData.forEach((stat) => {
      const adId = stat.adId.toString();
      const dateKey =
        stat.impressions[0]?.timestamp?.toISOString().split("T")[0] ||
        stat.clicks[0]?.timestamp?.toISOString().split("T")[0] ||
        stat.views[0]?.timestamp?.toISOString().split("T")[0];

      if (!formattedTimeSeries[dateKey]) {
        formattedTimeSeries[dateKey] = {
          date: dateKey,
          impressions: 0,
          clicks: 0,
          views: 0,
          amountSpent: 0,
        };
      }

      formattedTimeSeries[dateKey].impressions += stat.impressions.length;
      formattedTimeSeries[dateKey].clicks += stat.clicks.length;
      formattedTimeSeries[dateKey].views += stat.views.length;
      formattedTimeSeries[dateKey].amountSpent += stat.amountSpent;

      totalStats.totalImpressions += stat.impressions.length;
      totalStats.totalClicks += stat.clicks.length;
      totalStats.totalAmountSpent += stat.amountSpent;
      totalStats.totalViews += stat.views.length;
      totalStats.totalEngagement += stat.engagement || 0;
      totalStats.totalReach += stat.reach || 0;
      totalStats.totalConversions += stat.conversions || 0;

      if (adStatsMap[adId]) {
        adStatsMap[adId].impressions += stat.impressions.length;
        adStatsMap[adId].clicks += stat.clicks.length;
        adStatsMap[adId].amountSpent += stat.amountSpent;
      }
    });

    for (const adId in adStatsMap) {
      const adStats = adStatsMap[adId];
      adStats.cpc =
        adStats.clicks > 0 ? adStats.amountSpent / adStats.clicks : 0;
      adStats.ctr =
        adStats.impressions > 0
          ? (adStats.clicks / adStats.impressions) * 100
          : 0;
    }

    const timeSeries = Object.values(formattedTimeSeries).map((item) => ({
      date: item.date,
      impressions: item.impressions,
      clicks: item.clicks,
      views: item.views,
      amountSpent: item.amountSpent,
      costPerClick: item.clicks > 0 ? item.amountSpent / item.clicks : 0,
    }));

    const result = {
      totalStats,
      timeSeries,
      ads: Object.values(adStatsMap).map((ad) => ({
        name: ad.adname,
        id: ad.adId,
        on: ad.on,
        impressions: ad.impressions,
        clicks: ad.clicks,
        cpc: ad.cpc,
        ctr: ad.ctr,
        amountSpent: ad.amountSpent,
        status: ad.status,
      })),
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching ad stats:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching ad statistics" });
  }
};

const updateAdStatus = async (req, res) => {
  try {
    const { adId, status, actualStatus } = req.params;

    if (actualStatus === "review") {
      return res.status(203).json({
        success: false,
        message:
          "Unable to perform the action. The ad is currently under review",
      });
    }

    const statusValue = status === "true" ? "active" : "stopped";
    const ad = await ads.findByIdAndUpdate(
      adId,
      { status: statusValue },
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }
    res.status(200).json({ message: "Ad status updated successfully", ad });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const handleAdClick = async (req, res) => {
  try {
    const { adId } = req.params;
    const userId = req.user;

    // will be done in another place
    // await producer.send({
    //   topic: "ad-impressions",
    //   messages: [
    //     {
    //       value: JSON.stringify({
    //         adId,
    //         timestamp: new Date(),
    //         event: "impression",
    //       }),
    //     },
    //   ],
    // });

    const uniqueView = await checkUniqueView(adId, userId);
    if (uniqueView) {
      await producer.send({
        topic: "ad-views",
        messages: [
          {
            value: JSON.stringify({
              adId,
              userId,
              timestamp: new Date(),
              event: "view",
            }),
          },
        ],
      });
    }

    await producer.send({
      topic: "ad-clicks",
      messages: [
        {
          value: JSON.stringify({
            adId,
            timestamp: new Date(),
            event: "click",
          }),
        },
      ],
    });

    const ad = await ads.findById(adId);
    if (ad) {
      res.redirect(ad.ctalink);
    } else {
      res.status(404).json({ message: "Ad not found" });
    }
  } catch (error) {
    console.error("Error processing ad click:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAds = async (req, res) => {
  try {
    const adsData = await ads.find();
    res.json(adsData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addAdImpression = async (req, res) => {
  try {
    const { adId } = req.params;

    await producer.send({
      topic: "ad-impressions",
      messages: [
        {
          value: JSON.stringify({
            adId,
            timestamp: new Date(),
            event: "impression",
          }),
        },
      ],
    });
    res.status(200).json({ message: "Ad impression added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// const getCommunities = async (req, res) => {
//   try {
//     const userId = req.user;

//     console.log(req.user,"req.user")

//     const advertiserData = await Advertiser.findById(userId)
//       .populate("clientadvertiserid")
//       .exec();

//     if (!advertiserData) {

//       return res.status(404).json({ message: "Advertiser not found" });
//     }

//     // Get the advertiser's email and phone, as well as the emails and phones of client advertisers
//     const clientEmailsPhones = advertiserData.clientadvertiserid.map(client => ({
//       email: client.email,
//       phone: client.phone
//     }));

//     const userData = await User.findOne({
//       $or: [
//         { email: advertiserData.email },
//         { phone: advertiserData.phone },
//         ...clientEmailsPhones.map(({ email, phone }) => ({ email, phone }))
//       ],
//     });

//     if (!userData) {
//       console.log("advertiserData")
//       return res.status(404).json({ message: "No user found for advertiser or clients" });
//     }

//     // Retrieve communities for both the advertiser and their clients
//     const communities = await Community.find({
//       $or: [
//         { creator: userId, type:"public"}, // Communities created by the advertiser
//         { creator: { $in: advertiserData.clientadvertiserid.map(client => client._id) },type:"public" } // Communities created by clients
//       ]
//     }).exec();

//     if (!communities || communities.length === 0) {
//       return res.status(404).json({ message: "No communities found" });
//     }

//     res.json(communities);

//   } catch (error) {
//     console.error("Error fetching communities: ", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

const getCommunities = async (req, res) => {
  try {
    const adveId = req.params.id;
    const Advertiser = await advertiser.findById(adveId);

    const user = await User.findById(Advertiser.userid);
    if (!user) {
      return res
        .status(400)
        .json({ message: "User Not Found", success: false });
    }
    const com = await Community.find({
      creator: user._id,
      type: "public",
    }).select("dp title category _id type");

    const communitywithDps = await Promise.all(
      com.map(async (communityId) => {
        const community = await Community.findById(communityId).select(
          "dp title category _id type"
        ).populate({
          path: "creator",
          select: "fullname username dp profilepic"
        });

        if (community) {
          const dps = process.env.URL + community.dp;
          return { ...community.toObject(), dps };
        }

        return null;
      })
    );

    const filteredCommunities = communitywithDps.filter(
      (community) => community !== null
    );

    const locationData = await LocationData.findOne()
  .select("userData.state userData.gender userData.age");
   
    res
      .status(200)
      .json({ communitywithDps: filteredCommunities, success: true,locationData });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: "Something Went Wrong!" });
  }
};

export {
  createAd,
  handleAdClick,
  getAdsStats,
  getAds,
  addAdImpression,
  updateAdStatus,
  getCommunities,
  createAdwithCommunity,
};
