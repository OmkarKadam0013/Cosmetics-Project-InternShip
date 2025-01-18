const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); 
const Product = require("../models/productModel");

//Admin login controller
const adminLoginController = async (req, res) => {
  try {
    // Extract email and password from request body
    const { email, password } = req.body;

    // Validate if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Find the user by email, but only if they are an admin
    const user = await User.findOne({ email, role: "admin" });

    // Check if the user exists and if the password is correct
    if (!user) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Compare the provided password with the hashed password stored in the DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password." });
    }

    // Generate a JWT token for the admin
    const token = jwt.sign(
      { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }, // Payload
      process.env.JWT_SECRET, // Secret key from .env
      { expiresIn: process.env.JWT_EXPIRES_IN } // Expiration time from .env
    );

    // Set the JWT token in a cookie
    res.cookie('token', token, {
      httpOnly: true, // Prevents access to the cookie from JavaScript (mitigates XSS attacks)
      secure: process.env.NODE_ENV === 'production', // Only set cookie over HTTPS in production
      sameSite: 'Strict', // Helps prevent CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Send the response confirming login success
    res.status(200).json({
      message: "Admin login successful.",
      // Optionally, send some additional information like user info or role
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role, // Include the role here
      }
    });
  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};


//add product in database
const addProductController = async (req, res) => {
    try {
      // Destructure product details from the request body
      const { name, description, price, category, brand, stock } = req.body;
  
      // Validate if all required fields are provided
      if (!name || !description || !price || !category || !brand || !stock) {
        return res.status(400).json({ message: "All fields are required." });
      }
  
      // Check if images are uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "At least one product image is required." });
      }
  
      // Map uploaded files to the images array format
      const images = req.files.map(file => ({
        url: file.path, // Use the file path as the URL
      }));
  
      // Create a new product instance
      const newProduct = new Product({
        name,
        description,
        price,
        category,
        brand,
        stock,
        images, // Store the array of image URLs
      });
  
      // Save the new product to the database
      await newProduct.save();
  
      // Send a success response
      res.status(201).json({ message: "Product added successfully.", product: newProduct });
    } catch (error) {
      console.error("Error adding product:", error);
      res.status(500).json({ message: "Server error. Please try again later." });
    }
  };

//Soft delete product form database
const deleteProductController = async (req, res) => {
    try {
      const productId = req.params.id; // Get product ID from URL parameter
      // Find the product by ID
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).json({ message: "Product not found." });
      }
  
      // Update the stock field to -1
      product.stock = -1;
      await product.save();
  
      // Send success response
      res.status(200).json({ message: "Product stock quantity updated to -1 successfully." });
    } catch (error) {
      console.error("Error updating product stock quantity:", error);
      res.status(500).json({ message: "Server error. Please try again later." });
    }
  };

//Update product in database
const updateProductController = async (req, res) => {
    try {
      const productId = req.params.id; // Get product ID from URL parameter
      console.log("Request Body:", req.body);
      const { name, description, price, category, brand, stock } = req.body; // Get updated values from request body
  
      // Construct an object to store updated values
      const updateData = {};
  
      // Only include the fields that are provided
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (price !== undefined) updateData.price = price;
      if (category) updateData.category = category;
      if (brand) updateData.brand = brand;
      if (stock !== undefined) updateData.stock = stock;
  
      // Find the product by ID and update it
      const product = await Product.findByIdAndUpdate(
        productId,
        updateData,
        { new: true } // Return the updated product
      );
  
      if (!product) {
        return res.status(404).json({ message: "Product not found." });
      }
  
      // Send success response with updated product details
      res.status(200).json({
        message: "Product updated successfully.",
        product,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Server error. Please try again later." });
    }
  };

  
module.exports={
    adminLoginController,
    addProductController,
    deleteProductController,
    updateProductController,
}