const express = require("express");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());


const SHIPROCKET_EMAIL = "ashishindu0@gmail.com";
const SHIPROCKET_PASSWORD = "qurvii123T$";
let authToken = "";

// Function to get authentication token
const getAuthToken = async () => {
    try {
      const response = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD })
      });
      
      const data = await response.json();
      console.log("Shiprocket API Response:", data); // Log full response
      
      if (data.token) {
        authToken = data.token;
        console.log("New Token Generated:", authToken);
      } else {
        console.error("Error: Token not found in response");
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
    }
  };
  
// Middleware to ensure authentication token is available
const ensureAuthToken = async (req, res, next) => {
  if (!authToken) await getAuthToken();
  next();
};

// Fetch tracking data
app.get("/track/:awb", ensureAuthToken, async (req, res) => {
  try {
    const { awb } = req.params;
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
    const trackingData = await response.json();
    res.json(trackingData);
  } catch (error) {
    console.error("Error fetching tracking data:", error);
    res.status(500).json({ error: "Failed to fetch tracking data" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  getAuthToken();
});
