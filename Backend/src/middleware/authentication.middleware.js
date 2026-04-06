import { tokenTypeEnum } from "../common/enums/index.js";
import { decodeToken } from "../common/security/index.js";
import { BadRequestException, UnauthorizedException } from "../common/utils/index.js";
import {login} from '../modules/auth/auth.service.js'

export const authentication = (tokenType = tokenTypeEnum.ACCESS) => {
  return async (req, res, next) => {
    const [ schema, credentials ] = req.headers?.authorization?.split(" ") || [];
      
    if (!schema || !credentials) {
      throw UnauthorizedException({
        message: "missing authentication or missing approach",
      });
    }

    switch (schema) {
    case "Basic":
        const [email , password ] = Buffer.from(credentials,"base64").toString().split(":")
       console.log({email,password});
            break;
            
      default:
        const {user,decode} = await decodeToken({
          token: credentials,
          tokenType,
        });
        req.user = user
        req.decode = decode
        break;
    }
    next();
  };
};

export const authorization = (accessRoles = []) => {
  return async (req, res, next) => {
    if (!accessRoles.includes(req.user.role)) {
        throw UnauthorizedException({message:"missing authorization"})
    }
    next();
  };
};
