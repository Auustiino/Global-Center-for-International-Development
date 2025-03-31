// This file is just to test our API endpoints
import express from "express";
import { log } from "./vite";

// Create a simple route to test connectivity
export function setupTestRoutes(app: express.Express) {
  app.get("/api/test", (req, res) => {
    log("Test endpoint called successfully", "test");
    res.json({ 
      success: true, 
      message: "API is working correctly",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown"
    });
  });

  app.get("/api/env", (req, res) => {
    log("Environment check called", "test");
    res.json({
      NODE_ENV: process.env.NODE_ENV || "not set",
      environment: app.get("env"),
      headers: req.headers
    });
  });

  log("Test routes have been set up", "test");
}