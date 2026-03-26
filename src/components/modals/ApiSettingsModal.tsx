import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ApiConfig } from '../../types';
import { X, Key, Bot, Search, FileText, Settings } from 'lucide-react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({ isOpen, onClose }) => {
  const { apiConfig, updateApiConfig, showToast } = useAppContext();
  const [config, setConfig] = useState<ApiConfig>(apiConfig);
  const [activeTab, setActiveTab] = useState<'api' | 'prompts'>('api');

  useEffect(() => {
    if (isOpen) {
      setConfig(apiConfig);
    }
  }, [isOpen, apiConfig]);

  if (!isOpen) return null;

  const handleChange = (field: keyof ApiConfig, value: string) => {
    setConfig({ ...config, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateApiConfig(config);
    showToast('API 设置已保存');
    onClose();
  };

  const testConnection = async (type: 'llm' | 'tavily' | 'github') => {
    let key = '';
    let serviceName = '';

    if (type === 'llm') {
      key = config.llmKey;
      serviceName = 'LLM API';
    } else if (type === 'tavily') {
      key = config.tavilyKey;
      serviceName = 'Tavily API';
    } else {
      key = config.githubKey;
      serviceName = 'GitHub Token';
    }

    if (!key) {
      showToast(`请先填写 ${serviceName}`);
      return;
    }

    showToast(`正在测试 ${serviceName}...`, 3000);

    try {
      let response;
      if (type === 'llm') {
        response = await fetch('/api/backend/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseUrl: config.baseUrl,
            apiKey: key,
            body: {
              model: config.modelName || 'gpt-4o',
              messages: [{ role: 'user', content: 'Hi' }],
              max_tokens: 1
            }
          })
        });
      } else if (type === 'tavily') {
        response = await fetch('/api/backend/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: key, body: { api_key: key, query: 'test', max_results: 1 } })
        });
      } else {
        response = await fetch('/api/backend/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: key })
        });
      }

      if (response.ok) {
        showToast(`${serviceName} 连接成功`);
        return;
      }

      const errorText = await response.text();
      let errorCode = '';
      let errorMsg = '';
      try {
        const errorData = JSON.parse(errorText);
        errorCode = errorData.error?.code || errorData.code || '';
        errorMsg = errorData.error?.message || errorData.message || JSON.stringify(errorData);
      } catch {
        errorMsg = errorText.substring(0, 150);
      }
      const codePart = errorCode ? `[${errorCode}] ` : '';
      showToast(`测试失败：HTTP ${response.status} - ${codePart}${errorMsg || '未知错误'}`, 5000);
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        showToast('测试失败：网络请求未成功，请检查代理地址或 CORS 配置。', 8000);
      } else {
        showToast(`测试失败：${error.message}`, 5000);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[80] flex justify-center items-start overflow-y-auto py-10 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-stone-200 overflow-hidden transform transition-all relative">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Settings size={20} className="text-indigo-600" /> API 设置
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-stone-200 bg-stone-50/50">
          <button
            onClick={() => setActiveTab('api')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'api'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Key size={16} /> API 密钥
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'prompts'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
            }`}
          >
            <FileText size={16} /> 系统提示词
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {activeTab === 'api' && (
              <>
                <p className="text-sm text-stone-500 mb-5">这里配置模型、搜索和 GitHub 同步所需的连接信息。</p>

                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 font-bold text-stone-800 text-sm flex items-center gap-2">
                    <Bot size={16} /> LLM 配置
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">模型名称</label>
                      <input
                        type="text"
                        value={config.modelName}
                        onChange={(e) => handleChange('modelName', e.target.value)}
                        required
                        placeholder="例如：gpt-4o"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Base URL</label>
                      <input
                        type="text"
                        value={config.baseUrl}
                        onChange={(e) => handleChange('baseUrl', e.target.value)}
                        required
                        placeholder="例如：https://api.openai.com/v1"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">LLM API Key</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={config.llmKey}
                          onChange={(e) => handleChange('llmKey', e.target.value)}
                          required
                          placeholder="sk-..."
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => testConnection('llm')}
                          className="px-5 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-sm font-bold transition-colors shadow-sm flex-shrink-0"
                        >
                          测试
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 font-bold text-stone-800 text-sm flex items-center gap-2">
                    <Search size={16} /> 搜索与同步
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Tavily API Key（可选）</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={config.tavilyKey}
                          onChange={(e) => handleChange('tavilyKey', e.target.value)}
                          placeholder="tvly-..."
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => testConnection('tavily')}
                          className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-bold transition-colors border border-stone-300 flex-shrink-0"
                        >
                          测试
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">GitHub Token</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={config.githubKey}
                          onChange={(e) => handleChange('githubKey', e.target.value)}
                          placeholder="ghp_..."
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => testConnection('github')}
                          className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-bold transition-colors border border-stone-300 flex-shrink-0"
                        >
                          测试
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'prompts' && (
              <>
                <p className="text-sm text-stone-500 mb-5">这些提示词会直接影响 AI 搜索、同步和安全审计的输出质量。</p>
                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-indigo-50/50 px-4 py-3 border-b border-stone-200 font-bold text-indigo-900 text-sm flex items-center gap-2">
                    系统提示词
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">1. 搜索命令 Prompt</label>
                      <textarea
                        value={config.searchPrompt}
                        onChange={(e) => handleChange('searchPrompt', e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-[13px] leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-stone-600 resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">2. 同步命令 Prompt</label>
                      <textarea
                        value={config.syncPrompt}
                        onChange={(e) => handleChange('syncPrompt', e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-[13px] leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-stone-600 resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">3. 安全审计 Prompt</label>
                      <textarea
                        value={config.auditPrompt}
                        onChange={(e) => handleChange('auditPrompt', e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-[13px] leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-stone-600 resize-y"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-8 flex justify-end items-center pt-4 border-t border-stone-100 sticky bottom-0 bg-white">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors border border-transparent"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-bold shadow-sm transition-colors ring-1 ring-stone-900 ring-offset-1"
              >
                保存设置
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
