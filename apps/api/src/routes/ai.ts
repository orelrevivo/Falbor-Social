import { Hono } from "hono";
import { optionalAuthMiddleware } from "../middleware/auth.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const aiRouter = new Hono();

aiRouter.post("/generate-image", optionalAuthMiddleware, async (c) => {
  try {
    const { prompt } = await c.req.json();

    if (!prompt) {
      return c.json({ error: "Prompt is required" }, 400);
    }

    const imgRes = await fetch("http://127.0.0.1:8001/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    if (!imgRes.ok) {
      return c.json({ error: "Failed to generate image from AI bridge" }, 500);
    }

    const imgData = await imgRes.json();
    if (!imgData.image_base64) {
      return c.json({ error: "No image data returned" }, 500);
    }

    const publicDir = path.join(process.cwd(), "public", "ai-media");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const filename = `${crypto.randomUUID()}.jpg`;
    const filepath = path.join(publicDir, filename);
    const buffer = Buffer.from(imgData.image_base64, "base64");
    fs.writeFileSync(filepath, buffer);

    // Assuming API is mounted on port 3000
    const localUrl = `http://localhost:3000/public/ai-media/${filename}`;

    return c.json({ url: localUrl });
  } catch (error) {
    console.error("Error generating image:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

import { processWebAgentContext } from "../agent/webAgent.js";

aiRouter.post("/web-agent", optionalAuthMiddleware, async (c) => {
  try {
    const { url, description, requestedByUsername } = await c.req.json();
    if (!url || !description || !requestedByUsername) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    // We process this asynchronously so the frontend doesn't hang waiting for the video
    processWebAgentContext(url, description, requestedByUsername);

    return c.json({ success: true, message: "Agent started" });
  } catch (error) {
    console.error("Error starting web agent:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { aiRouter };
