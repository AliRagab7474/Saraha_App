import {
  compareHash,
  createLoginCredentials,
  createNumberOtp,
  Encrypt,
  generateHash,
} from "../../common/security/index.js";
import {
  allKeysByPrefix,
  deleteKey,
  get,
  incr,
  set,
  ttl,
} from "../../common/services/redis.service.js";
import {
  blockedOtpKey,
  emailEvent,
  emailTemplate,
  maxTrialKey,
  otpKey,
} from "../../common/utils/email/index.js";
import { sendEmail } from "../../common/utils/index.js";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../common/utils/response/index.js";
import { create, findOne, updateOne, UserModel } from "../../db/index.js";
import { emailEnum, ProviderEnum } from "../../common/enums/index.js";


const sendEmailOTP = async ({ email, subject, title }) => {
  const isBlockedTTL = await ttl(blockedOtpKey({ email, subject }));
  if (isBlockedTTL > 0) {
    return BadRequestException({
      message: `can not resend another otp until unblock after (${isBlockedTTL}) sec`,
    });
  }

  const remainingTime = await ttl(otpKey({ email, subject }));
  if (remainingTime > 0) {
    return BadRequestException({
      message: `can not resend another otp until the old otp expires after (${remainingTime}) sec`,
    });
  }

  const maxTrial = await get(maxTrialKey({ email, subject }));
  console.log(maxTrial);

  if (maxTrial >= 2) {
    await set({
      key: blockedOtpKey({ email, subject }),
      value: 1,
      ttl: 5 * 60,
    });
  }

  const code = createNumberOtp();
  await set({
    key: otpKey({ email, subject }),
    value: await generateHash(code.toString()),
    ttl: 120,
  });

  emailEvent.emit("SendEmail", async () => {
    await sendEmail({
      to: email,
      subject: subject,
      html: emailTemplate({ code, title }),
    });

    await incr(maxTrialKey({ email, subject }));
  });
};

export const signup = async (data) => {
  const { fullName, email, password, phone, gender } = data;
  const checkEmail = await findOne({
    model: UserModel,
    filter: { email },
  });
  if (checkEmail) {
    throw ConflictException();
  }

  const user = await create({
    model: UserModel,
    data: {
      fullName,
      email,
      password: await generateHash(password),
      phone: await Encrypt(phone),
      gender,
    },
  });

  const code = createNumberOtp();
  await set({
    key: otpKey({ email ,subject:emailEnum.ConfirmEmail}),
    value: await generateHash(code.toString()),
    ttl: 120,
  });

  await sendEmail({
    to: email,
    subject: "Confirm Email",
    html: emailTemplate({ code, title: "Confirm Email" }),
  });
  return user;
};


export const confirmEmail = async (data) => {
  const { email, otp } = data;

  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: false },
      provider: ProviderEnum.System,
    },
  });
  if (!account) {
    throw NotFoundException({ message: "email not found" });
  }

  const hashedOtp = await get(otpKey({ email ,subject:emailEnum.ConfirmEmail}));
  if (!hashedOtp) {
    return NotFoundException({ message: "Invalid otp" });
  }

  if (!(await compareHash(otp, hashedOtp))) {
    return ConflictException({ message: "otp doesn't match" });
  }

  account.confirmEmail = new Date();
  await account.save();

  await deleteKey(await allKeysByPrefix(otpKey({ email ,subject:emailEnum.ConfirmEmail})));

  return;
};

export const resendOTP = async (data) => {
  const { email } = data;
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: false },
      provider: ProviderEnum.System,
    },
  });
  if (!account) {
    throw NotFoundException({ message: "email not found" });
  }

  await sendEmailOTP({
    email,
    subject: emailEnum.ConfirmEmail,
    title: "Verify Email",
  });

  return;
};

export const forgotPasswordOtp = async (data) => {
  const { email } = data;
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: false },
      provider: ProviderEnum.System,
    },
  });
  if (!account) {
    throw NotFoundException({ message: "email not found" });
  }

  await sendEmailOTP({
    email,
    subject: emailEnum.ForgotPassword,
    title: "Reset Password",
  });

  return;
};

export const verifyForgotPasswordOtp = async (data) => {
  const {email,otp} =data

  const hashedOtp = await get(otpKey({email,subject:emailEnum.ForgotPassword}))
  if (!hashedOtp) {
    return NotFoundException({message:"Expired otp"})
  }
  if (!await compareHash(otp,hashedOtp)) {
    return ConflictException({message:"Invalid otp"})
  }

  return;
};

export const resetPasswordOtp = async (data) => {

const {email,password,otp} = data
const user = await updateOne({
  model:UserModel,
  filter:{
      email,
      confirmEmail: { $exists: false },
      provider: ProviderEnum.System,
  },
  update:{
    password:await generateHash(password),
    ChangeCredentialsTime:new Date()
  }
})

if (!user.matchedCount) {
  return NotFoundException({message:"user not found"})
}

await deleteKey(await allKeysByPrefix(`RevokeToken::${user._id}`))
await deleteKey(await allKeysByPrefix(otpKey({email,subject:emailEnum.ForgotPassword})))

  return;
};

export const login = async (data, issuer) => {
  const { email, password } = data;
  const user = await findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      provider: ProviderEnum.System,
    },
  });
  if (!user) {
    return NotFoundException({ message: "user not signed up" });
  }
  const verifyPassword = await compareHash(password, user.password);
  if (!verifyPassword) {
    throw NotFoundException({ message: "wrong credentials" });
  }
  return await createLoginCredentials(user);
};
