import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

// // Return "https" URLs by setting secure: true
// cloudinary.config({
//   secure: true
// });
cloudinary.config(process.env.CLOUDINARY_URL)

const uploadOnCloudinary = async(localFilePath) => {
    try{
        if(!localFilePath) return null;
        // upload the file on cloudinary 
        const response = await cloudinary.uploader.upload(localFilePath, {resource_type:'auto'})
        // file has been uploaded successfully 
        console.log("file is uploaded on cloudinary\n",response.url) 
        return response;
    }catch(error){
        console.log("ERROR: ",error)
        // remove locally saved file as the upload operation failed
        fs.unlinkSync(localFilePath)
    }
}

export {uploadOnCloudinary};