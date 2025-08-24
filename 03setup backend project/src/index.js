// require('dotenv').config({path: './env'})

import dotenv from "dotenv";
// import express from "express";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
    path: "./.env"
})

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 40000, () => {
            console.log(`Our server is run on: ${process.env.PORT}`)
        });
        app.on("error", (error) => {
            console.log("Error: ", error)
            throw error
        })
    })
    .catch((error) => {
        console.log("MongoDB connection failed", error)
    })



// const app = express();
/*
;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("Erroe: ", error)
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`Our app is lesten on: ${process.env.PORT}` )
        })
    } catch (error) {
        console.error("Error", error)
        throw error
    }
})()
*/ 