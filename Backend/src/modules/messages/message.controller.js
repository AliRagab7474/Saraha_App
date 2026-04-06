import { Router } from "express";
import {
  BadRequestException,
  fileUpload,
  fileValidationField,
  successesResponse,
} from "../../common/utils/index.js";
import { deleteMessage, getAllMessages, getMessage, sendMessage } from "./message.service.js";
import * as validators from "./message.validation.js";
import { authentication, validation } from "../../middleware/index.js";
import { decodeToken } from "../../common/security/index.js";
import { tokenTypeEnum } from "../../common/enums/index.js";

const router = Router({caseSensitive:true});

router.post(
  "/:receiverID",
  async (req, res, next) => {
    if (req.headers.authorization) {
      const { user, decode } = await decodeToken({
        token: req.headers.authorization.split(" ")[1] ,
        tokenType:tokenTypeEnum.ACCESS,
      });
      req.user = user;
      req.decode = decode;
    }
    next();
  },
  fileUpload({
    validation: fileValidationField.image,
    customPath: "Messages",
    maxSize: 1,
  }).array("attachments"),
  validation(validators.sendMessage),
  async (req, res, next) => {
    if (!req.body?.content && !req.files?.length) {
      return BadRequestException({
        message: "content of message is required",
        extra: { key: "body", path: ["content"], message: "missing content" },
      });
    }
    const message = await sendMessage(
      req.params.receiverID,
      req.body,
      req.files,
      req.user
    );
    return successesResponse({
      res,
      message: "message sent",
      status: 201,
      data: { message },
    });
  },
);

router.get(
  "/:messageId",
 authentication(),
  validation(validators.getMessage),
  async (req, res, next) => {
 const message = await getMessage(
      req.params.messageId,
      req.user
    );
    return successesResponse({
      res,
      data: { message },
    });
  },
);

router.get(
  "/AllMessages",
 authentication(),
  async (req, res, next) => {
 const message = await getAllMessages(
      req.user
    );
    return successesResponse({
      res,
      data: { message },
    });
  },
);

router.delete(
  "/:messageId",
 authentication(),
  async (req, res, next) => {
 const message = await deleteMessage(
      req.params.messageId,
      req.user
    );
    return successesResponse({
      res,
      data: { message },
    });
  },
);

export default router;
