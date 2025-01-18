const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

//Register user
const registerController = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, address } = req.body;

    // Validate request data
    if (!firstName || !lastName || !email || !password || !phone || !address) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Check if the phone number already exists
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res
        .status(400)
        .json({ message: "Phone number is already registered." });
    }

    // Create new cart for the user
    const cart = new Cart({
      items: [],
      totalPrice: 0,
    });

    // Save the cart
    await cart.save();

    // Create a new user instance
    const newUser = new User({
      firstName,
      lastName,
      email,
      password, // Password will be hashed by the pre-save middleware
      phone,
      address,
      cartId: cart._id, // Store cartId in the user model
    });

    // Save the new user to the database
    const savedUser = await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: savedUser._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Set the token in an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure flag for HTTPS in production
      sameSite: "Strict", // Adjust based on your needs (Strict/Lax/None)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Respond with success message
    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        phone: savedUser.phone,
        address: savedUser.address,
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({ message: validationErrors.join(", ") });
    }
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

//login user
const loginController = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    // Validate request data
    if (!emailOrPhone || !password) {
      return res
        .status(400)
        .json({ message: "Email/Phone and password are required." });
    }

    // Check if the input is an email or phone number
    let user;
    if (emailOrPhone.includes("@")) {
      // It's an email, find by email
      user = await User.findOne({ email: emailOrPhone });
    } else {
      // It's a phone number, find by phone
      user = await User.findOne({ phone: emailOrPhone });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role }, // Payload
      JWT_SECRET, // Secret key
      { expiresIn: JWT_EXPIRES_IN } // Options
    );
    // Send the token in a cookie
    res.cookie("token", token, {
      httpOnly: true, // Prevents access to the cookie from JavaScript (mitigates XSS attacks)
      secure: "false", //process.env.NODE_ENV === 'production', // Only set cookie over HTTPS in production
      sameSite: "None", // Helps prevent CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Send success response
    res.status(200).json({
      message: "Login successful.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

//logout user
const logOutController = async (req, res) => {
  try {
    // Clear the JWT token from cookies
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    // Send response
    res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

//show cart to the user
const showCartController = async (req, res) => {
  try {
    // Find the user by ID and populate their cart
    const user = await User.findById(req.user.id).populate({
      path: "cartId", //The cartId field in the User model will be replaced with the entire Cart object.
      populate: {
        path: "items.productId", // Populate the product details
        model: "Product",
      },
    });

    if (!user || !user.cartId) {
      return res.status(404).json({ message: "Cart not found for this user" });
    }

    // Ensure the total price is updated
    await user.cartId.updateTotalPrice();

    // Send the cart data to the frontend
    res.status(200).json({
      message: "Cart fetched successfully",
      cart: user.cartId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//add to cart
//Function  to add items in cart
const addToCartController = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const parsedQuantity = parseInt(quantity, 10); // Convert to a number

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be a positive number" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock === 0) {
      return res.status(403).json({ message: "Stock unavailable" });
    }

    if (product.stock === -1) {
      return res.status(403).json({ message: "Product no longer available" });
    }

    const userId = req.user.id;

    const user = await User.findById(userId).populate("cartId");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cart = user.cartId;
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Check if the product exists in the cart
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );
    if (existingItem) {
      existingItem.quantity += parseInt(quantity, 10); // Ensure quantity is a number
      existingItem.addedAt = new Date(); // Update the addedAt timestamp
    } else {
      cart.items.push({ productId, quantity: parseInt(quantity, 10)});
    }

    await cart.updateTotalPrice();
    await cart.save();

    // Format `addedAt` to IST
    const formattedCart = {
      ...cart.toObject(),
      items: cart.items.map((item) => ({
        ...item.toObject(),
        addedAt: new Date(item.addedAt).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      })),
    };
    res
      .status(200)
      .json({
        message: "Item added to cart successfully",
        cart: formattedCart,
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//remove product form cart
//Remove items form cart
const deleteProductController = async (req, res) => {
  try {
    const productId = req.params.id;

    const userId = req.user.id; // Assuming `req.user.id` contains the authenticated user's ID
    // Find the user and populate the cart
    const user = await User.findById(userId).populate('cartId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const cart = user.cartId;
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Find the index of the item to remove
    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Remove the item from the cart
    cart.items.splice(itemIndex, 1);

    // Save the cart and update the total price
    await cart.save();
    await cart.updateTotalPrice();

    res.status(200).json({ message: 'Item removed from cart successfully', cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

//update cart quantity
const updateCartQuantityController = async (req, res) => {
  try {
    const { productId, action } = req.body; // Get productId and action (increase/decrease) from the request body
    const userId = req.user.id; // Assume `req.user.id` is set by the authentication middleware

    // Find the user's cart and populate the items
    const user = await User.findById(userId).populate('cartId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const cart = user.cartId;
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Find the product in the cart items
    const existingItem = cart.items.find(item => item.productId.toString() === productId);
    if (!existingItem) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }

    // Increment or decrement the quantity based on the action
    if (action === 'increase') {
      existingItem.quantity += 1; // Increase the quantity by 1
    } else if (action === 'decrease' && existingItem.quantity > 1) {
      existingItem.quantity -= 1; // Decrease the quantity by 1, but not below 1
    } else {
      return res.status(400).json({ message: 'Cannot decrease quantity below 1' });
    }

    // Save the cart
    await cart.save();

    // Update the total price after quantity change
    await cart.updateTotalPrice();

    // Respond with the updated cart
    res.status(200).json({
      success: true,
      message: 'Quantity updated successfully',
      cart: cart, // Return the updated cart
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//buy now 
const buyNowController = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user and populate cart details
    const user = await User.findById(userId).populate({
      path: 'cartId',
      populate: {
        path: 'items.productId',
        model: 'Product',
      },
    });

    if (!user || !user.cartId) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const cart = user.cartId;

    // Calculate total price of cart items
    const totalPrice = cart.totalPrice;

    // Determine shipping charges based on the user's city
    const city = user.address.city.toLowerCase();
    const shippingCharges = city === "baramati" ? 0 : 50;

    // Calculate the final billing price
    const billingPrice = totalPrice + shippingCharges;

    // Return the response
    res.status(200).json({
      cart,
      totalPrice,
      shippingCharges,
      billingPrice,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//pay now 


module.exports = {
  registerController,
  loginController,
  logOutController,
  showCartController,
  addToCartController,
  deleteProductController,
  updateCartQuantityController,
  buyNowController,
};
