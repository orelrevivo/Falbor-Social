import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { db } from "../db/index.js";
import { posts, users, notifications } from "../db/schema.js";
import { generateAIResponse } from "../lib/ai.js";
import { eq } from "drizzle-orm";

const AGENT_USERNAME = "falborai";

export async function processWebAgentContext(url: string, description: string, requestedByUsername: string, replyToPostId?: string) {
  console.log(`[WebAgent] Received context request for ${url} from @${requestedByUsername}`);
  
  // Find agent user
  const [agentUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, AGENT_USERNAME))
    .limit(1);

  if (!agentUser) {
    console.error("[WebAgent] Agent user not found!");
    return;
  }

  // Find requesting user
  const [requestingUser] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.username, requestedByUsername))
    .limit(1);

  const mediaUrls: string[] = [];
  const publicDir = path.join(process.cwd(), "public", "ai-media");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  try {
    console.log(`[WebAgent] Launching browser for ${url}...`);
    const browser = await chromium.launch({ headless: false });
    
    // We record video!
    const videoDir = path.join(publicDir, "videos");
    if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
    
    const context = await browser.newContext({
      recordVideo: {
        dir: videoDir,
        size: { width: 1280, height: 720 }
      }
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => console.warn("Timeout, continuing anyway:", e));
    
    // Take screenshot for Moondream2 (do this first while at the top of the page)
    const screenshotBuffer = await page.screenshot({ type: "jpeg", quality: 80 });
    const screenshotBase64 = screenshotBuffer.toString("base64");
    
    // Simulate real user browsing so the video looks good! (about 8-10 seconds total)
    await page.waitForTimeout(2000); // Look at the hero section
    
    // Scroll down slowly over multiple steps
    for (let i = 0; i < 5; i++) {
      // @ts-ignore
      await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
      await page.waitForTimeout(1000);
    }
    
    // Try to hover over a button to show interaction (optional)
    try {
      const btn = await page.$('button, a.btn, a.button');
      if (btn) {
        await btn.hover();
        await page.waitForTimeout(1500);
      }
    } catch(e) {}
    
    // Scroll back up slightly
    // @ts-ignore
    await page.evaluate(() => window.scrollBy(0, -500));
    await page.waitForTimeout(1000);
    
    // Extract text for context
    // @ts-ignore
    const extractedText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    
    // Close page to finalize video
    const videoPath = await page.video()?.path();
    await context.close();
    await browser.close();
    
    console.log(`[WebAgent] Video saved to ${videoPath}`);
    
    if (videoPath) {
      // Move video to our accessible public dir
      const newVideoName = `${crypto.randomUUID()}.webm`;
      const newVideoPath = path.join(publicDir, newVideoName);
      fs.renameSync(videoPath, newVideoPath);
      mediaUrls.push(`http://localhost:3000/public/ai-media/${newVideoName}#type=Video`);
    }

    // Call Moondream2
    let visualDescription = "Unable to analyze visual design.";
    try {
      console.log(`[WebAgent] Sending screenshot to Moondream2...`);
      const moonRes = await fetch("http://127.0.0.1:8002/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image_base64: screenshotBase64,
          prompt: "Describe the visual design, UI elements, and overall look and feel of this website screenshot. Is it modern, premium, or basic?"
        })
      });
      
      if (moonRes.ok) {
        const moonData = await moonRes.json() as any;
        visualDescription = moonData.description;
        console.log(`[WebAgent] Moondream2 says: ${visualDescription}`);
      }
    } catch (err) {
      console.error("[WebAgent] Failed to reach Moondream2 (is port 8002 running?):", err);
    }

    // Call Text AI
    const systemPrompt = "You are an AI that reviews websites as if you are a user who really needs the problem solved. Be highly opinionated, brutally honest, but constructive.";
    const textPrompt = `
I need you to review a website. Here is the context provided by the creator:
URL: ${url}
Goal/Problem it solves: ${description}

Here is the raw text extracted from the homepage:
${extractedText}

Here is the visual design feedback from our vision model (Moondream2):
${visualDescription}

Write a high-quality review post for a social media network. You MUST tag the creator by including exactly '@${requestingUser?.username || requestedByUsername}' somewhere in your post. Evaluate if the site actually solves the problem stated, critique the design based on the vision feedback, and offer constructive advice. Keep it under 4 paragraphs. Do not use markdown quotes around your response.
`;

    console.log(`[WebAgent] Generating post with Text AI...`);
    let postContent = await generateAIResponse(textPrompt, systemPrompt);
    postContent = postContent.replace(/^["']|["']$/g, "").trim();

    // Publish post
    const [post] = await db.insert(posts).values({
      authorId: agentUser.id,
      content: postContent,
      mediaUrls,
      parentId: replyToPostId || undefined
    }).returning();

    console.log(`[WebAgent] Published post ${post.id}`);

    // Create Notification for the tagged user (the creator)
    if (requestingUser) {
      await db.insert(notifications).values({
        userId: requestingUser.id,
        type: "mention",
        actorId: agentUser.id,
        postId: post.id
      });
      console.log(`[WebAgent] Notified @${requestingUser.username}`);
    }

  } catch (error) {
    console.error("[WebAgent] Error processing context:", error);
    // Post a fallback reply to stop the infinite loop
    try {
      if (agentUser && agentUser.id) {
        await db.insert(posts).values({
          authorId: agentUser.id,
          content: "I'm sorry, my AI processing backend is currently offline so I couldn't review your site. Please try again later!",
          parentId: replyToPostId || undefined
        });
      }
    } catch (e) {
      console.error("[WebAgent] Failed to post fallback reply:", e);
    }
  }
}
