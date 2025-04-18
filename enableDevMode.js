#!/usr/bin/env node

// Load environment variables from .env file
import 'dotenv/config';

import { storage } from "./server/storage.ts";

async function setupDevAccount() {
  try {
    const devUser = {
      username: "developer",
      password: "password123",
      email: "dev@example.com",
      displayName: "Developer Mode",
      bio: "This is a developer account for testing",
      profilePicture: null,
      nativeLanguage: "en",
    };

    // Check if developer account already exists
    const existingUser = await storage.getUserByUsername("developer");
    if (!existingUser) {
      await storage.createUser(devUser);
      console.log("Developer account created successfully");
    } else {
      console.log("Developer account already exists");
    }
  } catch (error) {
    console.error("Failed to set up developer account:", error);
  }
}

setupDevAccount();
