// api/parse-menu.js
// Vercel serverless function that uses Claude to parse uploaded menus
// Deployed automatically at: https://your-app.vercel.app/api/parse-menu

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  try {
    const { fileBase64, fileType, fileName } = req.body;

    if (!fileBase64 || !fileType) {
      return res.status(400).json({ error: 'File data required' });
    }

    // Determine media type for Claude
    let mediaType = fileType;
    let contentType = 'image';
    
    if (fileType === 'application/pdf') {
      contentType = 'document';
    } else if (fileType.startsWith('image/')) {
      contentType = 'image';
      // Normalize common image types
      if (fileType === 'image/jpg') mediaType = 'image/jpeg';
    } else {
      return res.status(400).json({ 
        error: 'Unsupported file type. Please upload a PDF or image (JPG, PNG).',
        received: fileType 
      });
    }

    // The prompt that makes Claude extract menu data perfectly
    const systemPrompt = `You are an expert at parsing restaurant menus. Extract ALL items from the menu image/PDF and return them as JSON.

Return ONLY valid JSON in this exact structure (no markdown, no explanation):

{
  "restaurantName": "string or null",
  "categories": [
    {
      "name": "Starters",
      "icon": "soup",
      "order": 1,
      "items": [
        {
          "name": "Item name",
          "price": 9.99,
          "description": "brief description or null",
          "icon": "curry",
          "allergens": ["vegetarian", "spicy"] 
        }
      ]
    }
  ]
}

Rules:
- Extract EVERY item you see, don't skip any
- Prices: use numbers only (9.99, not "£9.99")
- If price has ranges (e.g. £8-£12), use the lower price
- For "icon" field use ONE keyword from: curry, rice, naan, samosa, kebab, chicken, tea, thali, bowl, pot, chickenleg, meat, steak, fish, egg, cheese, bacon, squid, pizza, burger, pasta, noodles, sushi, dumpling, salad, fries, bread, cake, cupcake, donut, cookie, icecream, sweet, coffee, drink, water, milk, beer, wine, cocktail, mango, coconut, fire, spicy, leaf, chili, soup, tomato
- Pick the icon that best matches the item (curry for curries, burger for burgers, etc.)
- For allergens, identify any of: vegetarian, vegan, gluten-free, dairy-free, spicy, nuts, halal
- Look for symbols like V (vegetarian), VG (vegan), GF (gluten-free), chili symbols for spicy
- Group items by their category as shown on the menu (Starters, Mains, Desserts, Sides, Drinks, etc.)
- Assign category icons: Starters=soup, Mains=pizza or curry, Sides=fries, Desserts=cake, Drinks=drink, Breads=bread, etc.
- Preserve the order categories appear on the menu (order: 1, 2, 3...)
- If description is not clear, leave as null rather than inventing
- Do NOT wrap response in markdown code blocks - pure JSON only`;

    // Build Claude API request
    const claudeRequest = {
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: contentType,
              source: {
                type: 'base64',
                media_type: mediaType,
                data: fileBase64,
              },
            },
            {
              type: 'text',
              text: 'Parse this restaurant menu and extract all categories, items, prices, and details as JSON.',
            },
          ],
        },
      ],
    };

    // Call Claude API
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    };
    // PDFs require a beta header
    if (fileType === 'application/pdf') {
      headers['anthropic-beta'] = 'pdfs-2024-09-25';
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify(claudeRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      return res.status(response.status).json({ 
        error: 'AI parsing failed', 
        detail: errorText 
      });
    }

    const claudeData = await response.json();
    const textResponse = claudeData.content[0].text;

    // Parse the JSON from Claude's response
    let menuData;
    try {
      // Strip potential markdown code fences just in case
      const cleanText = textResponse
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      menuData = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      console.error('Claude response was:', textResponse);
      return res.status(500).json({ 
        error: 'AI returned invalid data, please try again',
        raw: textResponse.slice(0, 500)
      });
    }

    // Count totals for the UI
    const totalItems = menuData.categories?.reduce((sum, c) => sum + (c.items?.length || 0), 0) || 0;
    const totalCategories = menuData.categories?.length || 0;

    return res.status(200).json({
      success: true,
      menu: menuData,
      stats: {
        categories: totalCategories,
        items: totalItems,
        fileName: fileName || 'menu',
      },
    });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      detail: error.message,
    });
  }
}

// Increase payload size limit for PDFs/images
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
