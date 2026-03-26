import React from 'react';
import { Command } from '../types';
import { useAppContext } from '../context/AppContext';
import { Copy } from 'lucide-react';

interface CommandCardProps {
  command: Command;
}

export const CommandCard: React.FC<CommandCardProps> = ({ command }) => {
  const { showToast } = useAppContext();

  const handleCopy = () => {
    navigator.clipboard.writeText(command.command);
    showToast('命令已复制到剪贴板');
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-stone-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all flex flex-col h-full group">
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 flex items-center gap-1">
          {command.icon} {command.scenario}
        </span>
        <span className="text-2xl drop-shadow-sm">{command.icon}</span>
      </div>
      <div className="bg-slate-800 text-green-400 font-mono text-sm p-4 rounded-xl mb-4 flex justify-between items-center shadow-inner relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400"></div>
        <code className="break-all pr-4 font-bold tracking-tight">{command.command}</code>
        <button
          onClick={handleCopy}
          className="text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 shadow-sm active:scale-95"
          title="复制命令"
        >
          <Copy size={16} />
        </button>
      </div>
      <p className="text-stone-600 text-sm flex-grow leading-relaxed font-medium">{command.description}</p>

      {command.params && command.params.length > 0 && (
        <div className="mt-4 pt-4 border-t border-stone-100">
          <ul className="space-y-2">
            {command.params.map((p, idx) => (
              <li key={idx} className="flex flex-col sm:flex-row sm:items-start text-[13px] gap-1 sm:gap-2">
                <code className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50 w-fit font-mono font-bold whitespace-nowrap">
                  {p.flag}
                </code>
                <span className="text-stone-500 mt-0.5 flex-1">{p.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
