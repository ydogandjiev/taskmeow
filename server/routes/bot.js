import { Router } from "express";
const router = Router();

import botService from "../bot-service.js";

// Listen for incoming server requests.
router.post("/bot/messages", async (req, res) => {
  // Route received a request to adapter for processing
  await botService.adapter.process(req, res, async (context) => {
    // Dispatch to application for routing
    await botService.app.run(context);
  });
});

export default router;
