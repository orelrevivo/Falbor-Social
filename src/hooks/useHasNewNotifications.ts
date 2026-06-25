import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAccountStore } from "@/store/persisted/useAccountStore";

/**
 * Polls the unread notification count from our own API every 60 seconds.
 */
const useHasNewNotifications = (): boolean => {
  const { currentAccount } = useAccountStore();
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    if (!currentAccount) {
      setHasNew(false);
      return;
    }

    const check = async () => {
      try {
        const data = await api.notifications.unreadCount();
        setHasNew(data.count > 0);
      } catch {
        // silently ignore
      }
    };

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [currentAccount]);

  return hasNew;
};

export default useHasNewNotifications;
