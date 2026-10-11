
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const supabase = require("./config/supabase");
const productRoutes = require("./routes/productRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Test the API
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to JandaStore API",
  });
});

// Test Supabase database connection
app.get("/api/health", async (req, res) => {
  try {
    const { error } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Database error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Database connection failed",
      });
    }

    res.json({
      success: true,
      message: "JandaStore connected to Supabase successfully",
    });
  } catch (error) {
    console.error("Health check error:", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Products API
app.use("/api/products", productRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`JandaStore API running at http://localhost:${PORT}`);
});
