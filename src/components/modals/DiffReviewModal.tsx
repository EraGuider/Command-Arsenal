import React, { useEffect, useState } from 'react';
import { Command } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { X } from 'lucide-react';

interface DiffReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedCommands: Partial<Command>[];
}

export const DiffReviewModal: React.FC<DiffReviewModalProps> = ({ isOpen, onClose, generatedCommands }) => {
  const { addCommand, showToast } = useAppContext();
  const [selectedIndices, setSelectedIndices] = useState<number[]>(generatedCommands.map((_, i) => i));

  useEffect(() => {
    setSelectedIndices(generatedCommands.map((_, i) => i));
  }, [generatedCommands, isOpen]);

  if (!isOpen) return null;

  const handleToggle = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleMerge = () => {
    const commandsToMerge = selectedIndices.map((i) => generatedCommands[i]);
    let addedCount = 0;
    let duplicateCount = 0;

    commandsToMerge.forEach((cmd) => {
      const added = addCommand({
        id: crypto.randomUUID(),
        scenario: cmd.scenario || 'AI 生成',
        icon: cmd.icon || '✨',
        command: cmd.command || '',
        description: cmd.description || '',
        params: cmd.params || [],
        tool: cmd.tool || '',
        addedAt: new Date().toISOString()
      });

      if (added) {
        addedCount += 1;
      } else {
        duplicateCount += 1;
      }
    });

    if (addedCount > 0 && duplicateCount === 0) {
      showToast(`已加入 ${addedCount} 条命令`);
    } else if (addedCount > 0 && duplicateCount > 0) {
      showToast(`已加入 ${addedCount} 条，跳过 ${duplicateCount} 条重复命令`);
    } else {
      showToast('所选命令均已存在，未重复添加');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[70] flex justify-center items-start overflow-y-auto py-10 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-stone-200 overflow-hidden transform transition-all relative mt-10 mb-10">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-stone-800">AI 命令建议</h3>
            <p className="text-xs text-stone-500 mt-1">勾选想保留的条目，再批量加入你的命令库。</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 bg-stone-50/50">
          {generatedCommands.length === 0 ? (
            <div className="text-center py-8 text-stone-500">没有生成可用命令。</div>
          ) : (
            generatedCommands.map((cmd, idx) => (
              <div key={idx} className="diff-new border border-green-200 bg-green-50/30 rounded-xl p-4 flex gap-3 shadow-sm">
                <input
                  type="checkbox"
                  checked={selectedIndices.includes(idx)}
                  onChange={() => handleToggle(idx)}
                  className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">AI 推荐</span>
                    <span className="text-xs bg-white border border-stone-200 px-2 py-0.5 rounded text-stone-600">
                      {cmd.icon} {cmd.scenario}
                    </span>
                  </div>
                  <code className="text-sm font-bold text-stone-800 break-all">{cmd.command}</code>
                  <p className="text-xs text-stone-600 mt-1">{cmd.description}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 bg-white flex justify-between items-center sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <span className="text-xs text-stone-500 font-medium">
            共生成 {generatedCommands.length} 条建议，当前选中 {selectedIndices.length} 条
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors border border-transparent">
              取消
            </button>
            <button
              onClick={handleMerge}
              disabled={selectedIndices.length === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
            >
              加入命令库
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
