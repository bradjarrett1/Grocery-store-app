export interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  matched_list_item: string | null;
}

export interface ReceiptData {
  store_name: string | null;
  store_address: string | null;
  date: string | null;
  time: string | null;
  items: ReceiptItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  payment_method: string | null;
}

export async function scanReceipt(
  imageBase64: string,
  listItems: Array<{ id: string; item_name: string }>
): Promise<ReceiptData> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_claude_api_key_here') {
    throw new Error('Anthropic API key not configured. Add it to your .env file.');
  }

  const listContext =
    listItems.length > 0
      ? `\n\nMy shopping list items: ${listItems.map((i) => i.item_name).join(', ')}`
      : '';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Analyze this grocery receipt image.${listContext}

Return ONLY a valid JSON object — no markdown, no code blocks, no explanation:

{
  "store_name": "string or null",
  "store_address": "string or null",
  "date": "YYYY-MM-DD or null",
  "time": "HH:MM or null",
  "items": [
    {
      "name": "clean readable product name",
      "quantity": 1,
      "unit_price": 0.00,
      "total_price": 0.00,
      "matched_list_item": "exact name from my shopping list if clearly the same product, otherwise null"
    }
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "payment_method": "string or null"
}

Rules:
- All price values must be numbers (not strings)
- Use null for any value you cannot clearly read
- Clean item names to be human readable, not store SKU codes
- quantity defaults to 1 if not shown
- For matched_list_item: only match if you are confident it is the same product`,
            },
          ],
        },
      ],
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error?.message ?? 'Receipt scan failed');
  }

  const text: string = json.content?.[0]?.text ?? '';

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse receipt data from AI response');
  }
}
