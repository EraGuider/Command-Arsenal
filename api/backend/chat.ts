export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const { baseUrl, apiKey, body } = req.body || {};
  if (!baseUrl || !apiKey) {
    return res.status(400).json({ error: { message: 'Missing baseUrl or apiKey' } });
  }

  let targetUrl = String(baseUrl).replace(/\/$/, '');
  if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`;
  targetUrl = targetUrl.endsWith('/chat/completions') ? targetUrl : `${targetUrl}/chat/completions`;

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'proxy_error' } });
  }
}
