import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import Advertiser from '../models/advertiser.js';

const isAuthenticated = async (req, res, next) => {

  console.log(req.cookies)
  const token = req.cookies.auth;

  if (!token) {
    return res.status(401).json({ success: false, message: "Please Login to access this resource" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    let user = await Advertiser.findById(decoded.userId);
    
    if (!user) {
      user = await User.findById(decoded.userId);    
    }

    if(!user) {
      return res.status(401).json({ success: false, message: "User not found. Please Login to access this resource" });
    }
    
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found. Please Login to access this resource" });
    }
    req.user = decoded.userId;
    next();
    
  } catch (error) {
    console.log(error);
    
    return res.status(401).json({ success: false, message: "Invalid token. Please Login again." });
  }
};

export { isAuthenticated };
