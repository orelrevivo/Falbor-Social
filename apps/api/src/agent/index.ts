import { desc, eq, isNull, ne, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { likes, posts, users, votes } from "../db/schema.js";
import { generateAIResponse } from "../lib/ai.js";
import fs from "fs";

function logAgent(msg: string) {
  console.log(msg);
  fs.appendFileSync("agent.log", new Date().toISOString() + " - " + msg + "\n");
}

const AGENT_USERNAME = "falborai";
const AGENT_DISPLAY_NAME = "Falbor AI Agent";
const AGENT_EMAIL = "ai@falbor.xyz";

let agentUserId: string | null = null;
let agentInterval: NodeJS.Timeout | null = null;

/**
 * Ensures the AI agent user exists in the database
 */
async function initAgent() {
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, AGENT_USERNAME))
    .limit(1);

  if (existingUser) {
    agentUserId = existingUser.id;
    console.log(`[Agent] Found existing agent account: ${agentUserId}`);
    return;
  }

  console.log(`[Agent] Creating new agent account: @${AGENT_USERNAME}...`);
  const [newUser] = await db
    .insert(users)
    .values({
      username: AGENT_USERNAME,
      displayName: AGENT_DISPLAY_NAME,
      email: AGENT_EMAIL,
      passwordHash: "AGENT_NO_LOGIN", // Agent cannot be logged into manually
      bio: "I am an autonomous AI agent exploring the Falbor network.",
      isVerified: true
    })
    .returning({ id: users.id });

  agentUserId = newUser.id;
  console.log(`[Agent] Created new agent account: ${agentUserId}`);
}

/**
 * Randomly generates a post and publishes it
 */
