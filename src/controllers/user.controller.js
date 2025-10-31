import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utils/fileUpload.js'
import { ApiResponse } from '../utils/apiResponse.js'

const registerUser = asyncHandler(async(req,res) => {
    /*
        1.url hit means request bheja 
        2.before passing to server and db we need to varify
        3.Then take the meta deta or data from  user 
        4.then pass it to server where according to our model send to database 
        5.after database added server sent a response to user that you are now registered.

        hitesh sir : 
        1.get user details from frontend
        2.validation - not empty
        3.check if user already registered or not : username,email
        4.check for images , check for avatar
        5.upload them to cloudinary , avatar
        6.create user object - create entry in db
        7.remove pwd and refresh token field from response
        8.check for user creation
        9.retrun res
    */ 
    const {fullname, email, username, password} = req.body
    console.log(req.body)
    // validation
    if(
        [fullname,email,username,password].some((field)=>(field?.trim() === ""))
    ){
        throw new ApiError(400,"all fields are required")
    } 
    // already exist
    const existedUser = User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){throw new ApiError(409,"already existed user")}
    // check image, avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0].path;

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar is required")
    }
    // upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,'avatar is required')
    }
    // create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    // remove pwd and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // check for user creation
    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering user")
    }
    // return response
    return res.status(201).json(
        new ApiResponse(200,createdUser, "User registered successfully")
    ) 

}) 

export {registerUser};