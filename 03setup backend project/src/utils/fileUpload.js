import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary = async (localFilePath) => {
    try {

        if (!localFilePath) return null

        //upload
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        //file has been upload successful
        // console.log("File is uploaded on cloudinary", response.url)

        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {

        fs.unlinkSync(localFilePath) // remove local save temp file as the opration failed.

    }
}

export {uploadOnCloudinary}