
const express = require("express");
const supabase = require("../config/supabase");

const router = express.Router();

// GET all active products
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch products",
      });
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      products: data,
    });
  } catch (error) {
    console.error("Server error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
