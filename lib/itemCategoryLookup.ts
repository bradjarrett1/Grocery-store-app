import Fuse from 'fuse.js';
import groceryData from '../assets/grocery-lookup.json';

interface Category {
  id: string;
  name: string;
}

const lookupKeys = Object.keys(groceryData as Record<string, string>);

const itemFuse = new Fuse(lookupKeys, {
  threshold: 0.4,
  minMatchCharLength: 2,
  includeScore: true,
});

export async function getCategoryForItem(
  itemName: string,
  categories: Category[]
): Promise<string | null> {
  if (!itemName.trim() || categories.length === 0) return null;

  const normalized = itemName.trim().toLowerCase();

  const results = itemFuse.search(normalized);
  if (results.length > 0) {
    const best = results[0];
    const categoryName = (groceryData as Record<string, string>)[best.item];
    const matched = findCategory(categoryName, categories);
    if (matched) return matched;
  }

  return getCategoryViaGemini(itemName, categories);
}

function findCategory(categoryName: string, categories: Category[]): string | null {
  const lower = categoryName.toLowerCase();

  const exact = categories.find((c) => c.name.toLowerCase() === lower);
  if (exact) return exact.id;

  const partial = categories.find(
    (c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase())
  );
  if (partial) return partial.id;

  const catFuse = new Fuse(categories, {
    keys: ['name'],
    threshold: 0.5,
  });
  const catResults = catFuse.search(categoryName);
  return catResults.length > 0 ? catResults[0].item.id : null;
}

async function getCategoryViaGemini(
  itemName: string,
  categories: Category[]
): Promise<string | null> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return null;

  try {
    const categoryNames = categories.map((c) => c.name).join(', ');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Grocery item: "${itemName}"\nAvailable categories: ${categoryNames}\n\nReply with only the exact category name that best fits this item. If none fit, reply with the word null.`,
                },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 20 },
        }),
      }
    );

    const json = await response.json();
    const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    if (!text || text.toLowerCase() === 'null') return null;

    return findCategory(text, categories);
  } catch {
    return null;
  }
}
