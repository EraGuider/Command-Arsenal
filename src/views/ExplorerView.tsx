import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { CommandCard } from '../components/CommandCard';
import { PRIMARY_CATEGORIES } from '../constants';
import { Search, Sparkles, Settings, ChevronDown, ChevronUp, ShieldAlert, Link2 } from 'lucide-react';
import { llmService, UrlExtractionProgress } from '../services/llm';
import { DiffReviewModal } from '../components/modals/DiffReviewModal';
import { AuditModal } from '../components/modals/AuditModal';

interface ExplorerViewProps {
  onSwitchView: (view: 'console') => void;
}

const looksLikeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  return /^[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(trimmed);
};

export const ExplorerView: React.FC<ExplorerViewProps> = ({ onSwitchView }) => {
  const { commands, apiConfig, showToast } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [urlProgress, setUrlProgress] = useState<UrlExtractionProgress | null>(null);
  const [generatedCommands, setGeneratedCommands] = useState<any[]>([]);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const categories = useMemo(() => Array.from(new Set(commands.map((c) => c.scenario))), [commands]);
  const isUrlMode = looksLikeUrl(searchQuery);

  const filteredCommands = useMemo(() => {
    return commands.filter((item) => {
      const matchCategory = activeCategory === '全部' || item.scenario === activeCategory;
      const paramText = item.params?.map((p) => `${p.flag} ${p.note}`).join(' ').toLowerCase() || '';
      const keyword = searchQuery.toLowerCase();
      const matchSearch =
        item.command.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        paramText.includes(keyword) ||
        item.scenario.toLowerCase().includes(keyword);

      return matchCategory && matchSearch;
    });
  }, [commands, activeCategory, searchQuery]);

  const handleSmartSearch = async () => {
    const input = searchQuery.trim();
    if (!input) {
      showToast('先输入关键词或网址。');
      return;
    }

    setIsSearching(true);
    if (isUrlMode) {
      setUrlProgress({ percent: 0, stage: '准备开始提取' });
      showToast('正在提取网页内容并生成命令...');
    } else {
      setUrlProgress(null);
      showToast(`正在搜索相关命令：${input}`);
    }

    try {
      const results = isUrlMode
        ? await llmService.extractCommandsFromUrl(input, apiConfig, (progress) => setUrlProgress(progress))
        : await llmService.searchCommands(input, apiConfig);
      setGeneratedCommands(results);
      setIsDiffModalOpen(true);
    } catch (e: any) {
      showToast(e.message, 5000);
    } finally {
      setIsSearching(false);
      if (isUrlMode) {
        setTimeout(() => setUrlProgress(null), 1200);
      }
    }
  };

  const getCategoryIcon = (catName: string) => {
    const cmd = commands.find((c) => c.scenario === catName);
    return cmd ? cmd.icon : '📁';
  };

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-10 text-center relative max-w-4xl mx-auto">
        <div className="absolute right-0 top-0 flex gap-2">
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="bg-white border border-stone-200 hover:border-indigo-300 hover:text-indigo-600 text-stone-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 group"
          >
            <ShieldAlert size={16} />
            <span className="hidden md:inline group-hover:text-indigo-600 transition-colors">命令审计</span>
          </button>
          <button
            onClick={() => onSwitchView('console')}
            className="bg-white border border-stone-200 hover:border-indigo-300 hover:text-indigo-600 text-stone-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 group"
          >
            <Settings size={16} />
            <span className="hidden md:inline group-hover:text-indigo-600 transition-colors">管理台</span>
          </button>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-stone-900 tracking-tight mb-4 pt-14 md:pt-0">
          命令 <span className="text-indigo-600">Arsenal</span>
        </h1>
        <p className="text-lg text-stone-500 mb-8">搜索命令、分析命令，也可以直接粘贴网址提取页面里的可用命令。</p>

        <div className="relative w-full max-w-2xl mx-auto shadow-sm rounded-2xl group focus-within:shadow-md transition-shadow mb-4 flex items-center bg-white/80 backdrop-blur-sm border-2 border-stone-200 focus-within:border-indigo-500 pr-2 overflow-hidden">
          <span className="pl-4 pr-2 text-stone-400 group-focus-within:text-indigo-500 transition-colors">
            {isUrlMode ? <Link2 size={24} /> : <Search size={24} />}
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch()}
            className="w-full py-4 text-lg bg-transparent focus:ring-0 outline-none transition-colors"
            placeholder="输入关键词，或直接粘贴文档网址"
          />
          <button
            type="button"
            onClick={handleSmartSearch}
            disabled={isSearching}
            className="hidden md:flex ml-2 items-center gap-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors whitespace-nowrap opacity-0 group-focus-within:opacity-100 border border-indigo-100 disabled:opacity-50"
          >
            <Sparkles size={16} />
            {isSearching ? (isUrlMode ? `提取中 ${urlProgress?.percent ?? 0}%` : '处理中...') : isUrlMode ? '提取命令' : 'AI 搜索'}
          </button>
        </div>

        <p className="text-sm text-stone-500 mb-4">
          {isUrlMode ? '已检测到网址，将抓取页面内容后提炼命令建议。' : '支持自然语言检索，例如“查看网关日志”或“配置模型”。'}
        </p>

        {isUrlMode && isSearching && urlProgress && (
          <div className="w-full max-w-2xl mx-auto bg-white border border-stone-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
              <span>{urlProgress.stage}</span>
              <span className="font-bold text-indigo-600">{urlProgress.percent}%</span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                style={{ width: `${urlProgress.percent}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            <button
              onClick={() => setActiveCategory('全部')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                activeCategory === '全部'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'border-stone-200 text-stone-600 bg-white hover:bg-stone-50 hover:border-stone-300'
              }`}
            >
              全部
            </button>
            {categories
              .filter((c) => PRIMARY_CATEGORIES.includes(c))
              .map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'border-stone-200 text-stone-600 bg-white hover:bg-stone-50 hover:border-stone-300'
                  }`}
                >
                  {getCategoryIcon(cat)} {cat}
                </button>
              ))}
          </div>

          <div
            className={`${
              isAdvancedOpen ? 'flex' : 'hidden'
            } flex-col items-center mt-4 pt-4 border-t border-stone-200/60 transition-all`}
          >
            <p className="text-xs text-stone-400 font-medium tracking-wider uppercase mb-3 flex items-center gap-1">
              <Settings size={14} /> 更多分类
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {categories
                .filter((c) => !PRIMARY_CATEGORIES.includes(c))
                .map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      activeCategory === cat
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'border-stone-200 text-stone-600 bg-white hover:bg-stone-50 hover:border-stone-300'
                    }`}
                  >
                    {getCategoryIcon(cat)} {cat}
                  </button>
                ))}
            </div>
          </div>

          {categories.filter((c) => !PRIMARY_CATEGORIES.includes(c)).length > 0 && (
            <div className="flex justify-center mt-3">
              <button
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="text-xs font-medium text-stone-500 hover:text-indigo-600 flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-indigo-50 transition-colors"
              >
                {isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>{isAdvancedOpen ? '收起更多分类' : '展开更多分类'}</span>
              </button>
            </div>
          )}
        </div>

        {filteredCommands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCommands.map((cmd) => (
              <CommandCard key={cmd.id} command={cmd} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/50 backdrop-blur-sm border border-stone-200 rounded-2xl mt-4">
            <span className="text-5xl mb-4 block">{isUrlMode ? '🔗' : '🔎'}</span>
            <h3 className="text-xl font-bold text-stone-800 mb-2">{isUrlMode ? '从网址提取命令建议' : '没有找到匹配的命令'}</h3>
            <p className="text-stone-500 text-sm mb-6">
              {isUrlMode ? '点击下方按钮抓取页面并生成候选命令。' : '可以继续调整关键词，或者让 AI 帮你补全这类命令。'}
            </p>
            <button
              onClick={handleSmartSearch}
              disabled={isSearching}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-3 rounded-xl text-base font-bold transition-all shadow-md flex items-center gap-2 mx-auto"
            >
              <Sparkles size={20} />{' '}
              {isSearching ? (isUrlMode ? `提取中 ${urlProgress?.percent ?? 0}%` : '处理中...') : isUrlMode ? '提取网页命令' : '让 AI 帮我找'}
            </button>
          </div>
        )}
      </div>

      <DiffReviewModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        generatedCommands={generatedCommands}
      />
      <AuditModal isOpen={isAuditModalOpen} onClose={() => setIsAuditModalOpen(false)} />
    </div>
  );
};
