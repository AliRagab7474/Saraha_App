import {
  fileValidationField,
  generalValidationFields,
} from "../../common/utils/index.js";
import joi from "joi";

export const shareProfile = {
  params: joi
    .object()
    .keys({
      userId: generalValidationFields.id.required(),
    })
    .required(),
};

export const profilePicture = {
  file: generalValidationFields.file(fileValidationField.image).required(),
};

export const coverPicture = {
  files: joi
    .array()
    .items(generalValidationFields.file(fileValidationField.image).required())
    .required()
    .min(1)
    .max(5)
    .required(),
};

export const updatePassword = {
body:joi.object().keys({
  oldPassword:generalValidationFields.password.required(),
  password:generalValidationFields.password.not(joi.ref("oldPassword")).required(),
  confirmPassword:generalValidationFields.confirmPassword("password").required()
}).required()

}
