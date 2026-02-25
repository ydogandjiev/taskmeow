#!/usr/bin/env node

const crypto = require("crypto");

console.log("\n=== TaskMeow ChatGPT App API Key Generator ===\n");

// Generate a secure random API key
const apiKey = `tm_${crypto.randomBytes(32).toString("hex")}`;

console.log("Generated API Key:");
console.log(apiKey);
console.log("\nAdd this to your .env file:");
console.log(`CHATGPT_APP_API_KEY="${apiKey}"`);
console.log("\nKeep this key secure and never commit it to version control!");
console.log("You'll use this key when configuring your ChatGPT App.\n");
