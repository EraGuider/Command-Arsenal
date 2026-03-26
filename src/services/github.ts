import { Command } from '../types';

export const githubService = {
  async syncToGist(commands: Command[], token: string, gistId?: string): Promise<string> {
    if (!token) throw new Error('GitHub Token 未填写。');

    const fileName = 'openclaw_arsenal.json';
    const content = JSON.stringify(commands, null, 2);

    const body = {
      description: 'OpenClaw Command Arsenal Backup',
      public: false,
      files: {
        [fileName]: { content }
      }
    };

    let url = 'https://api.github.com/gists';
    let method = 'POST';

    if (gistId) {
      url = `${url}/${gistId}`;
      method = 'PATCH';
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`GitHub API 错误 (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.id;
  },

  async pullFromGist(token: string, gistId: string): Promise<Command[]> {
    if (!token) throw new Error('GitHub Token 未填写。');
    if (!gistId) throw new Error('Gist ID 未填写。');

    const url = `https://api.github.com/gists/${gistId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`GitHub API 错误 (${response.status}): ${err}`);
    }

    const data = await response.json();
    const fileName = 'openclaw_arsenal.json';

    if (!data.files || !data.files[fileName]) {
      throw new Error('目标 Gist 中找不到 openclaw_arsenal.json。');
    }

    const content = data.files[fileName].content;
    try {
      return JSON.parse(content);
    } catch {
      throw new Error('Gist 文件内容不是有效的 JSON。');
    }
  }
};
