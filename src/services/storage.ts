import { Command, ApiConfig, GistConfig } from '../types';
import { DEFAULT_COMMANDS, DEFAULT_API_CONFIG } from '../constants';

const COMMANDS_KEY = 'openclaw_commands_v5';
const API_CONFIG_KEY = 'openclaw_api_config_v4';
const GIST_CONFIG_KEY = 'openclaw_gist_config_v1';

export const storage = {
  getCommands: (): Command[] => {
    const data = localStorage.getItem(COMMANDS_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse commands from local storage', e);
      }
    }
    return DEFAULT_COMMANDS;
  },
  saveCommands: (commands: Command[]) => {
    localStorage.setItem(COMMANDS_KEY, JSON.stringify(commands));
  },
  getApiConfig: (): ApiConfig => {
    const data = localStorage.getItem(API_CONFIG_KEY);
    if (data) {
      try {
        return { ...DEFAULT_API_CONFIG, ...JSON.parse(data) };
      } catch (e) {
        console.error('Failed to parse api config from local storage', e);
      }
    }
    return DEFAULT_API_CONFIG;
  },
  saveApiConfig: (config: ApiConfig) => {
    localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
  },
  getGistConfig: (): GistConfig => {
    const data = localStorage.getItem(GIST_CONFIG_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse gist config from local storage', e);
      }
    }
    return { gistId: '', lastSync: null };
  },
  saveGistConfig: (config: GistConfig) => {
    localStorage.setItem(GIST_CONFIG_KEY, JSON.stringify(config));
  }
};
