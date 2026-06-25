import PageLayout from "@/components/Shared/PageLayout";
import { Card, CardHeader, Button } from "@/components/Shared/UI";
import BackButton from "@/components/Shared/BackButton";
import { ArrowRightOnRectangleIcon, UsersIcon } from "@heroicons/react/24/outline";
import { signOut } from "@/store/persisted/useAuthStore";
import reloadAllTabs from "@/helpers/reloadAllTabs";

const UsernameSettings = () => {
  const handleSwitchUser = () => {
    signOut();
    reloadAllTabs();
  };

  return (
    <PageLayout title="Account Settings">
      <Card>
        <CardHeader icon={<BackButton path="/settings" />} title="Account" />
        <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
          <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
            <UsersIcon className="size-8 text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Change Accounts</h3>
            <p className="text-gray-500 mt-1 max-w-sm">Sign out of your current session to log into a different account.</p>
          </div>
          <Button onClick={handleSwitchUser} icon={<ArrowRightOnRectangleIcon className="size-5" />}>
            Sign Out & Switch Account
          </Button>
        </div>
      </Card>
    </PageLayout>
  );
};

export default UsernameSettings;
