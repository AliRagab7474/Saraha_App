import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  ADMIN_ACCESS_TOKEN_SECRET_KEY,
  ADMIN_REFRESH_TOKEN_SECRET_KEY,
  USER_ACCESS_TOKEN_SECRET_KEY,
  USER_REFRESH_TOKEN_SECRET_KEY,
} from "../../../config/config.service.js";
import { roleEnum, tokenTypeEnum } from "../enums/index.js";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/index.js";
import { findOne, UserModel } from "../../db/index.js";
import { get } from "../services/index.js";

export const generateToken = async ({
  payload = {},
  secret = USER_ACCESS_TOKEN_SECRET_KEY,
  options,
} = {}) => {
  return jwt.sign(payload, secret, options);
};

export const verifyToken = async ({
  token = {},
  secret = USER_ACCESS_TOKEN_SECRET_KEY,
} = {}) => {
  return jwt.verify(token, secret);
};

export const roleSIG = async (role = roleEnum.User) => {
  let signature = { accessSignature: undefined, refreshSignature: undefined };
  switch (role) {
    case roleEnum.Admin:
      signature = {
        accessSignature: ADMIN_ACCESS_TOKEN_SECRET_KEY,
        refreshSignature: ADMIN_REFRESH_TOKEN_SECRET_KEY,
      };
      break;

    default:
      signature = {
        accessSignature: USER_ACCESS_TOKEN_SECRET_KEY,
        refreshSignature: USER_REFRESH_TOKEN_SECRET_KEY,
      };
      break;
  }

  return signature;
};

export const tokenSIG = async (tokenType = tokenTypeEnum.ACCESS, role) => {
  let { accessSignature, refreshSignature } = await roleSIG(role);
  let signature = undefined;
  switch (tokenType) {
    case tokenTypeEnum.ACCESS:
      signature = accessSignature;
      break;

    default:
      signature = refreshSignature;
      break;
  }
  return signature;
};

export const decodeToken = async ({
  token,
  tokenType = tokenTypeEnum.ACCESS,
} = {}) => {
  const decode = jwt.decode(token);

  if (!decode?.aud?.length) {
    return BadRequestException({ message: "Missing audience" });
  }

  const [tokenApproach, role] = decode.aud || [];

  if (tokenType !== tokenApproach) {
    return ConflictException({ message: "unexpected token mechanism" });
  }

  if (decode.jti && await get(`RevokeToken::${decode.sub}::${decode.jti}`)) {
    return UnauthorizedException({message:"Invalid login session"})
  }

  let signature = await tokenSIG(tokenApproach, role);

  const verifyData = await verifyToken({ token, secret: signature });
  const user = await findOne({
    model: UserModel,
    filter: { _id: verifyData.sub },
  });
  if (!user) {
    return NotFoundException({ message: "user not found" });
  }

  if (
    user.ChangeCredentialsTime &&
    user.ChangeCredentialsTime.getTime() >= decode.iat * 1000
  ) {
    return BadRequestException({ message: "invalid login session" });
  }

  return {user,decode};
};

export const createLoginCredentials = async (user) => {
  let { accessSignature, refreshSignature } = await roleSIG(user.role);

  const access_token = await generateToken({
    payload: { sub: user.id },
    secret: accessSignature,
    options: {
      audience: [tokenTypeEnum.ACCESS, user.role],
      expiresIn: 1800,
      jwtid: crypto.randomUUID(),
    },
  });

  const refresh_token = await generateToken({
    payload: { sub: user.id },
    secret: refreshSignature,
    options: {
      audience: [tokenTypeEnum.REFRESH, user.role],
      expiresIn: 31536000,
      jwtid: crypto.randomUUID(),
    },
  });

  return { access_token, refresh_token };
};
