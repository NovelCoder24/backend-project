import dotenv from 'dotenv'
import connectDb from './db/db.js' 
import app from './app.js'


dotenv.config({
    path: '../env'
});

// lerning : I was made a double app means double server that cause me errors

connectDb()
.then(()=>{
    app.on("error",(err)=>{
        console.log("ERROR: ",err);
        throw err;
    })
    app.listen(process.env.PORT || 8000,()=>(
        console.log(`SERVER is running PORT: ${process.env.PORT || 8000}`)
    ))
})
.catch((err)=>(console.log("MONGO db connection failed !!",err)))