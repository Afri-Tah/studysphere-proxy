module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Missing prompt' });

  const errors = [];

  // --- 1. Try Gemini 2.0 Flash (primary) ---
  if (process.env.GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 4096 }
        })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text) return res.status(200).json({ text, model: 'gemini-2.0-flash' });
      if (data.error) errors.push(`Gemini 2.0 Flash: ${data.error.message}`);
    } catch (e) {
      errors.push(`Gemini 2.0 Flash: ${e.message}`);
    }
  }

  // --- 2. Try Gemini 1.5 Flash (fallback) ---
  if (process.env.GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 4096 }
        })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text) return res.status(200).json({ text, model: 'gemini-1.5-flash' });
      if (data.error) errors.push(`Gemini 1.5 Flash: ${data.error.message}`);
    } catch (e) {
      errors.push(`Gemini 1.5 Flash: ${e.message}`);
    }
  }

  // --- 3. Try Gemini 1.5 Pro (fallback) ---
  if (process.env.GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 4096 }
        })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text) return res.status(200).json({ text, model: 'gemini-1.5-pro' });
      if (data.error) errors.push(`Gemini 1.5 Pro: ${data.error.message}`);
    } catch (e) {
      errors.push(`Gemini 1.5 Pro: ${e.message}`);
    }
  }

  // --- 4. Try OpenRouter free models (fallback) ---
  if (process.env.OPENROUTER_API_KEY) {
    const orModels = [
      'google/gemma-3-27b-it:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'mistralai/mistral-7b-instruct:free'
    ];
    for (const model of orModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://afri-tah.github.io',
            'X-Title': 'StudySphere'
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.4,
            max_tokens: 4096
          })
        });
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        if (text) return res.status(200).json({ text, model });
        if (data.error) errors.push(`${model}: ${data.error.message}`);
      } catch (e) {
        errors.push(`${model}: ${e.message}`);
      }
    }
  }

  return res.status(502).json({ error: 'All models failed', details: errors });
};
