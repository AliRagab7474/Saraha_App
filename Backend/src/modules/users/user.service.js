import {
  compareHash,
  createLoginCredentials,
  decodeToken,
  Decrypt,
  generateHash,
  verifyToken,
} from "../../common/security/index.js";
import { findOne } from "../../db/index.js";
import { UserModel } from "../../db/index.js";
import {
  ConflictException,
  NotFoundException,
} from "../../common/utils/index.js";
import { logoutEnum } from "../../common/enums/index.js";
import {
  allKeysByPrefix,
  deleteKey,
  set,
} from "../../common/services/index.js";

export const logout = async ({ flag }, user, { jti, iat, sub }) => {
  let status = 200;
  switch (flag) {
    case logoutEnum.ALL:
      user.ChangeCredentialsTime = new Date();
      await user.save();
      await deleteKey(await allKeysByPrefix(`RevokeToken::${sub}`));
      break;

    default:
      await set({
        key: `RevokeToken::${sub}::${jti}`,
        value: jti,
        ttl: iat + 31536000,
      });
      status = 201;
      break;
  }

  return status;
};

export const profileImage = async (file, user) => {
  user.ProfilePicture = file.finalPath;
  await user.save();
  return user;
};
export const coverImage = async (files, user) => {
  user.CoverPicture = files.map((file) => file.finalPath);
  await user.save();
  return user;
};

export const profile = async (user) => {
  return user;
};

export const shareProfile = async (userId) => {
  const user = await findOne({
    model: UserModel,
    filter: { _id: userId },
    select: "-password",
  });
  if (!user) {
    return NotFoundException({ message: "user not found" });
  }
  if (user.phone) {
    user.phone = await Decrypt(user.phone);
  }
  return user;
};

export const rotateToken = async (user, { sub, jti, iat }) => {
  if (iat * 1800 * 100 >= Date.now() + 30000) {
    return ConflictException({ message: "current access token still valid" });
  }
  await set({
    key: `RevokeToken::${sub}::${jti}`,
    value: jti,
    ttl: iat + 31536000,
  });
  return await createLoginCredentials(user);
};

export const updatePassword = async ({ oldPassword, password }, user) => {
  if (!(await compareHash(oldPassword, user.password))) {
    return ConflictException({ message: "wrong password" });
  }
  user.password = await generateHash(password);
  user.ChangeCredentialsTime = new Date();
  await user.save();
  await deleteKey(await allKeysByPrefix(`RevokeToken::${user._id}`));

  return await createLoginCredentials(user);
};
