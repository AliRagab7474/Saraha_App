import express from "express";
import { resolve } from "node:path";
import { authRouter, MessageRouter, userRouter } from "./modules/index.js";
import { authenticateDB, redisClient, redisConnection } from "./db/index.js";
import { globalErrorHandling } from "./common/utils/index.js";
import cors from "cors";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import axios from "axios";
import geoip from 'geoip-lite'
import morgan from 'morgan'

const app = express();
const port = 3000;

const bootstrap = async () => {

  const fromWhere = async (ip) => {
    try {
      const response = await axios.get(`https://ipapi.co/${ip}/json`);
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.log("Geo-IP lookup failed for IP:", ip, "Error:", error.message);
      return {};
    }
  };

  const limiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    limit: async function (req) {
     const {country} = geoip.lookup(req.ip);
     return country === "EG" ?5:3
    },
    // skipSuccessfulRequests: true,
    standardHeaders: "draft-6",
    requestPropertyName: "ratelimit",
    handler: function (req, res, next) {
      return res
        .status(429)
        .json({ message: "too many request ! try again later" });
    },
    keyGenerator: (req, res, next) => {
      const ip = ipKeyGenerator(req.ip);
      console.log(`${ip}-${req.path}`);
      return `${ip}-${req.path}`;
    },
    store: {
    async incr(key, cb) { // get called by keyGenerator
      try {
        const count = await redisClient.incr(key);
        if (count === 1) await redisClient.expire(key, 120); // 2 min TTL
        cb(null, count);
      } catch (err) {
        cb(err);
      }
    },
 
    async decrement(key) {  // called by kipFailedRequests:true ,  skipSuccessfulRequests:true,
      await redisClient.decr(key);
    },
  },
  });

  //global middleware
  app.set("trust proxy", true);
  app.use(cors(), express.json(), helmet());
  app.use(morgan('combined'))
  app.use("/uploads", express.static(resolve("../uploads")));

  //DB connection
  await authenticateDB();
  await redisConnection();

  //global routing
  app.get("/", (req, res, next) => {
    return res.json({ message: "landing page" });
  });

  //routing
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/message", MessageRouter);

  //global error handling
  app.use(globalErrorHandling);

  //dummy routing
  app.get("/{*path}", (req, res, next) => {
    return res.status(404).json({ message: "invalid routing" });
  });

  //listener
  app.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });
};

export default bootstrap;
