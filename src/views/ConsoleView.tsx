import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Command } from '../types';
import { Search, Plus, Download, Upload, ArrowLeft, Edit2, Trash2, Github, Settings } from 'lucide-react';
import { CommandModal } from '../components/modals/CommandModal';
import { ApiSettingsModal } from '../components/modals/ApiSettingsModal';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { DEFAULT_COMMANDS } from '../constants';
import { githubService } from '../services/github';

interface ConsoleViewProps {
  onSwitchView: (view: 'dashboard') => void;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({ onSwitchView }) => {
  const { commands, setCommands, deleteCommand, apiConfig, gistConfig, updateGistConfig, showToast } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', onConfirm: () => {} });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = useMemo(() => {
    const keyword = searchQuery.toLowerCase();
    return commands.filter(
      (c) =>
        c.command.toLowerCase().includes(keyword) ||
        c.description.toLowerCase().includes(keyword) ||
        c.scenario.toLowerCase().includes(keyword)
    );
  }, [commands, searchQuery]);

  const groupedCommands = useMemo(() => {
    const grouped: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!grouped[cmd.scenario]) grouped[cmd.scenario] = [];
      grouped[cmd.scenario].push(cmd);
    });
    return grouped;
  }, [filteredCommands]);

  const handleOpenCommandModal = (cmd?: Command) => {
    setEditingCommand(cmd || null);
    setIsCommandModalOpen(true);
  };

  const handleDeleteCommand = (id: string) => {
    setConfirmConfig({
      title: '删除命令',
      message: '删除后无法恢复，确认继续吗？',
      onConfirm: () => {
        deleteCommand(id);
        showToast('命令已删除');
        setIsConfirmOpen(false);
      }
    });
    setIsConfirmOpen(true);
  };

  const handleReset = () => {
    setConfirmConfig({
      title: '恢复默认命令',
      message: '这会用默认命令集覆盖当前列表，建议先导出备份。',
      onConfirm: () => {
        setCommands(DEFAULT_COMMANDS);
        showToast('已恢复默认命令');
        setIsConfirmOpen(false);
      }
    });
    setIsConfirmOpen(true);
  };

  const handleExport = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(commands, null, 2))}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'command-arsenal-backup.json');
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast('已导出 JSON 备份');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const importedData = JSON.parse(evt.target?.result as string);
        if (Array.isArray(importedData) && importedData.every((item) => typeof item.command === 'string')) {
          setCommands(importedData);
          showToast('命令已导入');
        } else {
          showToast('导入失败：文件内容不是有效的命令数组。', 4000);
        }
      } catch {
        showToast('导入失败：JSON 解析出错。', 4000);
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleSyncPush = async () => {
    if (!apiConfig.githubKey) {
      showToast('请先填写 GitHub Token。');
      setIsApiModalOpen(true);
      return;
    }

    showToast('正在同步到 GitHub Gist...', 3000);
    try {
      const gistId = await githubService.syncToGist(commands, apiConfig.githubKey, gistConfig.gistId);
      updateGistConfig({ gistId, lastSync: new Date().toISOString() });
      showToast('已同步到 GitHub Gist');
    } catch (e: any) {
      showToast(e.message, 5000);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="sticky top-0 z-40 mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-stone-200">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <Settings size={24} /> 命令管理台
          </h2>
          <p className="text-sm text-stone-500 mt-1">管理命令内容、备份和 API 设置。</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
          <div className="relative w-full sm:w-auto flex-grow">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="搜索命令、说明或分类"
            />
          </div>

          <button
            onClick={() => handleOpenCommandModal()}
            className="flex-1 sm:flex-none bg-stone-800 hover:bg-stone-900 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm text-center flex items-center justify-center gap-1"
          >
            <Plus size={16} /> 新建
          </button>

          <div className="w-px h-6 bg-stone-300 mx-1 hidden lg:block"></div>

          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-1"
          >
            <Download size={16} /> 导入
          </button>
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-1"
          >
            <Upload size={16} /> 导出
          </button>
          <button
            onClick={handleSyncPush}
            className="flex-1 sm:flex-none bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-1"
          >
            <Github size={16} /> 备份 Gist
          </button>

          <div className="w-px h-6 bg-stone-300 mx-1 hidden lg:block"></div>

          <button
            onClick={() => setIsApiModalOpen(true)}
            className="flex-1 sm:flex-none bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-1"
          >
            <Settings size={16} /> API 设置
          </button>
          <button
            onClick={handleReset}
            className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-1"
          >
            <Trash2 size={16} /> 重置
          </button>
          <button
            onClick={() => onSwitchView('dashboard')}
            className="flex-1 sm:flex-none bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors text-center shadow-sm flex items-center justify-center gap-1"
          >
            <ArrowLeft size={16} /> 返回
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 relative items-start">
        <div className="w-full md:w-56 lg:w-64 flex-shrink-0 sticky top-[104px] hidden md:block z-30">
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
            <h3 className="text-xs font-bold tracking-wider text-stone-400 uppercase mb-3 px-2">分类导航</h3>
            <ul className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {Object.keys(groupedCommands).length === 0 ? (
                <li className="text-stone-400 text-xs px-2 text-center py-4">暂无结果</li>
              ) : (
                (Object.entries(groupedCommands) as [string, Command[]][]).map(([cat, items]) => (
                  <li key={cat}>
                    <a
                      href={`#console-cat-${cat.replace(/\s+/g, '-')}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-stone-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border border-transparent hover:border-indigo-100"
                    >
                      <span className="text-base">{items[0].icon}</span>
                      <span className="font-medium truncate flex-1">{cat}</span>
                      <span className="text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-md font-bold">{items.length}</span>
                    </a>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="flex-1 w-full min-w-0 space-y-6">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="p-12 text-center text-stone-500 bg-white rounded-2xl border border-stone-200 shadow-sm">
              没有找到匹配的命令。
            </div>
          ) : (
            (Object.entries(groupedCommands) as [string, Command[]][]).map(([cat, items]) => (
              <div
                key={cat}
                id={`console-cat-${cat.replace(/\s+/g, '-')}`}
                style={{ scrollMarginTop: '104px' }}
                className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between mb-5 border-b border-stone-100 pb-3">
                  <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <span className="bg-stone-100 p-1.5 rounded-lg text-xl">{items[0].icon}</span>
                    {cat}
                  </h3>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold shadow-inner">
                    {items.length} 条命令
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group/card relative flex flex-col justify-between border border-stone-200 hover:border-indigo-400 bg-stone-50 hover:bg-white rounded-xl p-4 transition-all"
                    >
                      <div>
                        <div className="font-mono text-sm font-bold text-indigo-700 mb-1.5 break-all">{item.command}</div>
                        <div className="text-xs text-stone-500 leading-relaxed line-clamp-2" title={item.description}>
                          {item.description}
                        </div>
                        {item.params && item.params.length > 0 && (
                          <div className="mt-2 text-[10px] text-stone-500 font-mono bg-stone-200 px-2 py-0.5 rounded-md inline-block shadow-inner">
                            + {item.params.length} 个参数
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-stone-200/60 opacity-60 group-hover/card:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenCommandModal(item)}
                          className="text-xs bg-white border border-stone-300 text-stone-700 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm font-medium"
                        >
                          <Edit2 size={12} /> 编辑
                        </button>
                        <button
                          onClick={() => handleDeleteCommand(item.id)}
                          className="text-xs bg-white border border-stone-300 text-stone-700 hover:text-red-600 hover:border-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm font-medium"
                        >
                          <Trash2 size={12} /> 删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <CommandModal isOpen={isCommandModalOpen} onClose={() => setIsCommandModalOpen(false)} editingCommand={editingCommand} />
      <ApiSettingsModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
