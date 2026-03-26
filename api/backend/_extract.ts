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

export async function extractUrlPayload(rawUrl: string) {
  if (!rawUrl.trim()) {
    throw new Error('Missing url');
  }

  const targetUrl = normalizeUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Command-Arsenal/1.0',
        Accept: 'text/html,application/xhtml+xml'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    const title = pickMeta(html, [/<title[^>]*>([^<]+)<\/title>/i, /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i]);
    const description = pickMeta(html, [
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
      /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i
    ]);

    return {
      url: targetUrl,
      title,
      description,
      content: stripHtml(html).slice(0, 4000),
      codeBlocks: extractCodeBlocks(html),
      headings: extractHeadings(html)
    };
  } finally {
    clearTimeout(timeout);
  }
}
