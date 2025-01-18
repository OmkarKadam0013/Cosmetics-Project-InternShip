const express=require('express');
const router=express.Router();
const {registerController,
    loginController,
    logOutController,
    showCartController,
    addToCartController,
    deleteProductController,
    updateCartQuantityController,
    buyNowController,
}=require('../controllers/userController');
const authMiddleware=require('../middleware/isValidUser');

//register route
router.post('/register',registerController);

//login route
router.post('/login',loginController);

//logout route
router.post('/logout',authMiddleware,logOutController);

//get cart of user
router.get('/cart',authMiddleware,showCartController);

//add item in cart
router.post('/add-to-cart',authMiddleware,addToCartController);

//remove item form cart
router.delete('/delete-product-from-cart/:id',authMiddleware,deleteProductController);

//update cart quantity
router.patch('/update-cart-quantity',authMiddleware,updateCartQuantityController);

//bay now 
router.get('/buy-now',authMiddleware,buyNowController)

module.exports=router;
