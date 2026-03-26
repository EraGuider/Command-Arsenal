export interface CommandParam {
  flag: string;
  note: string;
}

export interface Command {
  id: string;
  scenario: string;
  icon: string;
  tool?: string;
  command: string;
  description: string;
  params: CommandParam[];
  addedAt: string;
}

export interface ApiConfig {
  modelName: string;
  baseUrl: string;
  llmKey: string;
  tavilyKey: string;
  githubKey: string;
  searchPrompt: string;
  syncPrompt: string;
  auditPrompt: string;
}

export interface GistConfig {
  gistId: string;
  lastSync: string | null;
}
