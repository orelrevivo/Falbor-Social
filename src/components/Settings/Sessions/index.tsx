import PageLayout from "@/components/Shared/PageLayout";
import { Card, CardHeader } from "@/components/Shared/UI";
import BackButton from "@/components/Shared/BackButton";
import { WrenchIcon } from "@heroicons/react/24/outline";

const SessionsSettings = () => {
  return (
    <PageLayout title="Sessions settings">
      <Card>
        <CardHeader icon={<BackButton path="/settings" />} title="Sessions" />
        <div className="p-5 text-center text-gray-500">
          <WrenchIcon className="mx-auto mb-3 size-8 text-gray-400" />
          <p>This feature is currently being upgraded for the new backend.</p>
        </div>
      </Card>
    </PageLayout>
  );
};

export default SessionsSettings;
