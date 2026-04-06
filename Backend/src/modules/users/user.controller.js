import { Router } from "express";
import { successesResponse } from "../../common/utils/index.js";
import { coverImage, logout, profile, profileImage, rotateToken, shareProfile, updatePassword } from "./user.service.js";
import { authentication, authorization, validation } from "../../middleware/index.js";
import { tokenTypeEnum } from "../../common/enums/index.js";
import { roleEnum } from "../../common/enums/index.js";
import * as validators from './user.validation.js' 
import { fileUpload, fileValidationField } from "../../common/utils/index.js";

const router = Router();

router.post("/logout",authentication(),async(req,res,next)=>{
  const status = await logout(req.body,req.user,req.decode)
return successesResponse({res,status,message:'done logout'})
})

router.patch("/profile-image",authentication(),fileUpload({customPath : "users/profile-images",validation:fileValidationField.image}).single("attachment"),validation(validators.profilePicture),async(req,res,next)=>{
    const account = await profileImage(req.file,req.user)
  return successesResponse({res,data:account})
})

router.patch("/profile-cover-image",authentication(),fileUpload({customPath : "users/cover-images",validation:fileValidationField.image}).array("attachments"),validation(validators.coverPicture),async(req,res,next)=>{
    const account = await coverImage(req.files,req.user)
  return successesResponse({res,data:account})
})

router.patch("/updatePassword", authentication(),authorization([roleEnum.User]),validation(validators.updatePassword) ,async(req, res, next) => {
  const result =await updatePassword(req.body,req.user);
  return successesResponse({res,message:"password updated",data:result})
});
router.get("/profile", authentication(),authorization([roleEnum.User]) ,async(req, res, next) => {
  const result =await profile(req.user);
  return successesResponse({res,data:result})
});

router.get("/:userId/shared-profile",validation(validators.shareProfile),async(req, res, next) => {
  const result =await shareProfile(req.params.userId);
  return successesResponse({res,data:result})
});


router.get("/rotate-token", authentication(tokenTypeEnum.REFRESH) ,async(req, res, next) => {

    const result = await rotateToken(req.user , req.decode)
  return successesResponse({res,data:result})
});

export default router
