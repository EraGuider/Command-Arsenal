import { ApiConfig, Command } from '../types';

export interface UrlExtractionProgress {
  percent: number;
  stage: string;
}


const parseJsonResponse = (content: string) => {
  const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(jsonStr);
};

const buildHttpError = async (response: Response) => {
  const errorText = await response.text();
  let errorCode = '';
  let errorMsg = errorText;

  try {
    const errJson = JSON.parse(errorText);
    errorCode = errJson.error?.code || errJson.code || '';
    errorMsg = errJson.error?.message || errJson.message || errorText;
  } catch {
    // noop
  }

  const codePart = errorCode ? `[${errorCode}] ` : '';
  return new Error(`HTTP ${response.status} - ${codePart}${errorMsg}`);
};

const ensureConfig = (config: ApiConfig) => {
  if (!config.llmKey || !config.baseUrl) {
    throw new Error('请先在 API 设置里填写 Base URL 和 API Key。');
  }
};

const normalizeCommands = (parsed: any): Partial<Command>[] => {
  if (Array.isArray(parsed)) return parsed;
  if (parsed.commands && Array.isArray(parsed.commands)) return parsed.commands;
  return [parsed];
};

const callChatJson = async (config: ApiConfig, systemPrompt: string, userPrompt: string) => {
  const response = await fetch('/api/backend/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      baseUrl: config.baseUrl,
      apiKey: config.llmKey,
      body: {
        model: config.modelName || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }
    })
  });

  if (!response.ok) {
    throw await buildHttpError(response);
  }

  const data = await response.json();
  return parseJsonResponse(data.choices[0].message.content);
};

