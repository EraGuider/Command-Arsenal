export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const { apiKey, body } = req.body || {};
  if (!apiKey) {
    return res.status(400).json({ error: { message: 'Missing apiKey' } });
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body)
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'proxy_error' } });
  }
}
