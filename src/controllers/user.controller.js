import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utils/fileUpload.js'
import { ApiResponse } from '../utils/apiResponse.js'
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken,refreshToken};
    } catch (error) {
        throw new ApiError(500,"Something Went Wrong While generating tokens")
    }
}

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
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){throw new ApiError(409,"already existed user")}
    // check image, avatar 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0].path;
    let coverImageLocalPath;
    if(req.files?.coverImage){
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }else{
        coverImageLocalPath = "";
    }

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

const logInUser = asyncHandler(async(req,res)=>{
    /*
     * req body get user data
     * server connect the db check the details
     * if same data is existed then create a session 
     
     Hitesh sir : 
     1. req body -> data
     2.username or email check
     3. find user 
     4. pwd check 
     5.access token & refresh token 
     6.send it in cookie format
     7.send response
     */
    const {email ,username, password} = req.body
    if(!(username || email)){
        throw new ApiError(400,"username is required")
    }
    const user = await User.findOne({
        $or: [{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"user doesn't exist")
    }

    const isPwdValid = await user.isPasswordCorrect(password)
    if(!isPwdValid){
        throw new ApiError(401,"invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    
    // cookies design
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: user,accessToken,refreshToken
            },
            "User Logged in Successfully"
        )
    )

})

const logOutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"successfully Logged out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

    // verify token
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
        
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh Token is Expired")
        }
        // if matches
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        const options = {
            httpOnly: true,
            secure: true,
        }
    
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken,newRefreshToken},
                "access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message||"invalid refresh token")
    }
})
export {registerUser,logInUser,logOutUser, refreshAccessToken};