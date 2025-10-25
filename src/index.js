import express from 'express'
import dotenv from 'dotenv'
import connectDb from './db/db.js'

dotenv.config({
    path: './env'
});

connectDb();