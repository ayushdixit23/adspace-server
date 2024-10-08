import jwt from "jsonwebtoken";
import User from "../models/user.js";
import s3 from "../utils/awsConfig.js";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import advertiser from "../models/advertiser.js";
import { decryptaes } from "../utils/features.js";
import Community from "../models/community.js";
import Topic from "../models/Topic.js";

//genrate a random id
function generateUniqueID() {
  let advertiserID;
  advertiserID = Date.now();
  return advertiserID.toString();
}

function createUsername(fullname) {
  let username = fullname.toLowerCase().replace(/\s+/g, "");

  let randomNumber = Math.floor(100 + Math.random() * 900);

  return `${username}${randomNumber}`;
}

// const createAccount = async (req, res) => {
//   const {
//     firstName,
//     lastName,
//     pan,
//     organizationname,
//     Gst,
//     PhoneNumber,
//     Email,
//     Password,
//     ConfirmPassword,
//     Address,
//     City,
//     State,
//     PostalCode,
//     FamousLandMark,
//     type,
//   } = req.body;
//   const file = req.file;

//   if (!file) {
//     return res.status(400).json({ message: "Profile image is required" });
//   }

//   if (Password !== ConfirmPassword) {
//     return res.status(400).json({ message: "Passwords must match" });
//   }

//   try {
//     const existingAdvertiser = await advertiser.findOne({
//       email: Email,
//       phone: "91" + PhoneNumber,
//     });
//     if (existingAdvertiser) {
//       return res
//         .status(400)
//         .json({ message: "Email or Phone is already in use" });
//     }

//     const user = await User.findOne({
//       email: Email,
//       phone: "91" + PhoneNumber,
//     });

//     if (user) {
//       const objectName = `${Date.now()}-${uuidv4()}-${file.originalname}`;

//       const s3Params = {
//         Bucket: process.env.BUCKET_NAME,
//         Key: objectName,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//       };

//       const region = process.env.BUCKET_REGION;

//       await s3.send(new PutObjectCommand(s3Params));

//       const newAdvertiser = new advertiser({
//         firstname: firstName,
//         lastname: lastName,
//         pan,
//         organizationname,
//         gst: Gst,
//         image: objectName,
//         phone: PhoneNumber,
//         email: Email,
//         password: Password,
//         address: Address,
//         city: City,
//         state: State,
//         userid:user._id,
//         pincode: PostalCode,
//         landmark: FamousLandMark,
//         type,
//         profile: {
//           name: objectName,
//           url: `https://${process.env.AD_BUCKET}.s3.${region}.amazonaws.com/${objectName}`,
//         },
//       });

//       const savedAdv = await newAdvertiser.save();

//       await User.updateOne(
//         { _id: user._id },
//         { $set: { advertiserid: savedAdv._id, adid: savedAdv.advertiserid } }
//       );

//       const token = jwt.sign(
//         { userId: newAdvertiser._id, Email: newAdvertiser.email },
//         process.env.JWT_SECRET,
//         { expiresIn: "15d" }
//       );

//       const updatedUser = {
//         ...savedAdv.toObject(),
//         dp:
//           process.env.URL +
//           (user instanceof advertiser ? user.image : user.profilepic),
//       };

//       // Set token in a cookie
//       res.cookie("auth", token, {
//         httpOnly: true,
//         secure: true,
//         expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
//         sameSite: "none",
//       });

//       res.status(201).json({
//         message: "Account created successfully!",
//         user: {
//           firstname: newAdvertiser.firstname,
//           lastname: newAdvertiser.lastname,
//           email: newAdvertiser.email,
//         },
//         data: updatedUser,
//       });
//     } else {
//       const objectName = `${Date.now()}-${uuidv4()}-${file.originalname}`;

//       const s3Params = {
//         Bucket: process.env.BUCKET_NAME,
//         Key: objectName,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//       };

//       const region = process.env.BUCKET_REGION;

//       await s3.send(new PutObjectCommand(s3Params));

//       const newAdvertiser = new advertiser({
//         firstname: firstName,
//         lastname: lastName,
//         pan,
//         organizationname,
//         gst: Gst,
//         image: objectName,
//         phone: PhoneNumber,
//         email: Email,
//         password: Password,
//         address: Address,
//         city: City,
//         state: State,
//         pincode: PostalCode,
//         landmark: FamousLandMark,
//         type,
//         profile: {
//           name: objectName,
//           url: `https://${process.env.AD_BUCKET}.s3.${region}.amazonaws.com/${objectName}`,
//         },
//       });

//       const savedAdv = await newAdvertiser.save();

//       const newuser = new User({
//         fullname: firstName + " " + lastName,
//         phone: "91" + PhoneNumber,
//         email: Email,
//         advertiserid: savedAdv._id,
//         adid: savedAdv.advertiserid,

