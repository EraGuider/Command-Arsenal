import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dns from 'node:dns';
import { randomUUID } from 'node:crypto';

// Some documentation hosts in this environment time out when Node prefers IPv6.
// For URL extraction, prefer IPv4 first so public docs sites remain reachable.
dns.setDefaultResultOrder('ipv4first');

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withProtocol).toString();
};

const stripHtml = (html: string) => {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6|tr)>/gi, '$&\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

const extractCodeBlocks = (html: string) => {
  const matches = Array.from(
    html.matchAll(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>|<pre[^>]*>([\s\S]*?)<\/pre>/gi)
  );

  return matches
    .map((match) => stripHtml(match[1] || match[2] || ''))
    .map((block) => block.trim())
    .filter(Boolean)
    .filter((block, index, arr) => arr.indexOf(block) === index)
    .slice(0, 12);
};

const extractHeadings = (html: string) => {
  const matches = Array.from(html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi));

  return matches
    .map((match) => stripHtml(match[1] || ''))
    .map((heading) => heading.trim())
    .filter(Boolean)
    .filter((heading, index, arr) => arr.indexOf(heading) === index)
    .slice(0, 20);
};

const pickMeta = (html: string, patterns: RegExp[]) => {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
};

type ExtractionStage =
  | 'queued'
  | 'normalizing_url'
  | 'fetching_html'
  | 'reading_html'
  | 'extracting_structures'
  | 'completed'
  | 'failed';

interface ExtractionJob {
  id: string;
  stage: ExtractionStage;
  percent: number;
  startedAt: number;
  endedAt?: number;
  result?: any;
  error?: { message: string };
}

const EXTRACTION_STAGE_META: Record<ExtractionStage, { percent: number; message: string }> = {
  queued: { percent: 5, message: '任务已创建，准备开始' },
  normalizing_url: { percent: 12, message: '正在校验并标准化网址' },
  fetching_html: { percent: 28, message: '正在下载网页内容' },
  reading_html: { percent: 48, message: '正在读取网页响应内容' },
  extracting_structures: { percent: 72, message: '正在解析标题、章节和代码块' },
  completed: { percent: 100, message: '网页提取完成' },
  failed: { percent: 100, message: '提取失败' }
};

const extractionJobs = new Map<string, ExtractionJob>();
const EXTRACTION_JOB_TTL_MS = 5 * 60 * 1000;

const updateExtractionStage = (job: ExtractionJob, stage: ExtractionStage) => {
  job.stage = stage;
  job.percent = EXTRACTION_STAGE_META[stage].percent;
  if (stage === 'completed' || stage === 'failed') {
    job.endedAt = Date.now();
  }
};

const cleanupExtractionJobs = () => {
  const now = Date.now();
  for (const [id, job] of extractionJobs.entries()) {
    const referenceTime = job.endedAt ?? job.startedAt;
    if (now - referenceTime > EXTRACTION_JOB_TTL_MS) {
      extractionJobs.delete(id);
    }
  }
};

const buildExtractionResult = (html: string, targetUrl: string) => {
  const title = pickMeta(html, [/<title[^>]*>([^<]+)<\/title>/i, /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i]);
  const description = pickMeta(html, [
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
    /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i
  ]);
  const codeBlocks = extractCodeBlocks(html);
  const headings = extractHeadings(html);
  const content = stripHtml(html).slice(0, 4000);

  return {
    url: targetUrl,
    title,
    description,
    content,
    codeBlocks,
    headings
  };
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.post('/api/backend/chat', async (req, res) => {
    const { baseUrl, apiKey, body } = req.body;
    if (!baseUrl || !apiKey) {
      return res.status(400).json({ error: { message: 'Missing baseUrl or apiKey' } });
    }

    let targetUrl = baseUrl.replace(/\/$/, '');
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
  });

  app.post('/api/backend/search', async (req, res) => {
    const { apiKey, body } = req.body;
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
  });

  app.post('/api/backend/github', async (req, res) => {
    const { apiKey } = req.body;
    try {
      const response = await fetch('https://api.github.com/user', {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/vnd.github.v3+json' }
      });
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (error: any) {
      res.status(500).json({ error: { message: error.message, code: 'proxy_error' } });
    }
  });

  app.post('/api/backend/extract-url/start', async (req, res) => {
    cleanupExtractionJobs();

    const rawUrl = typeof req.body?.url === 'string' ? req.body.url : '';
    if (!rawUrl.trim()) {
      return res.status(400).json({ error: { message: 'Missing url' } });
    }

    const jobId = randomUUID();
    const job: ExtractionJob = {
      id: jobId,
      stage: 'queued',
      percent: EXTRACTION_STAGE_META.queued.percent,
      startedAt: Date.now()
    };
    extractionJobs.set(jobId, job);

    (async () => {
      try {
        updateExtractionStage(job, 'normalizing_url');
        const targetUrl = normalizeUrl(rawUrl);

        updateExtractionStage(job, 'fetching_html');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Command-Arsenal/1.0',
            Accept: 'text/html,application/xhtml+xml'
          },
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`Failed to fetch page: ${response.status}`);
        }

        updateExtractionStage(job, 'reading_html');
        const html = await response.text();

        updateExtractionStage(job, 'extracting_structures');
        job.result = buildExtractionResult(html, targetUrl);

        updateExtractionStage(job, 'completed');
      } catch (error: any) {
        updateExtractionStage(job, 'failed');
        const message = error.name === 'AbortError' ? 'Fetch timeout' : error.message;
        job.error = { message };
      }
    })();

    res.json({ jobId });
  });

  app.get('/api/backend/extract-url/status/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = extractionJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: { message: 'Extraction job not found' } });
    }

    const meta = EXTRACTION_STAGE_META[job.stage];
    res.json({
      jobId: job.id,
      stage: job.stage,
      percent: job.percent,
      message: meta.message,
      done: job.stage === 'completed',
      failed: job.stage === 'failed',
      error: job.error || null
    });
  });

  app.get('/api/backend/extract-url/result/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = extractionJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: { message: 'Extraction job not found' } });
    }

    if (job.stage === 'failed') {
      return res.status(500).json({ error: { message: job.error?.message || 'Extraction failed', code: 'extract_error' } });
    }

    if (job.stage !== 'completed' || !job.result) {
      return res.status(409).json({ error: { message: 'Extraction not completed yet' } });
    }

    res.json(job.result);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
