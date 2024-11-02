import { Kafka } from "kafkajs";
import mongoose from "mongoose";
import adStats from "../models/adStats.js";

const kafka = new Kafka({
  brokers: ['localhost:9092'],
});

const createKafkaTopics = async (topics) => {
  const admin = kafka.admin();
  await admin.connect();

  try {
    await admin.createTopics({
      topics: topics.map((topic) => ({
        topic: topic.name,
        numPartitions: topic.partitions || 1,
        replicationFactor: topic.replicationFactor || 1,
      })),
      waitForLeaders: true,
    });

    console.log("Topics created successfully:", topics.map((topic) => topic.name));
  } catch (error) {
    console.error("Error creating topics:", error);
  } finally {
    await admin.disconnect();
  }
};

const adViewsConsumer = kafka.consumer({ groupId: 'ad-views-consumer-group' });
const adClicksConsumer = kafka.consumer({ groupId: 'ad-clicks-consumer-group' });
const adImpressionsConsumer = kafka.consumer({ groupId: 'ad-impressions-consumer-group' });

const findAdStats = async (adId) => {
  return adStats.findOne({ adId });
};

const runAdViewsConsumer = async () => {
  await adViewsConsumer.connect();
  await adViewsConsumer.subscribe({ topic: 'ad-views', fromBeginning: true });

  const adViewsBatch = [];
  const BATCH_SIZE = 10; 

  await adViewsConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { adId, userId, timestamp } = JSON.parse(message.value.toString());
      console.log(`Ad view received. Ad ID: ${adId}, User ID: ${userId}, Timestamp: ${timestamp}`);

      adViewsBatch.push({ adId, userId });

      if (adViewsBatch.length >= BATCH_SIZE) {
        console.log(`Processing ${adViewsBatch.length} ad views...`);
        
        await processAdViewsBatch(adViewsBatch);
        adViewsBatch.length = 0; 
      }
    },
  });
};

const processAdViewsBatch = async (batch) => {
  for (const { adId, userId } of batch) {
    const adStatsDoc = await findAdStats(adId);
    if (adStatsDoc) {
      adStatsDoc.views.push({ userId });
      await adStatsDoc.save();
    } else {
      console.error(`No AdStats found for Ad ID: ${adId}`);
    }
  }
};

const runAdClicksConsumer = async () => {
  await adClicksConsumer.connect();
  await adClicksConsumer.subscribe({ topic: 'ad-clicks', fromBeginning: true });

  const adClicksBatch = [];
  const BATCH_SIZE = 10;

  await adClicksConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { adId, location = "unknown", timestamp } = JSON.parse(message.value.toString());
      console.log(`Ad click received. Ad ID: ${adId}, Timestamp: ${timestamp}`);

      adClicksBatch.push({ adId, location, timestamp });

      if (adClicksBatch.length >= BATCH_SIZE) {
        console.log(`Processing ${adClicksBatch.length} ad clicks...`);
        await processAdClicksBatch(adClicksBatch);
        adClicksBatch.length = 0;
      }
    },
  });
};

const processAdClicksBatch = async (batch) => {
  for (const { adId, location, timestamp } of batch) {
    const adStatsDoc = await findAdStats(adId);
    if (adStatsDoc) {
      adStatsDoc.clicks.push({ location, timestamp });
      await adStatsDoc.save();
    } else {
      console.error(`No AdStats found for Ad ID: ${adId}`);
    }
  }
};

const runAdImpressionsConsumer = async () => {
  await adImpressionsConsumer.connect();
  await adImpressionsConsumer.subscribe({ topic: 'ad-impressions', fromBeginning: true });

  const adImpressionsBatch = [];
  const BATCH_SIZE = 10;

  await adImpressionsConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { adId, location = "unknown", timestamp } = JSON.parse(message.value.toString());
      adImpressionsBatch.push({ adId, location, timestamp });

      if (adImpressionsBatch.length >= BATCH_SIZE) {
        console.log(`Processing ${adImpressionsBatch.length} ad impressions...`);
        await processAdImpressionsBatch(adImpressionsBatch);
        adImpressionsBatch.length = 0;
      }
    },
  });
};

const processAdImpressionsBatch = async (batch) => {
  for (const { adId, location, timestamp } of batch) {
    const adStatsDoc = await findAdStats(adId);
    if (adStatsDoc) {
      adStatsDoc.impressions.push({ location, timestamp });
      await adStatsDoc.save();
    } else {
      console.error(`No AdStats found for Ad ID: ${adId}`);
    }
  }
};

// Exporting the necessary functions
export { kafka, createKafkaTopics, runAdViewsConsumer, runAdClicksConsumer, runAdImpressionsConsumer };
