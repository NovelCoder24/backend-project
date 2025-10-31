import express from 'express'
import cookieParser from 'cookie-parser';
import cors from 'cors'

const app = express()
// usually whenever we need to add middlewares we use this syntex
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    }
))

app.use(express.json({limit: "24kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
// to config of storage of pdf ,images 
app.use(express.static("public"))
app.use(cookieParser())

// routes import
import userRouter from './routes/user.routes.js'

// routes declaration
app.use("/api/v1/users",userRouter)
// http://localhost:8000/api/v1/users/register


export default app;