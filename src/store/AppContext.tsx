import { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  currentUser: {
    name: string;
    role: string;
    avatar: string;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const currentUser = {
    name: 'علی محمدی',
    role: 'مدیر سیستم',
    avatar: 'AM',
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return <AppContext.Provider value={{ sidebarOpen, toggleSidebar, currentUser }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
