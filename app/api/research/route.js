import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  const { niche, commType, sortBy, keyword } = await req.json();

  const nicheLabel = niche === "all" ? "all niches" : niche;
  const typeLabel =
    commType === "high"
      ? "high-ticket affiliate programs ($500+ per conversion)"
      : commType === "standard"
      ? "standard commission affiliate programs"
      : "both standard and high-ticket affiliate programs";

  const prompt = `You are an expert affiliate marketing researcher with access to live web search.

TASK: Research real, current affiliate programs right now using web search.

Search for:
1. "best ${nicheLabel} affiliate programs 2025 high commission"
2. "top paying ${nicheLabel} affiliate programs recurring commissions"
3. "${keyword ? keyword + " affiliate program" : nicheLabel + " affiliate high ticket 2025"}"
4. Check actual program pages to verify commission rates are current

Criteria:
- Niche focus: ${nicheLabel}
- Program type: ${typeLabel}
- Sort results by: ${sortBy === "commission" ? "highest commission/payout" : sortBy === "cookie" ? "longest cookie duration" : "highest EPC"}
${keyword ? `- User keyword filter: "${keyword}"` : ""}

After searching, return ONLY a raw JSON array (no markdown, no backticks, no explanation) of 8-12 affiliate programs.

Each object must have exactly these keys:
{
  "name": "Exact program name",
  "company": "Company behind it",
  "network": "ShareASale / Impact / CJ / ClickBank / Direct / etc",
  "type": "standard" or "high",
  "niche": "Short niche label",
  "commission": "Exact commission rate as string e.g. '40% recurring' or '$500 flat'",
  "cookie": "Cookie window e.g. '90 days' or 'Session'",
  "avgPayout": "Average payout per conversion e.g. '$120' or '$1,200'",
  "epc": "Estimated earnings per 100 clicks e.g. '$4.20'",
  "description": "2 sentences: what the program is and why it pays well",
  "joinUrl": "Real working URL to apply/join the affiliate program",
  "adsUrl": "https://www.facebook.com/ads/library/?q=BRAND_NAME (fill in brand name)",
  "networkUrl": "Real URL to network listing page or null",
  "tags": ["recurring", "saas", "high-ticket"] (2-4 relevant tags)
}

Rules:
- type = "high" if a realistic single conversion can earn $500+, else "standard"
- joinUrl MUST be a real URL, not a placeholder
- Do not invent programs — only include ones you found via web search
- Return ONLY the JSON array starting with [ and ending with ]`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Stream status updates first
        const sendStatus = (msg) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "status", message: msg })}\n\n`)
          );
        };

        sendStatus("🔍 Starting web search for affiliate programs...");

        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompt }],
        });

        // Extract search queries that were used
        let searchCount = 0;
        for (const block of response.content) {
          if (block.type === "tool_use" && block.name === "web_search") {
            searchCount++;
            sendStatus(`🌐 Web search ${searchCount}: "${block.input?.query}"`);
          }
        }

        sendStatus(`✅ ${searchCount} searches complete — parsing results...`);

        // Extract JSON from response
        let jsonText = "";
        for (const block of response.content) {
          if (block.type === "text" && block.text) {
            const t = block.text.trim();
            const start = t.indexOf("[");
            const end = t.lastIndexOf("]");
            if (start !== -1 && end > start) {
              jsonText = t.slice(start, end + 1);
              break;
            }
          }
        }

        if (!jsonText) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "No structured results returned. Try again." })}\n\n`
            )
          );
          controller.close();
          return;
        }

        const programs = JSON.parse(jsonText);

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "results", programs, searchCount })}\n\n`
          )
        );
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
