import { Command, ApiConfig } from './types';

export const DEFAULT_COMMANDS: Command[] = [
  {
    id: '1',
    scenario: '基础使用',
    icon: '🚀',
    command: '/new',
    description: '创建一个新的会话或任务。',
    params: [],
    addedAt: new Date().toISOString()
  },
  {
    id: '2',
    scenario: '基础使用',
    icon: '🚀',
    command: '/model gpt-4o',
    description: '切换当前使用的模型。',
    params: [{ flag: '/model <name>', note: '指定模型名称，例如 gpt-4o。' }],
    addedAt: new Date().toISOString()
  },
  {
    id: '3',
    scenario: '基础使用',
    icon: '🚀',
    command: 'openclaw agent --model fast --message "你好"',
    description: '以指定模型和初始消息启动智能代理。',
    params: [
      { flag: '--model fast', note: '使用更快的模型配置。' },
      { flag: '--message "你好"', note: '传入启动时的提示内容。' }
    ],
    addedAt: new Date().toISOString()
  },
  {
    id: '4',
    scenario: '消息发送',
    icon: '💬',
    command: 'openclaw message send --channel telegram --target @user --message "Hello"',
    description: '向指定渠道和目标发送单条消息。',
    params: [
      { flag: '--channel telegram', note: '指定发送渠道。' },
      { flag: '--target @user', note: '指定接收对象。' },
      { flag: '--message "Hello"', note: '指定消息内容。' }
    ],
    addedAt: new Date().toISOString()
  },
  {
    id: '5',
    scenario: '环境配置',
    icon: '⚙️',
    command: 'openclaw setup',
    description: '初始化本地运行环境。',
    params: [],
    addedAt: new Date().toISOString()
  },
  {
    id: '6',
    scenario: '环境配置',
    icon: '⚙️',
    command: 'openclaw configure --section models',
    description: '打开配置项并编辑模型相关设置。',
    params: [{ flag: '--section models', note: '聚焦到 models 配置段。' }],
    addedAt: new Date().toISOString()
  },
  {
    id: '7',
    scenario: '诊断排障',
    icon: '🩺',
    command: 'openclaw doctor --fix',
    description: '诊断当前环境并尝试自动修复常见问题。',
    params: [
      { flag: '--fix', note: '自动修复可处理的问题。' },
      { flag: '--check gateway', note: '仅检查网关相关状态。' }
    ],
    addedAt: new Date().toISOString()
  },
  {
    id: '8',
    scenario: '诊断排障',
    icon: '🩺',
    command: 'openclaw logs --lines 50 --filter error',
    description: '查看最近日志并过滤错误信息。',
    params: [
      { flag: '--lines 50', note: '显示最近 50 行日志。' },
      { flag: '--filter error', note: '仅显示包含 error 的日志。' }
    ],
    addedAt: new Date().toISOString()
  },
  {
    id: '9',
    scenario: '维护操作',
    icon: '🧹',
    command: 'openclaw update --dry-run',
    description: '检查更新但不立即执行升级。',
    params: [{ flag: '--dry-run', note: '只预览更新结果。' }],
    addedAt: new Date().toISOString()
  },
  {
    id: '10',
    scenario: '维护操作',
    icon: '🧹',
    command: 'openclaw uninstall',
    description: '卸载 OpenClaw CLI。',
    params: [],
    addedAt: new Date().toISOString()
  },
  {
    id: '11',
    scenario: '网关管理',
    icon: '🌐',
    command: 'openclaw gateway start --port 19000',
    description: '启动本地网关并指定端口。',
    params: [
      { flag: '--port 19000', note: '指定监听端口。' },
      { flag: '--force', note: '端口占用时强制启动。' }
    ],
    addedAt: new Date().toISOString()
  },
  {
    id: '12',
    scenario: '知识检索',
    icon: '📚',
    command: 'openclaw memory search "gateway error" --lines 5',
    description: '在记忆库中搜索相关记录。',
    params: [
      { flag: '"gateway error"', note: '检索关键词。' },
      { flag: '--lines 5', note: '返回 5 行上下文。' }
    ],
    addedAt: new Date().toISOString()
  }
];

export const PRIMARY_CATEGORIES = ['基础使用', '环境配置', '诊断排障', '维护操作'];

export const DEFAULT_API_CONFIG: ApiConfig = {
  modelName: 'gpt-4o',
  baseUrl: 'https://api.openai.com/v1',
  llmKey: '',
  tavilyKey: '',
  githubKey: '',
  searchPrompt: `你是一个 CLI 命令知识库助手。请根据用户需求生成适合加入命令库的命令条目，并严格输出 JSON。

输出要求：
- 返回 JSON 数组，或包含 "commands" 数组的 JSON 对象。
- 每个命令项包含：scenario、icon、command、description、params、tool。
- params 格式为 [{ "flag": "", "note": "" }]，没有参数时返回空数组。
- scenario 用中文概括使用场景，icon 使用单个 emoji。
- command 必须是可执行或可参考的真实命令。
- description 用简洁中文说明用途。
- tool 字段可选，用于说明所属工具，如 Docker、Git、OpenClaw。

请优先给出实用、常见、可落地的命令。`,
  syncPrompt: `你是一个命令库维护助手。请结合用户提供的工具名称、检索到的资料和现有命令列表，输出一份同步建议 JSON。

输出格式：
{
  "added": [],
  "modified": [],
  "deprecated": []
}

要求：
- added：新增的命令项。
- modified：建议更新的命令项，尽量保留原 command 作为匹配依据。
- deprecated：建议废弃的命令项。
- 所有命令项结构与命令库一致：scenario、icon、command、description、params、tool。`,
  auditPrompt: `你是一个命令安全审计助手。请分析用户输入的命令，并严格输出 JSON。

输出格式：
{
  "explanation": "整体解释",
  "breakdown": [{ "part": "命令片段", "meaning": "作用说明" }],
  "securityRiskLevel": "Low" | "Medium" | "High" | "Critical",
  "securityWarnings": ["风险提示1", "风险提示2"],
  "suggestedScenario": "建议分类",
  "suggestedIcon": "建议 emoji"
}

要求：
- 解释命令的整体作用。
- 拆解关键参数和片段。
- 明确指出危险操作，例如删除系统文件、下载并直接执行脚本、提升权限、覆盖配置等。
- 给出适合保存进命令库的分类和图标建议。`
};
