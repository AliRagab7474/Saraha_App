import { Router } from "express";
import {signup,login, confirmEmail, resendOTP, forgotPasswordOtp, verifyForgotPasswordOtp, resetPasswordOtp} from "./auth.service.js";
import { successesResponse } from "../../common/utils/index.js";
import * as validators from './auth.validation.js'
import { validation } from "../../middleware/index.js";
import geoip from 'geoip-lite'
import { ipKeyGenerator } from "express-rate-limit";
import { redisClient } from "../../db/redis.connection.js";
import rateLimit from "express-rate-limit";
import { deleteKey } from "../../common/services/redis.service.js";

const router = Router();

router.post("/signup", validation(validators.signup),async (req, res, next) => {
  const result = await signup(req.body);
  return successesResponse({res,data:result})
});

router.patch("/confirm-email", validation(validators.confirmEmail),async (req, res, next) => {
  const result = await confirmEmail(req.body);
  return successesResponse({res,message:"Email confirmed you can login"})
});

router.patch("/resend-confirm-email", validation(validators.resendConfirmEmail),async (req, res, next) => {
  const result = await resendOTP(req.body);
  return successesResponse({res,message:"otp sent"})
});
router.post("/forgot-password-email", validation(validators.resendConfirmEmail),async (req, res, next) => {
  const result = await forgotPasswordOtp(req.body);
  return successesResponse({res,message:"otp sent"})
});
router.patch("/verify-forgot-password-email", validation(validators.confirmEmail),async (req, res, next) => {
  const result = await verifyForgotPasswordOtp(req.body);
  return successesResponse({res,message:"otp confirmed"})
});
router.patch("/reset-password-email", validation(validators.resetPassword),async (req, res, next) => {
  const result = await resetPasswordOtp(req.body);
  return successesResponse({res,message:"password has been reset"})
});


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


router.get("/login", validation(validators.login),limiter,async(req, res, next) => {
  const result =await login(req.body);
  await deleteKey(`${req.ip}-${req.path}`)
  return successesResponse({res,data:{...result}})
});

export default router
