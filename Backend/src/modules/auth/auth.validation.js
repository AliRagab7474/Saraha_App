import joi from "joi";
import { generalValidationFields } from "../../common/utils/index.js";

export const login = {
  body: joi.object().keys({
    email: generalValidationFields.email.required(),
    password: generalValidationFields.password.required(),
  }),
};

export const signup = {
  body: login.body.append().keys({
    fullName: generalValidationFields.fullName.required(),
    phone: generalValidationFields.phone.required(),
    confirmPassword: generalValidationFields
      .confirmPassword("password")
      .required(),
    age: generalValidationFields.age.required(),
    gender: generalValidationFields.gender.required(),
  }),
};

export const resendConfirmEmail = {
  body: joi.object().keys({
    email: generalValidationFields.email.required(),
  }),
};

export const confirmEmail = {
  body: resendConfirmEmail.body.append({
    otp: generalValidationFields.otp.required(),
  }),
};

export const resetPassword = {
  body: resendConfirmEmail.body.append({
    password: generalValidationFields.password.required(),
    confirmPassword: generalValidationFields
      .confirmPassword("password")
      .required(),
  }),
};
