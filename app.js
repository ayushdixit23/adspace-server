import express from "express";
import userRouter from "./routes/user.js";
import cors from "cors";
import { connectDB } from "./utils/features.js";
import adsRouter from "./routes/ads.js";
import "dotenv/config";
import cookieParser from "cookie-parser";
import {
  runAdViewsConsumer,
  runAdClicksConsumer,
  runAdImpressionsConsumer,
  createKafkaTopics,
} from "./utils/kafka.js";
import transactionRoute from "./routes/transaction.js";
import morgan from "morgan";

const app = express();
const port = 5001;

connectDB(process.env.PRODDB)

const topicsToCreate = [
  { name: "ad-views", partitions: 3, replicationFactor: 1 },
  { name: "ad-clicks", partitions: 2, replicationFactor: 1 },
  { name: "ad-impressions", partitions: 1, replicationFactor: 1 },
];

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "https://ads.grovyo.com",
];

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://ads.grovyo.com");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

await createKafkaTopics(topicsToCreate);

runAdViewsConsumer();
runAdClicksConsumer();
runAdImpressionsConsumer();

app.use("/api/v1/user", userRouter);
app.use("/api/v1/ads", adsRouter);
app.use("/api/v1/transactions", transactionRoute);

app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});