//         username: createUsername(firstName + " " + lastName),
//         profilepic: objectName,
//         membership: {
//           membership: "65671e5204b7d0d07ef0e796",
//           ending: "infinite",
//           status: true,
//         },
//       });

//       const savedUser = newuser.save();

//       const comId = "65d313d46a4e4ae4c6eabd15";
//       const community = await Community.findById(comId, { topics: 1 }); // Select only topics

//       if (community) {
//         // Join community and update membership count
//         await Community.updateOne(
//           { _id: comId },
//           { $push: { members: savedUser._id }, $inc: { memberscount: 1 } }
//         );

//         // Get public topics and join them
//         const publicTopics = await Topic.find(
//           { _id: { $in: community.topics }, type: "free" },
//           { _id: 1 } // Only select _id of the topics
//         );

//         const topicIds = publicTopics.map((topic) => topic._id);

//         await Promise.all([
//           Topic.updateMany(
//             { _id: { $in: topicIds } },
//             {
//               $push: { members: savedUser._id, notifications: savedUser._id },
//               $inc: { memberscount: 1 },
//             }
//           ),
//           User.updateOne(
//             { _id: savedUser._id },
//             {
//               $push: { communityjoined: community._id, topicsjoined: topicIds },
//               $inc: { totalcom: 1, totaltopics: topicIds.length },
//             }
//           ),
//         ]);
//       }

//       const updatedUser = {
//         ...savedAdv.toObject(),
//         dp:
//           process.env.URL +
//           (user instanceof advertiser ? user.image : user.profilepic),
//       };

//       // Set token in a cookie
//       res.cookie("auth", token, {
//         httpOnly: true,
//         secure: true,
//         expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
//         sameSite: "none",
//       });

//       res.status(201).json({
//         message: "Account created successfully!",
//         user: {
//           firstname: newAdvertiser.firstname,
//           lastname: newAdvertiser.lastname,
//           email: newAdvertiser.email,
//         },
//         data: updatedUser,
//       });
//     }
//   } catch (error) {
//     console.error(error);

//     if (error.name === "ValidationError") {
//       return res.status(400).json({ message: error.message });
//     }

//     res
//       .status(500)
//       .json({ message: "An error occurred while creating the account." });
//   }
// };

// const login = async (req, res) => {
//   const { username, password } = req.body;
//   console.log(username, password);

//   if (!username || !password) {
//     return res
//       .status(400)
//       .json({ message: "Username and password are required" });
//   }

//   try {
//     let user = await advertiser.findOne({
//       $or: [{ email: username }, { phone: username }],
//     });

//     if (!user) {
//       user = await User.findOne({
//         $or: [{ email: username }, { phone: username }],
//       });
//     }

//     if (!user) {
//       return res.status(400).json({ message: "User not found" });
//     }

//     const userPassword =
//       user instanceof advertiser ? user.password : decryptaes(user.passw);

//     if (userPassword === password) {
//       let Advertiser;
//       user instanceof advertiser;

//       if (user instanceof advertiser) {
//         Advertiser = await advertiser.findById(user._id);
//       } else {
//         Advertiser = await advertiser.findOne({ userid: user._id });
//       }

//       const firstName = user?.fullname?.split(" ")[0];
//       const lastName = user?.fullname?.split(" ")[1];

//       if (!Advertiser) {
//         Advertiser = new advertiser({
//           firstname: firstName ? firstName : user?.fullname,
//           lastname: lastName ? lastName : undefined,
//           type: "Individual",
//           email: user.email,
//           phone: user.phone,
//           address: user.address.streetaddress,
//           image: user.profilepic,
//           city: user.address.city,
//           state: user.address.state,
//           password: decryptaes(user.passw),
//           pincode: user.address.pincode,
//           userid: user._id,
//           advertiserid: generateUniqueID(),
//         });

//         const savedAdv = await Advertiser.save();

//         await User.updateOne(
//           { _id: user._id },
//           { $set: { advertiserid: savedAdv._id, adid: savedAdv.advertiserid } }
//         );
//       }

//       const token = jwt.sign(
//         { userId: user._id, Email: user.email },
//         process.env.JWT_SECRET,
//         { expiresIn: "15d" }
//       );

//       res.cookie("auth", token, {
//         httpOnly: true,
//         secure: true,
//         expires: new Date(Date.now() + 1 * 356 * 24 * 60 * 60 * 1000),
//         sameSite: "none",
//       });

//       const updatedUser = {
//         ...user.toObject(),
//         dp:
//           user instanceof advertiser
//             ? process.env.URL + user.image
//             : process.env.URL + user.profilepic,
//       };

