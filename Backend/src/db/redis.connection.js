import {createClient} from 'redis'
import { REDIS_URI } from '../../config/config.service.js'

export const redisClient = createClient({
    url:REDIS_URI
}) 

export const redisConnection = async()=>{
    try {
        redisClient.connect()
        console.log(`redis connected successfully`);
    } catch (error) {
        console.log(`fail to connect to redis db`);
    }
}