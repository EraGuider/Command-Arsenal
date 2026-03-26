import { extractUrlPayload } from './_extract';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const rawUrl = typeof req.body?.url === 'string' ? req.body.url : '';
  if (!rawUrl.trim()) {
    return res.status(400).json({ error: { message: 'Missing url' } });
  }

  try {
    const payload = await extractUrlPayload(rawUrl);
    return res.status(200).json(payload);
  } catch (error: any) {
    const message = error?.name === 'AbortError' ? 'Fetch timeout' : error?.message || 'Extraction failed';
    return res.status(500).json({ error: { message, code: 'extract_error' } });
  }
}
