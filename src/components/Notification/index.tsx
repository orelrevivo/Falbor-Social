import { useEffect, useState } from "react";
import { BellIcon, HeartIcon, ChatBubbleOvalLeftIcon, UserPlusIcon, ArrowPathRoundedSquareIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { api } from "@/lib/api";
import type { Notification } from "@/types/api";
import { useAccountStore } from "@/store/persisted/useAccountStore";

import PageLayout from "@/components/Shared/PageLayout";
import NotLoggedIn from "@/components/Shared/NotLoggedIn";
import Loader from "@/components/Shared/Loader";
import { Card } from "@/components/Shared/UI";

dayjs.extend(relativeTime);

const NotificationIcon = ({ type }: { type: Notification["type"] }) => {
  switch (type) {
    case "like": return <HeartIcon className="size-6 text-pink-500" />;
    case "comment": return <ChatBubbleOvalLeftIcon className="size-6 text-blue-500" />;
    case "follow": return <UserPlusIcon className="size-6 text-green-500" />;
    case "repost": return <ArrowPathRoundedSquareIcon className="size-6 text-purple-500" />;
    default: return <BellIcon className="size-6 text-gray-500" />;
  }
};

const NotificationMessage = ({ notification }: { notification: Notification }) => {
  const actorName = notification.actor.displayName ?? notification.actor.username;
  
  switch (notification.type) {
    case "like": return <span><b>{actorName}</b> liked your post.</span>;
    case "comment": return <span><b>{actorName}</b> commented on your post.</span>;
    case "follow": return <span><b>{actorName}</b> followed you.</span>;
    case "repost": return <span><b>{actorName}</b> reposted your post.</span>;
    case "mention": return <span><b>{actorName}</b> mentioned you.</span>;
    default: return <span><b>{actorName}</b> interacted with you.</span>;
  }
};

const Notification = () => {
  const { currentAccount } = useAccountStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentAccount) return;
    const fetchNotifications = async () => {
      try {
        const data = await api.notifications.list();
        setNotifications(data.items);
        await api.notifications.markRead();
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [currentAccount]);

  if (!currentAccount) {
    return <NotLoggedIn />;
  }

  return (
    <PageLayout title="Notifications">
      <Card className="divide-y divide-gray-200 dark:divide-gray-800">
        {loading ? (
          <Loader className="my-10" />
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <BellIcon className="mx-auto mb-4 size-10 text-gray-300" />
            <p>No notifications yet.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 p-5 transition hover:bg-gray-50 dark:hover:bg-gray-900/50 ${
                !notification.read ? "bg-brand-50/50 dark:bg-brand-900/10" : ""
              }`}
            >
              <div className="shrink-0 mt-1">
                <NotificationIcon type={notification.type} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link to={`/u/${notification.actor.username}`}>
                    <img 
                      src={notification.actor.avatarUrl ?? `https://api.dicebear.com/8.x/initials/svg?seed=${notification.actor.username}`}
                      alt={notification.actor.username}
                      className="size-8 rounded-full"
                    />
                  </Link>
                </div>
                <div className="text-gray-900 dark:text-white">
                  {notification.postId ? (
                    <Link to={`/posts/${notification.postId}`} className="hover:underline">
                      <NotificationMessage notification={notification} />
                    </Link>
                  ) : (
                    <Link to={`/u/${notification.actor.username}`} className="hover:underline">
                      <NotificationMessage notification={notification} />
                    </Link>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-xs text-gray-500">
                {dayjs(notification.createdAt).fromNow()}
              </div>
            </div>
          ))
        )}
      </Card>
    </PageLayout>
  );
};

export default Notification;
