const express = require("express");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const cors = require("cors");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const SHIPROCKET_EMAIL = process.env.USER_NAME;
const SHIPROCKET_PASSWORD = process.env.PASSWORD;
const DELHIVERY_TOKEN = process.env.DELHIVERY_TOKEN;
let authToken = "";
let tokenExpiryTime = 0;  // Store token expiry time in milliseconds

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
      tokenExpiryTime = Date.now() + 3600000; // Assuming token is valid for 1 hour
      console.log("New Token Generated:", authToken);
    } else {
      console.error("Error: Token not found in response");
    }
  } catch (error) {
    console.error("Error getting auth token:", error);
  }
};

// Middleware to ensure authentication token is available and valid
const ensureAuthToken = async (req, res, next) => {
  // If the token doesn't exist or has expired, get a new one
  if (!authToken || Date.now() > tokenExpiryTime) {
    await getAuthToken();
  }
  next();
};

// Fetch tracking data
app.get("/track/shiprocket/:awb", ensureAuthToken, async (req, res) => {
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



app.get('/track/delhivery', async (req, res) => {
  const { trackingNumber } = req.query;

  if (!trackingNumber) {
      return res.status(400).json({ error: "Tracking number is required." });
  }

  const apiUrl = `https://track.delhivery.com/api/v1/packages/json/?waybill=${trackingNumber}`;
  // const apiUrl = `https://track.delhivery.com/api/v1/packages/json/?ref_nos=${trackingNumber}`;
  
  try {
      const response = await fetch(apiUrl, {
          headers: { "Authorization": `Token ${DELHIVERY_TOKEN}` },
      });

      if (!response.ok) throw new Error("Failed to fetch tracking data.");

      const data = await response.json();
      
        res.json(data);
  
      
  } catch (error) {
      res.status(500).json({ error: "Tracking failed.", details: error.message });
  }
});


app.get('/track/:id', async (req, res) => {
  const trackingId = req.params.id;
  const apiUrl = `https://track.delhivery.com/api/v1/packages/json/?ref_ids=${trackingId}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        "Authorization": `Token ${DELHIVERY_TOKEN}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch tracking data.");

    const data = await response.json();
      res.json(data);
    return
  } catch (error) {
    res.status(500).json({ error: "Tracking failed.", details: error.message });
  }
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  getAuthToken(); // Initial token generation when the server starts
});



// https://backend-hug2.onrender.com/track/delhivery?trackingNumber=34588310013473
// https://backend-hug2.onrender.com/track/shiprocket/348269302894

// apik_f0MCwOCraWkimU5Mg9uzAtTj0HGqMX