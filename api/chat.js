module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const models = [
    'meta-llama/llama-4-maverick:free',
    'meta-llama/llama-4-scout:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-chat-v3-0324:free',
    'deepseek/deepseek-r1:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'google/gemini-2.5-pro-exp-03-25:free'
  ];

  const errors = [];
  for (const model of models) {
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
      if (data.error) { errors.push(`${model}: ${data.error.message}`); continue; }
      const text = data.choices?.[0]?.message?.content || '';
      if (text) return res.status(200).json({ text });
    } catch (e) {
      errors.push(`${model}: ${e.message}`);
    }
  }

  return res.status(502).json({ error: 'All models failed', details: errors });
};
