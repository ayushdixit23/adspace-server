import mongoose from "mongoose";

const AdvertiserSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String},
  type: {
    type: String,
    default: "Individual",
    enum: ["Individual", "Organization", "Affiliator"],
  },
  profile: { 
    url: { type: String },
    name: { type: String }
  },
  email: { type: String, unique: true},
  phone: { type: String},
  organizationname: { type: String },
  pan: { type: String },
  panphoto: { type: String },
  gst: { type: String },
  gstphoto: { type: String },
  advertiserid:{type :String},
  agencyDetails: {
    iscreatedbyagency: { type: Boolean, default: false },
    agencyuserid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    agencyadvertiserid: { type: mongoose.Schema.Types.ObjectId, ref: "Advertiser" },
    default: { type: Boolean, default: false }
  },
  clientadvertiserid: [{ type: mongoose.Schema.Types.ObjectId, ref: "Advertiser" }],
  password: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  pincode: { type: Number },
  landmark: { type: String },
  ads: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ads" }],
  currentbalance: { type: Number, default: 0 },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "AdTransactions" }],
  popularity: { type: String },
  idstatus: { type: String, default: "active" },
  totalconversions: { type: String },
  amountspent: [{
    date: { type: Date, default: Date.now },
    amount: { type: Number },
    totalvisitors: { type: Number },
  }],
  verificationstatus: { type: String, default: "unverified" },
  image: { type: String },
  taxinfo: { type: String },
  editcount: [{
    date: { type: Date, default: Date.now },
    number: { type: Number, default: 0 },
  }],
  logs: [
    {
      login: { type: Date },
      logout: { type: Date },
    },
  ],
  bank: {
    accno: { type: String },
    ifsc: { type: String },
    name: { type: String },
  },
  moneyearned: { type: Number, default: 0 },
  earningtype: [{ how: { type: String }, when: { type: Number } }],
  userid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  totalspent: [{
    date: { type: Date, default: Date.now },
    amount: { type: Number, default: 0 }
  }],
  message: [{ type: String }],
}, { timestamps: true });

AdvertiserSchema.index({ title: "text" });

export default mongoose.model("Advertiser", AdvertiserSchema);
