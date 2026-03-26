/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { ExplorerView } from './views/ExplorerView';
import { ConsoleView } from './views/ConsoleView';
import { Toast } from './components/ui/Toast';

function AppContent() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'console'>('dashboard');

  return (
    <div className="min-h-screen bg-[#f5f5f4] text-[#292524] font-sans pb-20 selection:bg-indigo-200 selection:text-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {currentView === 'dashboard' ? (
          <ExplorerView onSwitchView={setCurrentView} />
        ) : (
          <ConsoleView onSwitchView={setCurrentView} />
        )}
      </div>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
