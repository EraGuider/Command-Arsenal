export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const { apiKey } = req.body || {};
  if (!apiKey) {
    return res.status(400).json({ error: { message: 'Missing apiKey' } });
  }

  try {
    const response = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message, code: 'proxy_error' } });
  }
}