export const llmService = {
  async searchCommands(query: string, config: ApiConfig): Promise<Partial<Command>[]> {
    ensureConfig(config);

    let searchContext = '';
    if (config.tavilyKey) {
      try {
        const tavilyRes = await fetch('/api/backend/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: config.tavilyKey,
            body: { api_key: config.tavilyKey, query, max_results: 5 }
          })
        });
        if (tavilyRes.ok) {
          const tavilyData = await tavilyRes.json();
          if (tavilyData.results?.length > 0) {
            searchContext =
              '以下是搜索到的参考资料：\n' +
              tavilyData.results.map((r: any) => `标题: ${r.title}\n内容: ${r.content}\nURL: ${r.url}`).join('\n\n');
          }
        }
      } catch (e) {
        console.warn('Tavily search failed:', e);
      }
    }

    const userPrompt = searchContext ? `用户需求：${query}\n\n${searchContext}\n\n请生成命令建议。` : `用户需求：${query}`;

    try {
      const parsed = await callChatJson(config, config.searchPrompt, userPrompt);
      return normalizeCommands(parsed);
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        throw new Error('请求失败，请检查网络连接、代理地址或服务端 CORS 配置。');
      }
      throw error;
    }
  },

  async extractCommandsFromUrl(
    url: string,
    config: ApiConfig,
    onProgress?: (progress: UrlExtractionProgress) => void
  ): Promise<Partial<Command>[]> {
    ensureConfig(config);

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    let lastStage = '';
    let lastStageAt = 0;

    const emitProgress = async (progress: UrlExtractionProgress, minStageDwellMs = 1500) => {
      if (!onProgress) return;

      const now = Date.now();
      const isStageChanged = progress.stage !== lastStage;

      if (isStageChanged && lastStageAt > 0) {
        const elapsed = now - lastStageAt;
        if (elapsed < minStageDwellMs) {
          await sleep(minStageDwellMs - elapsed);
        }
      }

      onProgress(progress);
      if (isStageChanged) {
        lastStage = progress.stage;
        lastStageAt = Date.now();
      }
    };

    try {
      let page: any = null;

      await emitProgress({ percent: 3, stage: '正在创建提取任务' });
      const startResponse = await fetch('/api/backend/extract-url/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (startResponse.ok) {
        const { jobId } = await startResponse.json();
        if (!jobId) {
          throw new Error('创建提取任务失败：缺少任务 ID');
        }

        while (!page) {
          const statusResponse = await fetch(`/api/backend/extract-url/status/${jobId}`);
          if (!statusResponse.ok) {
            throw await buildHttpError(statusResponse);
          }

          const status = await statusResponse.json();
          await emitProgress({
            percent: Math.min(70, Math.max(5, status.percent || 5)),
            stage: status.message || '正在提取网页内容'
          });

          if (status.failed) {
            throw new Error(status.error?.message || '网页提取失败');
          }

          if (!status.done) {
            await sleep(220);
            continue;
          }

          const resultResponse = await fetch(`/api/backend/extract-url/result/${jobId}`);
          if (!resultResponse.ok) {
            throw await buildHttpError(resultResponse);
          }

          page = await resultResponse.json();
        }
      } else if (startResponse.status === 404 || startResponse.status === 405) {
        await emitProgress({ percent: 25, stage: '当前环境不支持分阶段提取，切换为直连提取模式' }, 800);
        const extractResponse = await fetch('/api/backend/extract-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });

        if (!extractResponse.ok) {
          throw await buildHttpError(extractResponse);
        }

        page = await extractResponse.json();
        await emitProgress({ percent: 70, stage: '网页提取完成' });
      } else {
        throw await buildHttpError(startResponse);
      }

      const codeBlockSection =
        Array.isArray(page.codeBlocks) && page.codeBlocks.length > 0
          ? page.codeBlocks.map((block: string, index: number) => `代码块 ${index + 1}:\n${block}`).join('\n\n')
          : '无';
      const headingSection =
        Array.isArray(page.headings) && page.headings.length > 0 ? page.headings.join(' | ') : '无';

      await emitProgress({ percent: 78, stage: '正在整理网页语义上下文' });

      const pagePrompt = `请根据下面网页内容，提炼适合加入命令库的 CLI 命令。

网址：${page.url}
标题：${page.title || '无'}
简介：${page.description || '无'}
章节：${headingSection}

优先提取这些代码块中的命令：
${codeBlockSection}

正文摘录：
${page.content}

要求：
- 只输出页面中明确提到、或能从页面内容稳定推导出的命令。
- 如果页面是文档页，优先提取安装、配置、运行、排障类命令。
- 不要编造命令。`;

      await emitProgress({ percent: 80, stage: '已提交模型请求，等待返回结果' });

      const llmPromise = callChatJson(config, config.searchPrompt, pagePrompt);
      let parsed: any;
      let llmError: any;
      let llmDone = false;

      llmPromise
        .then((result) => {
          parsed = result;
          llmDone = true;
        })
        .catch((error) => {
          llmError = error;
          llmDone = true;
        });

      const llmStartAt = Date.now();
      while (!llmDone) {
        const elapsed = Date.now() - llmStartAt;
        const waitingPercent = Math.min(90, 80 + Math.floor((elapsed / (5 * 60 * 1000)) * 10));
        await emitProgress({
          percent: waitingPercent,
          stage: '模型处理中，正在等待返回结果'
        }, 1200);
        await sleep(1200);
      }

      if (llmError) {
        throw llmError;
      }

      await emitProgress({ percent: 92, stage: '模型已返回，正在整理命令结果' });

      const normalized = normalizeCommands(parsed);
      await emitProgress({ percent: 100, stage: '提取完成' }, 800);
      return normalized;
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        throw new Error('网页提取失败，请检查本地服务是否正常启动。');
      }
      throw error;
    }
  },

  async auditCommand(commandStr: string, config: ApiConfig): Promise<any> {
    ensureConfig(config);

    try {
      return await callChatJson(config, config.auditPrompt, `请分析这条命令：\n${commandStr}`);
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        throw new Error('请求失败，请检查网络连接、代理地址或服务端 CORS 配置。');
      }
      throw error;
    }
  }
};
