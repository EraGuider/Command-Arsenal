import React, { useState, useEffect } from 'react';
import { Command, CommandParam } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { X, Plus, Trash2 } from 'lucide-react';

interface CommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCommand?: Command | null;
}

export const CommandModal: React.FC<CommandModalProps> = ({ isOpen, onClose, editingCommand }) => {
  const { commands, addCommand, updateCommand, showToast } = useAppContext();

  const [scenario, setScenario] = useState('');
  const [icon, setIcon] = useState('📚');
  const [commandStr, setCommandStr] = useState('');
  const [description, setDescription] = useState('');
  const [params, setParams] = useState<CommandParam[]>([]);

  const categories = Array.from(new Set(commands.map((c) => c.scenario)));

  useEffect(() => {
    if (editingCommand) {
      setScenario(editingCommand.scenario);
      setIcon(editingCommand.icon);
      setCommandStr(editingCommand.command);
      setDescription(editingCommand.description);
      setParams(editingCommand.params || []);
    } else {
      setScenario('');
      setIcon('📚');
      setCommandStr('');
      setDescription('');
      setParams([]);
    }
  }, [editingCommand, isOpen]);

  if (!isOpen) return null;

  const handleAddParam = () => {
    setParams([...params, { flag: '', note: '' }]);
  };

  const handleParamChange = (index: number, field: keyof CommandParam, value: string) => {
    const newParams = [...params];
    newParams[index][field] = value;
    setParams(newParams);
  };

  const handleRemoveParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validParams = params.filter((p) => p.flag.trim() && p.note.trim());

    const newCmd: Command = {
      id: editingCommand ? editingCommand.id : crypto.randomUUID(),
      scenario: scenario.trim(),
      icon: icon.trim() || '📚',
      command: commandStr.trim(),
      description: description.trim(),
      params: validParams,
      addedAt: editingCommand ? editingCommand.addedAt : new Date().toISOString()
    };

    if (editingCommand) {
      updateCommand(newCmd.id, newCmd);
      showToast('命令已更新');
    } else {
      addCommand(newCmd);
      showToast('命令已创建');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex justify-center items-start overflow-y-auto py-10 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-stone-200 overflow-hidden transform transition-all relative mt-10 mb-10">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-stone-800">{editingCommand ? '编辑命令' : '新建命令'}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">分类</label>
              <input
                type="text"
                required
                placeholder="例如：基础使用"
                list="categoryOptions"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <datalist id="categoryOptions">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">图标</label>
              <input
                type="text"
                required
                placeholder="例如：🚀"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">命令</label>
            <input
              type="text"
              required
              placeholder="例如：openclaw gateway start"
              value={commandStr}
              onChange={(e) => setCommandStr(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-stone-800 border-l-4 border-l-indigo-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-1">说明</label>
            <textarea
              required
              rows={2}
              placeholder="描述这个命令的用途和使用时机"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="mb-6 border-t border-stone-100 pt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-stone-700">参数</label>
              <button
                type="button"
                onClick={handleAddParam}
                className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded font-medium border border-indigo-100 transition-colors flex items-center gap-1"
              >
                <Plus size={14} /> 添加参数
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {params.map((param, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 items-start">
                  <input
                    type="text"
                    placeholder="参数，如 --force"
                    value={param.flag}
                    onChange={(e) => handleParamChange(index, 'flag', e.target.value)}
                    className="w-full sm:w-1/3 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="参数说明"
                    value={param.note}
                    onChange={(e) => handleParamChange(index, 'note', e.target.value)}
                    className="w-full sm:w-2/3 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveParam(index)}
                    className="w-full sm:w-auto bg-red-50 text-red-500 hover:bg-red-100 p-2 rounded-lg border border-red-100 transition-colors flex-shrink-0 flex justify-center items-center"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors border border-transparent"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
