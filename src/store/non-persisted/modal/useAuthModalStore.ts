import { createTrackedStore } from "@/store/createTrackedStore";

type AuthModalType = "login" | "signup";

interface State {
  showAuthModal: boolean;
  authModalType: AuthModalType;
  setShowAuthModal: (
    showAuthModal: boolean,
    authModalType?: AuthModalType
  ) => void;
  setAuthModalType: (authModalType: AuthModalType) => void;
}

const { useStore: useAuthModalStore } = createTrackedStore<State>((set) => ({
  authModalType: "login",
  setShowAuthModal: (showAuthModal, authModalType) =>
    set(() => ({ authModalType: authModalType ?? "login", showAuthModal })),
  setAuthModalType: (authModalType) => set(() => ({ authModalType })),
  showAuthModal: false
}));

export { useAuthModalStore };
