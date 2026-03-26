import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Command, ApiConfig, GistConfig } from '../types';
import { storage } from '../services/storage';

interface AppContextType {
  commands: Command[];
  apiConfig: ApiConfig;
  gistConfig: GistConfig;
  setCommands: (commands: Command[]) => void;
  addCommand: (command: Command) => boolean;
  updateCommand: (id: string, command: Command) => void;
  deleteCommand: (id: string) => void;
  updateApiConfig: (config: ApiConfig) => void;
  updateGistConfig: (config: GistConfig) => void;
  showToast: (message: string, duration?: number) => void;
  toastMessage: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [commands, setCommandsState] = useState<Command[]>([]);
  const [apiConfig, setApiConfigState] = useState<ApiConfig>(storage.getApiConfig());
  const [gistConfig, setGistConfigState] = useState<GistConfig>(storage.getGistConfig());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setCommandsState(storage.getCommands());
  }, []);

  const setCommands = (newCommands: Command[]) => {
    setCommandsState(newCommands);
    storage.saveCommands(newCommands);
  };

  const addCommand = (command: Command): boolean => {
    const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
    const incoming = normalize(command.command || '');

    if (!incoming) return false;

    const exists = commands.some((item) => normalize(item.command || '') === incoming);
    if (exists) {
      return false;
    }

    const newCommands = [...commands, command];
    setCommands(newCommands);
    return true;
  };

  const updateCommand = (id: string, updatedCommand: Command) => {
    const newCommands = commands.map(c => c.id === id ? updatedCommand : c);
    setCommands(newCommands);
  };

  const deleteCommand = (id: string) => {
    const newCommands = commands.filter(c => c.id !== id);
    setCommands(newCommands);
  };

  const updateApiConfig = (config: ApiConfig) => {
    setApiConfigState(config);
    storage.saveApiConfig(config);
  };

  const updateGistConfig = (config: GistConfig) => {
    setGistConfigState(config);
    storage.saveGistConfig(config);
  };

  const showToast = (message: string, duration: number = 2500) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, duration);
  };

  return (
    <AppContext.Provider value={{
      commands, apiConfig, gistConfig,
      setCommands, addCommand, updateCommand, deleteCommand,
      updateApiConfig, updateGistConfig,
      showToast, toastMessage
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
