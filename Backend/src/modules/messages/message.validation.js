import joi from "joi";
import { fileValidationField, generalValidationFields } from "../../common/utils/index.js";

export const sendMessage = {
    params:joi.object().keys({
        receiverID:generalValidationFields.id.required()
    }).required(),
    body:joi.object().keys({
        content:joi.string().min(1).max(10000),
        files:joi.array().items(generalValidationFields.file(fileValidationField.image)).min(0).max(5)
    })
}
export const getMessage = {
    params:joi.object().keys({
        messageId:generalValidationFields.id.required()
    }).required()
}