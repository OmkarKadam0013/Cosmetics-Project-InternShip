const mongoose=require('mongoose');

const connectMongoDb=async (URL)=>{
    try {
        await mongoose.connect(URL);
        console.log("connected to mongoDB")
    } catch (error) {
        console.log("mongoDB connection error:",error);
    }
}

module.exports=connectMongoDb;