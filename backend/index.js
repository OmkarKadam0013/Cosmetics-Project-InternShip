require('dotenv').config();
const express=require('express');
const cookieParser = require('cookie-parser');
const connectMongoDb=require('./connection');
const app=express();
const userRoutes=require('./routes/userRoutes');
const adminRoutes=require('./routes/adminRoutes');

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

// all user routes here
app.use('/user',userRoutes);

//all admin routes here
app.use('/admin',adminRoutes);

//database connection
const URL=process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/cosmetics';
connectMongoDb(URL);

//start server
const PORT=process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log(`backend server running at http://localhost:${PORT}`);
});

