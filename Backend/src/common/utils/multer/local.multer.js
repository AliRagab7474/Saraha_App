import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import {resolve} from 'node:path'
import { fileFilter } from './validation.multer.js'

export const fileUpload = ({customPath = "general",validation=[],maxSize = 5}={})=>{
    const fullPath = resolve(`../uploads/${customPath}`)
    if (!existsSync(fullPath)) {
        mkdirSync(fullPath ,{recursive:true})
    }
    const storage = multer.diskStorage({
    
        destination: function(req , file , cb){
            cb(null , fullPath)
        },
        filename:function(req,file,cb){
            const uniqueName = randomUUID() + "_" + file.originalname
            file.finalPath = `/uploads/${customPath}/${uniqueName}`
            cb(null,uniqueName)
        }
    }) 
    return multer({fileFilter:fileFilter(validation),storage,limits:{fileSize:maxSize*1024*1024}})
}