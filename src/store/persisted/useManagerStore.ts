import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ManagerState {
  isAgentAuthorized: boolean;
  setIsAgentAuthorized: (authorized: boolean) => void;
}

export const useManagerStore = create<ManagerState>()(
  persist(
    (set) => ({
      isAgentAuthorized: false,
      setIsAgentAuthorized: (authorized) => set({ isAgentAuthorized: authorized })
    }),
    {
      name: "hey-manager-store"
    }
  )
);
