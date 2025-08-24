import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/fileUpload.js"
import { ApiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

//token generation function
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

// register user controller
const registerUser = asyncHandler(async (req, res) => {
    const { username, fullName, email, password } = req.body;

    if ([username, fullName, email, password].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required!");
    }

    if (!email.includes("@")) {
        throw new ApiError(400, "Email must contain @");
    }

    const existUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existUser) {
        throw new ApiError(409, "User with email or username already exists!");
    }

    // ✅ Use req.files (from multer)
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverimage?.[0]?.path; // note: match Postman key

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required!");
    }

    // Upload to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : null;

    const user = await User.create({
        fullName,
        avatar: avatar?.url || "",
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user!");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

// login user controller
const loginUser = asyncHandler(async (req, res) => {

    // req body - data,
    // username or email,
    // find the user,
    // if user not found, throw error
    // if user found, check password,
    // if password not match, throw error
    // if password match, generate access token and refresh token,
    // send response with user data, access token and refresh token

    const { email, username, password } = req.body

    if (!email && !username) {
        throw new ApiError(400, "UserName or Password is requried!!")
    }

    const user = await User.findOne({
        $or: [
            { username }, { email }
        ]
    })

    if (!user) {
        throw new ApiError(404, "User not found with this username or email!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password!")
    }

    const { refreshToken, accessToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            }),
            "User LoggedIn Successfully"
        )
})


// log out user controller
export const logOutUser = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized! User not found.");
    }

    // Remove refreshToken from DB
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: null } },
        { new: true }
    );

    const cookieOptions = {
        httpOnly: true,
        secure: true,       // true if HTTPS
        sameSite: "strict", // prevents CSRF attacks
    };

    // Clear cookies
    res
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .status(200)
        .json(new ApiResponse(200, { success: true }, "User logged out successfully"));
});

// refresh token access
const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookie.refreshToken || req.headers.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required for generating access token!");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(404, "User not found!");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Invalid refresh token!");
        }

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "strict"
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id);

        res
            .status(200)
            .cookie("accessToken", accessToken)
            .cookie("refreshToken", newRefreshToken)
            .json(
                new ApiResponse(200, { accessToken, refreshToken: newRefreshToken, }, "Access token refresh")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Token")
    }
})

// change current password
const chnageCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password Changed successfuly!")
        )
})

// get current user
const getCurrentUser = asyncHandler(async (req, res) => {

    return res
        .status(200)
        .json(
            200, req.user, "Current user fetch successfully."
        )

})

// update account details
const updateAccountDetails = asyncHandler(async (req, res) => {

    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are requires")
    }

    User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        { new: true },
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details update successfully")
        )
})

// update avatar
const updateAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar update successfully")
        )

})

// update user cove image
const updateUserCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?._id

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath.url)

    if (!cover.url) {
        throw new ApiError(400, "Error while uploading on cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image update successfully")
        )

})

// get user from chanel profile
const getUserChannelProfile = asyncHandler(async (req, res) => {

    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: _id,
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: _id,
                foreignField: "subscriber",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                }
            }
        },
        {
            isSubscribed: {
                $cond: {
                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                    then: true,
                    else: false
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if (!channel.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully!")
        )

})

// get watch history
const getWatchHistory = asyncHandler(async (req, res) => {

    const user = User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user.id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "user",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }

    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "watch history fetched"
            )
        )

})

export { registerUser, loginUser, logOutUser, refreshAccessToken, chnageCurrentPassword, getCurrentUser, updateAccountDetails, updateAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory }