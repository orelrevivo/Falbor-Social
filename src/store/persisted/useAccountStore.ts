import { Localstorage } from "@/data/storage";
import type { User } from "@/types/api";
import { createPersistedTrackedStore } from "@/store/createTrackedStore";

interface State {
  currentAccount?: User;
  setCurrentAccount: (currentAccount?: User) => void;
}

const { useStore: useAccountStore } = createPersistedTrackedStore<State>(
  (set, _get) => ({
    currentAccount: undefined,
    setCurrentAccount: (currentAccount?: User) =>
      set(() => ({ currentAccount }))
  }),
  { name: Localstorage.AccountStore }
);

export { useAccountStore };
