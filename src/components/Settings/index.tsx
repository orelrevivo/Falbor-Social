import {
  AdjustmentsHorizontalIcon,
  ArrowRightIcon,
  PaintBrushIcon,
  AtSymbolIcon
} from "@heroicons/react/24/outline";
import { Link } from "react-router";
import BackButton from "@/components/Shared/BackButton";
import PageLayout from "@/components/Shared/PageLayout";
import { Card, CardHeader } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";

const AccountSettings = () => {
  const { currentAccount } = useAccountStore();

  const settingsPages = [
    {
      icon: <PaintBrushIcon className="size-5" />,
      title: "Personalize",
      url: "/settings/personalize"
    },
    {
      icon: <AtSymbolIcon className="size-5" />,
      title: "Username",
      url: "/settings/username"
    },
    {
      icon: <AdjustmentsHorizontalIcon className="size-5" />,
      title: "Manager",
      url: "/settings/manager"
    }
  ];

  return (
    <PageLayout title="Settings">
      <Card>
        <CardHeader
          icon={<BackButton path={currentAccount ? `/u/${currentAccount.username}` : "/"} />}
          title="Settings"
        />
        <div className="py-3">
          {settingsPages.map((page) => (
            <Link
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-100 dark:hover:bg-gray-800"
              key={page.url}
              to={page.url}
            >
              <div className="flex items-center space-x-2 text-gray-800 dark:text-gray-200">
                {page.icon}
                <div>{page.title}</div>
              </div>
              <div>
                <ArrowRightIcon className="size-4 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </PageLayout>
  );
};

export default AccountSettings;
