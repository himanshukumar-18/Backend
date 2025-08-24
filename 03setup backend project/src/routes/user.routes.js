import { Router } from "express";
import {
    loginUser,
    logOutUser,
    registerUser,
    refreshAccessToken,
    chnageCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js"
import { Upload } from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
    Upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);

router.route("/login").post(loginUser)

//secure routes
router
    .route("/logout")
    .post(
        verifyJWT,
        logOutUser
    )

router
    .route("/refresh-token")
    .post(refreshAccessToken)

router
    .route("/change-password")
    .post(
        verifyJWT,
        chnageCurrentPassword
    )

router
    .route("/current-user")
    .get(
        verifyJWT,
        getCurrentUser
    )

router
    .route("/update-account")
    .patch(
        verifyJWT,
        updateAccountDetails
    )

router
    .route("/avatar")
    .patch(
        verifyJWT,
        Upload.single("avatar"),
        updateAvatar
    )

router
    .route("/cover-image")
    .patch(
        verifyJWT,
        Upload.single("/coverImage"),
        updateUserCoverImage
    )

router
    .route("/c/:username")
    .get(
        verifyJWT,
        getUserChannelProfile
    )

router
    .route("/history")
    .get(
        verifyJWT,
        getWatchHistory
    )


export default router