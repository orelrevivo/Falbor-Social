export async function generateAIResponse(
  message: string,
  systemPrompt?: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  try {
    const bridgeUrl = process.env.AI_BRIDGE_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${bridgeUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        system_prompt: systemPrompt,
        history
      })
    });

    if (!response.ok) {
      throw new Error(`AI Bridge returned ${response.status}`);
    }

    // Since it returns a stream of text from Flask, we need to read it
    const text = await response.text();
    return text.trim();
  } catch (error) {
    console.error("[AI Service Error]", error);
    throw error;
  }
}
