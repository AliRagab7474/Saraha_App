import { redisClient } from "../../db/redis.connection.js";

export const set = async ({key, value, ttl} = {}) => {
    try {
        const data =
            typeof value === "string" ? value : JSON.stringify(value);

        if (ttl) {
            // ttl by seconds
            await redisClient.setEx(key, ttl, data);
        } else {
            await redisClient.set(key, data);
        }

        return true;
    } catch (error) {
        console.error("Redis SET error:", error);
        return false;
    }
}

export const get = async (key) => {
    try {
        const data = await redisClient.get(key);
        if (!data) return null;

        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    } catch (error) {
        console.error("Redis GET error:", error);
        return null;
    }
}

export const update = async ({key, value, ttl} = {}) => {
    try {
        const exists = await redisClient.exists(key);
        if (!exists) return false;
        return await redisClient.set(key, value, ttl);
    } catch (error) {
        console.error("Redis UPDATE error:", error);
        return false;
    }
}

export const deleteKey = async (key) => {
    try {
        // handle both a single key and an array of keys
        if (Array.isArray(key)) {
            if (key.length === 0) return false;
            const result = await redisClient.del(key);
            return result >= 1;
        }
        const result = await redisClient.del(key);
        return result === 1;
    } catch (error) {
        console.error("Redis DELETE error:", error);
        return false;
    }
}

export const incr = async (key) => {
    try {
        return await redisClient.incr(key);
    } catch (error) {
        console.error("Redis incr error:", error);
        return false;
    }
}

export const expire = async ({key, ttl}={}) => {
    try {
        const result = await redisClient.expire(key, ttl);
        return result === 1;
    } catch (error) {
        console.error("Redis EXPIRE error:", error);
        return false;
    }
}

export const ttl = async (key) => {
    try {
        return await redisClient.ttl(key);
    } catch (error) {
        console.error("Redis TTL error:", error);
        return -2;
    }
}

export const allKeysByPrefix = async (baseKey) => {
    return await redisClient.keys(`${baseKey}*`);
}

