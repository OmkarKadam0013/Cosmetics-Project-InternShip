const express=require('express');
const router=express.Router();
const authAdmin=require('../middleware/isAdmin');
const uploadImages=require('../middleware/multerMiddleware');

const {adminLoginController,
    addProductController,
    deleteProductController,
    updateProductController,
}=require('../controllers/adminController');

//admin login route
router.post('/login',adminLoginController);

//add product route
router.post('/add-product',authAdmin,uploadImages,addProductController)

//soft delete product from database
router.patch('/delete-product/:id',authAdmin,deleteProductController)

//update product form database
router.put('/update-product/:id',authAdmin,updateProductController)

module.exports=router;