import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  const { program } = await req.json();

  const prompt = `Write a short, professional affiliate application email to the affiliate manager for the following program.

Program: ${program.name}
Company: ${program.company || program.name}
Network: ${program.network}
Commission: ${program.commission}
Niche: ${program.niche}

Requirements:
- Subject line at top: "Subject: Affiliate Application — ${program.name}"
- Introduce yourself as an experienced high-ticket affiliate marketer
- Reference the specific program name and commission structure
- Mention your audience/traffic and relevance to the niche
- Ask about approval timeline
- Ask if there is a higher commission tier available for top performers
- Friendly, professional tone
- 150-200 words total (not counting subject line)
- No placeholders like [Your Name] — write in first person, sign off as "Best regards,"

Return only the email text, nothing else.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const email = response.content[0]?.text || "";
    return Response.json({ email });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
