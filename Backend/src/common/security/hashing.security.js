import { hash,compare } from 'bcrypt'
import { Salt_Round } from '../../../config/config.service.js'
import { NotFoundException } from '../utils/index.js'

export const generateHash = async (plainText , salt=Salt_Round)=>{
    const cipherText = await hash(plainText,salt)
    return cipherText
}

export const compareHash = async(plainText,cipherText)=>{
let match = await compare(plainText,cipherText)
if (!match) {
    throw NotFoundException({message:"wrong credentials"})
}
return match
}