async function actionCreatePost() {
  if (!agentUserId) return;
  console.log("[Agent] Action: Creating a new post...");

  try {
    const prompt = "Write an interesting, short social media post (max 2 sentences) about technology, code, or digital culture. Do not use quotes.";
    const systemPrompt = "You are an AI browsing a social media network. Write casual, engaging posts.";
    
    let content = await generateAIResponse(prompt, systemPrompt);
    content = content.replace(/^["']|["']$/g, "").trim(); // Remove quotes

    const mediaUrls: string[] = [];
    
    // Always generate an image for the post!
    try {
      const imagePromptGen = await generateAIResponse(
        `Write a short, detailed visual prompt for an image that perfectly matches this post: "${content}". Respond with JUST the visual description, no quotes, no conversational text.`, 
        "You are a visual artist."
      );
      const imagePrompt = imagePromptGen.replace(/^["']|["']$/g, "").trim();
      
      console.log(`[Agent] Generating image for: ${imagePrompt}`);
      const imgRes = await fetch("http://127.0.0.1:8001/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt })
      });
      
      if (imgRes.ok) {
        const imgData = await imgRes.json();
        if (imgData.image_base64) {
          // Save the base64 string to a local file
          const fs = await import("fs");
          const path = await import("path");
          const crypto = await import("crypto");
          
          const publicDir = path.join(process.cwd(), "public", "ai-media");
          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
          }
          
          const filename = `${crypto.randomUUID()}.jpg`;
          const filepath = path.join(publicDir, filename);
          const buffer = Buffer.from(imgData.image_base64, "base64");
          fs.writeFileSync(filepath, buffer);
          
          // Assuming API runs on port 3000
          const localUrl = `http://localhost:3000/public/ai-media/${filename}`;
          mediaUrls.push(`${localUrl}#type=Image`);
          console.log(`[Agent] Generated & Saved Image: ${localUrl}`);
        }
      } else {
          console.log(`[Agent] Image generation failed with status: ${imgRes.status}`);
      }
    } catch (err) {
      console.error("[Agent] Failed to generate image:", err);
    }

    await db.insert(posts).values({
      authorId: agentUserId,
      content,
      mediaUrls
    });

    console.log(`[Agent] Created post: "${content.substring(0, 50)}..."`);
  } catch (error) {
    console.error("[Agent] Failed to create post:", error);
  }
}

/**
 * Finds a recent post from a real user and replies to it
 */
async function actionReply() {
  if (!agentUserId) return;
  console.log("[Agent] Action: Replying to a post...");

  try {
    // Find a recent top-level post not by the agent, that the agent hasn't replied to yet
    const recentPosts = await db
      .select({ id: posts.id, content: posts.content, authorUsername: users.username })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(ne(posts.authorId, agentUserId))
      .orderBy(desc(posts.createdAt))
      .limit(10);

    if (recentPosts.length === 0) return;

    // Pick a random post
    const targetPost = recentPosts[Math.floor(Math.random() * recentPosts.length)];

    const prompt = `Here is a post by @${targetPost.authorUsername}: "${targetPost.content}". Write a brief, friendly, insightful reply (max 1 sentence).`;
    const systemPrompt = "You are an AI browsing a social media network. Reply casually and directly to the user's thought.";

    let replyContent = await generateAIResponse(prompt, systemPrompt);
    replyContent = replyContent.replace(/^["']|["']$/g, "").trim();

    await db.insert(posts).values({
      authorId: agentUserId,
      content: replyContent,
      parentId: targetPost.id
    });

    console.log(`[Agent] Replied to post ${targetPost.id}: "${replyContent}"`);
  } catch (error) {
    console.error("[Agent] Failed to reply:", error);
  }
}

/**
 * Evaluates a random recent post and upvotes or downvotes it
 */
async function actionVote() {
  if (!agentUserId) return;
  console.log("[Agent] Action: Voting on a post...");

  try {
    const recentPosts = await db
      .select({ id: posts.id, content: posts.content })
      .from(posts)
      .where(ne(posts.authorId, agentUserId))
      .orderBy(desc(posts.createdAt))
      .limit(10);

    if (recentPosts.length === 0) return;

    const targetPost = recentPosts[Math.floor(Math.random() * recentPosts.length)];

    const prompt = `Evaluate this project/post with a judgmental eye based on its UI quality, problem-solving value, and the overall idea: "${targetPost.content}". Reply with exactly 'UPVOTE' or 'DOWNVOTE'.`;
    const systemPrompt = "You are a strict, highly critical judge evaluating projects on a social network.";

    const decision = await generateAIResponse(prompt, systemPrompt);

    let voteValue = 0;
    if (decision.trim().toUpperCase().includes("UPVOTE")) voteValue = 1;
    else if (decision.trim().toUpperCase().includes("DOWNVOTE")) voteValue = -1;

    if (voteValue !== 0) {
      // Check if already voted
      const [existing] = await db
        .select()
        .from(votes)
        .where(sql`${votes.userId} = ${agentUserId} AND ${votes.postId} = ${targetPost.id}`)
        .limit(1);

      if (!existing) {
        await db.insert(votes).values({
          userId: agentUserId,
          postId: targetPost.id,
          value: voteValue
        });
        console.log(`[Agent] Cast ${voteValue === 1 ? 'UPVOTE' : 'DOWNVOTE'} on post ${targetPost.id}`);
      } else if (existing.value !== voteValue) {
        await db.update(votes).set({ value: voteValue })
          .where(sql`${votes.userId} = ${agentUserId} AND ${votes.postId} = ${targetPost.id}`);
        console.log(`[Agent] Changed vote to ${voteValue === 1 ? 'UPVOTE' : 'DOWNVOTE'} on post ${targetPost.id}`);
      } else {
        console.log(`[Agent] Already voted identically on post ${targetPost.id}`);
      }
    } else {
      console.log(`[Agent] Could not decide on a valid vote for post ${targetPost.id}`);
    }
  } catch (error) {
    console.error("[Agent] Failed to vote on post:", error);
  }
}

const inProgressWebAgents = new Set<string>();

/**
 * Processes [AI_REVIEW: url | description] tags in recent posts.
 */
async function actionProcessWebAgentRequests() {
  if (!agentUserId) return;
  logAgent("[Agent] Action: Checking for Web Agent requests...");

  try {
    const pendingRequests = await db.execute(sql`
      SELECT p.id, p.content, u.username
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.content LIKE '%[AI_REVIEW:%'
      AND NOT EXISTS (
        SELECT 1 FROM posts p2 
        WHERE p2.parent_id = p.id AND p2.author_id = ${agentUserId}
      )
      LIMIT 1
    `);

    const rows = pendingRequests.rows || pendingRequests; // Handle different drizzle driver returns
    if (rows && rows.length > 0) {
      const targetPost = rows[0] as any;
      const contentStr = targetPost.content || "";
      const match = contentStr.match(/\[AI_REVIEW:\s*(.+?)\s*\|\s*(.+?)\]/);
      
      if (match) {
        if (inProgressWebAgents.has(targetPost.id)) {
          logAgent(`[Agent] Already processing request ${targetPost.id}. Skipping.`);
          return;
        }
        
        inProgressWebAgents.add(targetPost.id);
        let url = match[1].trim();
        
        // ProseKit/Markdown auto-links URLs by wrapping them in angle brackets or anchor tags.
        // We must strip them out so Playwright gets a valid raw URL!
        url = url.replace(/^<+|>+$/g, ''); // Removes <http://example.com>
        const aTagMatch = url.match(/href=["'](.*?)["']/);
        if (aTagMatch) {
          url = aTagMatch[1]; // Extracts from <a href="...">
        }
        
        // Ensure it has a protocol
        if (!url.startsWith('http')) {
          url = 'https://' + url;
        }

        const description = match[2].trim();
        logAgent(`[Agent] Found AI_REVIEW request in post ${targetPost.id}: Cleaned URL -> ${url}`);
        
        // Dynamic import to avoid circular dependencies
        const { processWebAgentContext } = await import("./webAgent.js");
        
        // Run it asynchronously so it doesn't block the loop forever
        processWebAgentContext(url, description, targetPost.username, targetPost.id).finally(() => {
          inProgressWebAgents.delete(targetPost.id);
        });
      } else {
        logAgent(`[Agent] Found post ${targetPost.id} but regex did not match. Content: ${contentStr}`);
      }
    }
  } catch (error: any) {
    logAgent(`[Agent] Failed to process web agent requests: ${error.message}`);
  }
}

/**
 * Starts the autonomous loop
 */
export async function startAgent() {
  logAgent("[Agent] Initializing autonomous agent...");
  try {
    await initAgent();

    // Run immediately once
    const loop = async () => {
      // First, ALWAYS check for web agent requests
      await actionProcessWebAgentRequests();

      // Pick a random action for general social behavior
      const actionType = Math.floor(Math.random() * 3);
      switch (actionType) {
        case 0:
          await actionCreatePost();
          break;
        case 1:
          await actionReply();
          break;
        case 2:
          await actionVote();
          break;
      }
    };
    
    loop();

    // Then run every 15 seconds
    agentInterval = setInterval(loop, 15 * 1000); 
    
    logAgent("[Agent] Loop started! Running every 15 seconds.");
  } catch (error: any) {
    logAgent(`[Agent] Critical error starting agent: ${error.message}`);
  }
}

export function stopAgent() {
  if (agentInterval) {
    clearInterval(agentInterval);
    agentInterval = null;
    logAgent("[Agent] Loop stopped.");
  }
}
