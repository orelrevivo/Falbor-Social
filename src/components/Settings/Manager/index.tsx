import PageLayout from "@/components/Shared/PageLayout";
import { Card, CardHeader } from "@/components/Shared/UI";
import BackButton from "@/components/Shared/BackButton";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { useManagerStore } from "@/store/persisted/useManagerStore";

const ManagerSettings = () => {
  const { isAgentAuthorized, setIsAgentAuthorized } = useManagerStore();

  return (
    <PageLayout title="Manager Settings">
      <Card>
        <CardHeader icon={<BackButton path="/settings" />} title="Manager" />
        <div className="p-5 flex flex-col space-y-4">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <GlobeAltIcon className="size-6 text-brand-500" />
              AI Web Agent
            </h3>
            <p className="text-gray-500 mt-1">
              Configure permissions for the AI Web Agent. The agent can browse websites, record videos, and analyze designs on your behalf.
            </p>
          </div>
          
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={isAgentAuthorized}
                onChange={(e) => setIsAgentAuthorized(e.target.checked)}
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">
                <strong>Authorize Web Agent</strong><br/>
                I authorize the AI Web Agent to browse the URLs I submit, record a video of its browsing session, and publish it publicly on this platform.
              </span>
            </label>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
};

export default ManagerSettings;
