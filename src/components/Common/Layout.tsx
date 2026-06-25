import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { useIsClient } from "@uidotdev/usehooks";
import { memo, Suspense, useCallback, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { Toaster, type ToasterProps } from "sonner";
import FullPageLoader from "@/components/Shared/FullPageLoader";
import GlobalAlerts from "@/components/Shared/GlobalAlerts";
import Navbar from "@/components/Shared/Navbar";
import BottomNavigation from "@/components/Shared/Navbar/BottomNavigation";
import { Spinner } from "@/components/Shared/UI";
import { lazy } from "react";
import reloadAllTabs from "@/helpers/reloadAllTabs";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/lib/api";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { hydrateAuthTokens, signOut } from "@/store/persisted/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import ReloadTabsWatcher from "./ReloadTabsWatcher";

const GlobalModals = lazy(() => import("@/components/Shared/GlobalModals"));

const Layout = () => {
  const { pathname } = useLocation();
  const { theme } = useTheme();
  const { currentAccount, setCurrentAccount } = useAccountStore();
  const isMounted = useIsClient();
  const { accessToken } = hydrateAuthTokens();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const onError = useCallback(() => {
    signOut();
    reloadAllTabs();
  }, []);

  const { isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const data = await api.me.get();
      setCurrentAccount(data.me);
      return data.me;
    },
    enabled: !!accessToken,
    retry: false,
    //@ts-ignore
    onError
  });

  const accountLoading = !currentAccount && isLoading && !!accessToken;

  if (accountLoading || !isMounted) {
    return <FullPageLoader />;
  }

  return (
    <>
      <Toaster
        icons={{
          error: <XCircleIcon className="size-5" />,
          loading: <Spinner size="xs" />,
          success: <CheckCircleIcon className="size-5" />
        }}
        position="bottom-right"
        theme={theme as ToasterProps["theme"]}
        toastOptions={{
          className: "font-sofia-pro",
          style: { boxShadow: "none", fontSize: "16px" }
        }}
      />
      <Suspense fallback={null}>
        <GlobalModals />
      </Suspense>
      <GlobalAlerts />
      <ReloadTabsWatcher />
      <div className="mx-auto flex w-full max-w-6xl items-start gap-x-8 px-0 md:px-5">
        <Navbar />
        <Outlet />
        <BottomNavigation />
      </div>
    </>
  );
};

export default memo(Layout);
