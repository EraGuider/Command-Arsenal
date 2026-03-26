import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { llmService } from '../../services/llm';
import { X, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose }) => {
  const { apiConfig, addCommand, showToast } = useAppContext();
  const [commandStr, setCommandStr] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleAudit = async () => {
    if (!commandStr.trim()) return;
    setIsAuditing(true);
    try {
      const result = await llmService.auditCommand(commandStr, apiConfig);
      setAuditResult(result);
    } catch (e: any) {
      showToast(e.message, 4000);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSave = () => {
    if (!auditResult) return;
    addCommand({
      id: crypto.randomUUID(),
      scenario: auditResult.suggestedScenario || '安全审计',
      icon: auditResult.suggestedIcon || '🛡️',
      command: commandStr,
      description: auditResult.explanation,
      params: [],
      addedAt: new Date().toISOString()
    });
    showToast('已将审计结果保存为命令');
    onClose();
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[70] flex justify-center items-start overflow-y-auto py-10 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-stone-200 overflow-hidden transform transition-all relative mt-10 mb-10">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <ShieldAlert size={20} className="text-indigo-600" /> 命令安全审计
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">输入要分析的命令</label>
            <textarea
              rows={4}
              value={commandStr}
              onChange={(e) => setCommandStr(e.target.value)}
              placeholder="例如：curl -sSL https://example.com/install.sh | bash"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-stone-800 bg-stone-50"
            />
            <button
              onClick={handleAudit}
              disabled={isAuditing || !commandStr.trim()}
              className="mt-3 px-5 py-2 bg-stone-800 hover:bg-stone-900 disabled:bg-stone-400 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              {isAuditing ? '审计中...' : '开始审计'}
            </button>
          </div>

          {auditResult && (
            <div className="border-t border-stone-200 pt-6 space-y-4">
              <div className={`p-4 rounded-xl border ${getRiskColor(auditResult.securityRiskLevel)} flex items-start gap-3`}>
                {auditResult.securityRiskLevel?.toLowerCase() === 'low' ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
                <div>
                  <h4 className="font-bold">风险等级：{auditResult.securityRiskLevel}</h4>
                  {auditResult.securityWarnings?.length > 0 ? (
                    <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                      {auditResult.securityWarnings.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm mt-1">没有检测到明显的高风险操作。</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-stone-800 mb-2">整体说明</h4>
                <p className="text-sm text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-200">{auditResult.explanation}</p>
              </div>

              <div>
                <h4 className="font-bold text-stone-800 mb-2">命令拆解</h4>
                <div className="space-y-2">
                  {auditResult.breakdown?.map((b: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-2 text-sm border-b border-stone-100 pb-2">
                      <code className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded sm:w-1/3 break-all">{b.part}</code>
                      <span className="text-stone-600 sm:w-2/3 py-1">{b.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex justify-end items-center sticky bottom-0 z-10">
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors border border-transparent">
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!auditResult}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
            >
              保存为命令
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
