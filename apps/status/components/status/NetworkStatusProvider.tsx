"use client";

import * as React from "react";
import { toast } from "@vaahansafe/ui";

interface NetworkStatusContextValue {
  isOnline: boolean;
  wasOffline: boolean;
}

const NetworkStatusContext = React.createContext<NetworkStatusContextValue>({
  isOnline: true,
  wasOffline: false,
});

export function useNetworkStatus() {
  return React.useContext(NetworkStatusContext);
}

interface NetworkStatusProviderProps {
  children: React.ReactNode;
}

export function NetworkStatusProvider({ children }: NetworkStatusProviderProps) {
  const [isOnline, setIsOnline] = React.useState(true);
  const [wasOffline, setWasOffline] = React.useState(false);

  React.useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) {
        setWasOffline(true);
      }
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setIsOnline(true);
        setWasOffline((prev) => {
          if (prev) {
            toast.success("Connection restored. Refreshing status...", {
              duration: 3500,
              id: "network-restored-toast",
            });
          }
          return false;
        });
      }, 300);
    };

    const handleOffline = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setIsOnline(false);
        setWasOffline(true);
      }, 300);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <NetworkStatusContext.Provider value={{ isOnline, wasOffline }}>
      {children}
      <NetworkStatusIndicator isOnline={isOnline} />
    </NetworkStatusContext.Provider>
  );
}

function NetworkStatusIndicator({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl border border-[#e6dfd8] bg-[#faf9f5]/95 px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-[#6c6a64] shadow-md backdrop-blur-sm dark:border-[#2e2b27] dark:bg-[#181715]/95 dark:text-[#a09d96] animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#c64545] opacity-75 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c64545]" />
      </span>
      <span>DEVICE OFFLINE &bull; LOCAL VIEW</span>
    </aside>
  );
}