//       res.status(200).json({
//         message: "Login successful",
//         user: {
//           firstName: user.firstname || firstName,
//           lastName: user.lastname || lastName,
//           Email: user.email,
//         },
//         data: updatedUser,
//         success: true,
//         advertiserId: Advertiser._id,
//       });
//     } else {
//       console.log("first");
//       return res.status(400).json({ message: "Invalid credentials" });
//     }
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ message: "An error occurred during login." });
//   }
// };


const createAccount = async (req, res) => {
  const {
    firstName,
    lastName,
    pan,
    organizationname,
    Gst,
    PhoneNumber,
    Email,
    Password,
    ConfirmPassword,
    Address,
    City,
    State,
    PostalCode,
    FamousLandMark,
    type,
  } = req.body;

  const file = req.file;
  
  if (!file) {
    return res.status(400).json({ success:false,message: "Profile image is required" });
  }

  if (Password !== ConfirmPassword) {
    return res.status(400).json({ success:false,message: "Passwords must match" });
  }

  try {
    const phone = "91" + PhoneNumber;
    const existingAdvertiser = await advertiser.findOne({ email: Email, phone });
    
    if (existingAdvertiser) {
      return res.status(400).json({ success:false, message: "Email or Phone is already in use" });
    }

    const user = await User.findOne({ 
      $or: [
        { email: Email },
        { phone: phone }
      ]
    });

    const objectName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    const region = process.env.BUCKET_REGION;

    // S3 upload parameters
    const s3Params = {
      Bucket: process.env.BUCKET_NAME,
      Key: objectName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(s3Params));

    // Common advertiser object creation
    const advertiserData = {
      firstname: firstName,
      lastname: lastName,
      pan,
      organizationname,
      gst: Gst,
      image: objectName,
      phone: PhoneNumber,
      email: Email,
      advertiserid:generateUniqueID(),
      password: Password,
      address: Address,
      city: City,
      state: State,
      userid:user? user._id:undefined,
      pincode: PostalCode,
      landmark: FamousLandMark,
      type,
      profile: {
        name: objectName,
        url: `https://${process.env.AD_BUCKET}.s3.${region}.amazonaws.com/${objectName}`,
      },
    };

    const newAdvertiser = new advertiser(advertiserData);
    const savedAdv = await newAdvertiser.save();

    // Updating existing user or creating new user
    if (user) {
      await User.updateOne({ _id: user._id }, {
        $set: { advertiserid: savedAdv._id, adid: savedAdv.advertiserid }
      });

      const token = jwt.sign({ userId: savedAdv._id, Email: savedAdv.email }, process.env.JWT_SECRET, { expiresIn: "15d" });
      const updatedUser = { ...savedAdv.toObject(), dp: `${process.env.URL}${user.profilepic}` };

     
      return res.status(201).json({
        message: "Account created successfully!",
        user: { firstname: newAdvertiser.firstname, lastname: newAdvertiser.lastname, email: newAdvertiser.email },
        data: updatedUser,
        token, success:true
      });
    } 

    // Creating a new user
    const newUser = new User({
      fullname: `${firstName} ${lastName}`,
      phone,
      email: Email,
      advertiserid: savedAdv._id,
      adid: savedAdv.advertiserid,
      username: createUsername(`${firstName} ${lastName}`),
      profilepic: objectName,
      membership: {
        membership: "65671e5204b7d0d07ef0e796",
        ending: "infinite",
        status: true,
      },
    });

    await newUser.save();

    await advertiser.updateOne({ _id: savedAdv._id }, { $set: { userid: newUser._id } });

    // Joining community and updating membership count
    const comId = "65d313d46a4e4ae4c6eabd15";
    const community = await Community.findById(comId, { topics: 1 });

    if (community) {
      await Community.updateOne({ _id: comId }, { $push: { members: newUser._id }, $inc: { memberscount: 1 } });

      const publicTopics = await Topic.find({ _id: { $in: community.topics }, type: "free" }, { _id: 1 });
      const topicIds = publicTopics.map((topic) => topic._id);

      await Promise.all([
        Topic.updateMany({ _id: { $in: topicIds } }, {
          $push: { members: newUser._id, notifications: newUser._id },
          $inc: { memberscount: 1 },
        }),
        User.updateOne({ _id: newUser._id }, {
          $push: { communityjoined: community._id, topicsjoined: topicIds },
          $inc: { totalcom: 1, totaltopics: topicIds.length },
        }),
      ]);
    }

    // Set token in a cookie
    const token = jwt.sign({ userId: newAdvertiser._id, Email: newAdvertiser.email }, process.env.JWT_SECRET, { expiresIn: "15d" });
   
    res.status(201).json({
      message: "Account created successfully!",
      user: { firstname: newAdvertiser.firstname, lastname: newAdvertiser.lastname, email: newAdvertiser.email },
      data: { ...savedAdv.toObject(), dp: `${process.env.URL}${newUser.profilepic}` },
      token,
      success:true
    });
  } catch (error) {
    console.error(error);
    res.status(error.name === "ValidationError" ? 400 : 500).json({ message: error.message || "An error occurred while creating the account." });
  }
};


