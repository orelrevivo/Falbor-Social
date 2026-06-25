import { SparklesIcon } from "@heroicons/react/24/solid";
import { memo } from "react";
import { Badge } from "@/components/Shared/UI";

const New = () => {
  return (
    <Badge className="flex items-center space-x-1 bg-[#0099ff]/20 text-[#0099ff] border-[#0099ff]">
      <SparklesIcon className="size-3" />
      <div>New</div>
    </Badge>
  );
};

export default memo(New);
