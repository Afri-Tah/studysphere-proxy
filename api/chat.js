export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only allow requests from your GitHub Pages site
  const origin = req.headers.origin || '';
  const allowed = ['https://afri-tah.github.io', 'http://localhost'];
  if (!allowed.some(o => origin.startsWith(o))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  // Models to try in order (all free on OpenRouter)
  const models = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'google/gemma-3-27b-it:free',
    'google/gemma-3-12b-it:free',
    'deepseek/deepseek-r1-distill-llama-70b:free',
    'qwen/qwen3-14b:free',
    'qwen/qwen3-8b:free'
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
}
