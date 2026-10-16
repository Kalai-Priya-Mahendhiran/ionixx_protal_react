import React, { createContext, useContext, useState } from "react";

interface GlobalContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobal must be used within a GlobalContextProvider");
  }
  return context;
};

export const GlobalContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Open by default on desktop; on phones and tablets the sidebar is a drawer that starts closed
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === "undefined" || !window.matchMedia || window.matchMedia("(min-width: 1024px)").matches,
  );
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const value: GlobalContextType = {
    sidebarOpen,
    setSidebarOpen,
    theme,
    setTheme,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};