const login = async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);

  if (!username || !password) {
    return res
      .status(203)
      .json({ message: "Username and password are required" });
  }

  try {
    let user = await advertiser.findOne({
      $or: [{ email: username }, { phone: username }],
    });

    if (!user) {
      user = await User.findOne({
        $or: [{ email: username }, { phone: username }],
      });
    }

    if (!user) {
      return res.status(203).json({ success:false,message: "User not found" });
    }

    const userPassword =
      user instanceof advertiser ? user.password : decryptaes(user.passw);

    if (userPassword !== password) {
      return res.status(203).json({ success:false,message: "Wrong Password! Invalid credentials" });
    }

    let Advertiser;
    if (user instanceof advertiser) {
      Advertiser = await advertiser.findById(user._id);
    } else {
      Advertiser = await advertiser.findOne({ userid: user._id });

      if (!Advertiser) {
        const firstName = user?.fullname?.split(" ")[0] || user?.fullname;
        const lastName = user?.fullname?.split(" ")[1];

        Advertiser = new advertiser({
          firstname: firstName,
          lastname: lastName || undefined,
          type: "Individual",
          email: user.email,
          phone: user.phone,
          address: user?.address?.streetaddress,
          image: user?.profilepic,
          city: user?.address?.city,
          state: user?.address?.state,
          password: decryptaes(user.passw),
          pincode: user?.address?.pincode,
          userid: user._id,
          advertiserid: generateUniqueID(),
        });

        const savedAdv = await Advertiser.save();

       
        await User.updateOne(
          { _id: user._id },
          { $set: { advertiserid: savedAdv._id, adid: savedAdv.advertiserid } }
        );
      }
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15d" }
    );

    const updatedUser = {
      ...Advertiser.toObject(),
      dp:
        process.env.URL +
        (user instanceof advertiser ? user.image : user.profilepic),
    };

    res.status(200).json({
      message: "Login successful",
      user: {
        firstName: Advertiser.firstname || user.fullname?.split(" ")[0],
        lastName: Advertiser.lastname || user.fullname?.split(" ")[1],
        email: user.email,
      },
      data: updatedUser,
      success: true,
      token,
      advertiserId: Advertiser._id,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success:false,message: "An error occurred during login." });
  }
};

const profile = async (req, res) => {
  const userId = req.user;

  try {
    let user;
    let mainuser =
      (await User.findById(userId)) || (await advertiser.findById(userId));

    if (mainuser instanceof advertiser) {
      user = mainuser;
    } else {
      user = await advertiser.findById(mainuser.advertiserid);
    }

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    const updatedUser = {
      ...user.toObject(),
      dp: process.env.URL + user.image,
    };

    return res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const updateUser = async (req, res) => {
  const userId = req.user;
  const { name, phone, location, country, taxid, business, region, postal } =
    req.body;

  try {
    const [firstname, ...lastnameParts] = name.split(" ");
    const lastname = lastnameParts.join(" ");

    const updateData = {
      firstname,
      lastname,
      phone,
      city: location,
      country,
      gst: taxid,
      address: business,
      state: region,
      pincode: postal,
    };

    const updatedUser = await advertiser.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await advertiser.findByIdAndUpdate(userId, {
      $push: {
        editcount: {
          date: new Date().toString(),
          number: 1,
        },
      },
    });

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const addClient = async (req, res) => {
  const { advertiserId } = req.params;
  const userId = req.user;

  try {
    const organization = await advertiser.findById(advertiserId);
    if (organization.type === "Individual") {
      return res
        .status(404)
        .json({ message: "Individuals cannot be added as agency" });
    }

    const userAdvertiser = await advertiser.findById(userId);
    if (userAdvertiser.type !== "Individual") {
      return res
        .status(404)
        .json({ message: "Only individuals can be added to agency" });
    }

    const isAlreadyClient = organization.clients.some(
      (client) =>
        client.clientadvertiserid.toString() === userAdvertiser._id.toString()
    );

    if (isAlreadyClient) {
      return res.status(400).json({
        message: "Your account is already a client of this organization",
      });
    }

    userAdvertiser.agencyDetails = {
      iscreatedbyagency: true,
      agencyuserid: organization.userid,
      agencyadvertiserid: organization._id,
      default: true,
    };

    await userAdvertiser.save();

    organization.clients.push({ clientadvertiserid: userAdvertiser._id });

    await organization.save();

    res.status(200).json({
      message:
        "You have successfully been added as a client of the organization",
      userAdvertiser,
      organization,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export { createAccount, login, profile, updateUser, addClient };
