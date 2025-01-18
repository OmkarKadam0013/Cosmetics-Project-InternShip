const mongoose = require("mongoose");
const User = require("../models/userModel"); // Your user model

const addAdmin = async () => {
  try {
    // Connect to the database
    await mongoose.connect("mongodb://localhost:27017/cosmetics", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Check if an admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin already exists!");
      return;
    }

    // Hash the password
    const password = "Admin@123"; // Set your desired admin password

    // Create the admin user
    const admin = new User({
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      password: password,
      role: "admin", // Set the role to admin
      phone: "1234567890", // Optional
      address: {
        street: "123 Admin St.",
        city: "Admin City",
        state: "Admin State",
        zipCode: "12345",
      },
    });

    await admin.save();
    console.log("Admin user created successfully!");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    mongoose.connection.close();
  }
};

addAdmin();
