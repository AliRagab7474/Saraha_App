import mongoose from "mongoose";
import { DB_URI } from "../../config/config.service.js";
import {UserModel} from "./models/index.js";

export const authenticateDB = async () => {
    try {
        const databaseConnection = await mongoose.connect(DB_URI);
        console.log(`database connected `);
       await UserModel.syncIndexes()
    } catch (error) {
        console.log(`failed to connect on db ${error}`);
    }
};