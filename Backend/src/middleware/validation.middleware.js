import { BadRequestException } from "../common/utils/response/error.response.js";

export const validation = (schema) => {
  return async (req, res, next) => {

    let errors = []
     for (const key of Object.keys(schema)) {
         const validateResult = schema[key].validate(req[key],{abortEarly:false})
    if (validateResult.error) {
       errors.push({key , details:validateResult.error.details})
    }
    }
    if (errors.length) {
        throw BadRequestException({message:"validation error",extra : errors})
    }
   
    next()
  };
};
