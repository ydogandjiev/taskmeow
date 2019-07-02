const express = require("express");
const router = express.Router();

const botService = require("../bot-service");

// Configure bot routes
router.post("/bot/messages", botService.connector.listen());
router.get("/auth/azureADv1/callback", botService.bot.handleOAuthCallback);

module.exports = router;
