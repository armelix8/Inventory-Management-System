import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const ITEM_TYPES = ['Asset', 'Consumable', 'Other'];

/**
 * Classify an item based on its name using AI (Google Gemini)
 * Returns: 'Asset', 'Consumable', or 'Other'
 */
export async function classifyItem(itemName) {
  if (!genAI || !process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set, defaulting to "Other"');
    return 'Other';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a classification assistant. Classify inventory items into one of these categories:
- Asset: Long-term durable items that retain value (e.g., laptops, machinery, vehicles, furniture, equipment)
- Consumable: Items that are used up or depleted (e.g., paper, ink, cleaning supplies, food, office supplies)
- Other: Anything that doesn't clearly fit the above categories

Respond with ONLY one word: Asset, Consumable, or Other.

Item to classify: "${itemName}"`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const classification = response.text?.trim();

    console.log(`[AI Classification] Item: "${itemName}" -> Raw response: "${classification}"`);

    if (!classification) {
      console.warn(`[AI Classification] Empty response for "${itemName}"`);
      return 'Other';
    }

    // Normalize: handle various formats (Asset, asset, ASSET, etc.)
    const firstWord = classification.split(/[\s,.\n]/)[0]?.trim();
    const normalized =
      firstWord?.charAt(0).toUpperCase() + firstWord?.slice(1).toLowerCase() ?? 'Other';

    console.log(`[AI Classification] Normalized: "${normalized}"`);

    if (ITEM_TYPES.includes(normalized)) {
      return normalized;
    }

    console.warn(`[AI Classification] Invalid classification "${normalized}" for "${itemName}", defaulting to Other`);
    return 'Other';
  } catch (error) {
    console.error(`[AI Classification] Error for "${itemName}":`, error.message);
    return 'Other';
  }
}
