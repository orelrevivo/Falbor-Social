import { SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@/components/Shared/UI";
import cn from "@/helpers/cn";
import { usePostAttachmentStore } from "@/store/non-persisted/post/usePostAttachmentStore";
import { usePostStore } from "@/store/non-persisted/post/usePostStore";

const AIImage = () => {
  const { attachments } = usePostAttachmentStore();
  const { isImageMode, setIsImageMode } = usePostStore();
  
  const disable =
    attachments.length > 0 &&
    (attachments.some((attachment) => attachment.type === "Image")
      ? attachments.length >= 4
      : true);

  return (
    <Tooltip content={isImageMode ? "Cancel AI Image" : "Generate AI Image"} placement="top" withDelay>
      <button
        aria-label="Generate Image"
        className={cn("rounded-full outline-offset-8 transition-colors hover:bg-[#0099ff]/20 hover:text-[#0099ff] p-1",
            isImageMode && "bg-[#0099ff]/20 text-[#0099ff]"
        )}
        disabled={disable && !isImageMode}
        onClick={() => {
          if (!isImageMode) {
            umami.track("open_ai_image_generator");
          }
          setIsImageMode(!isImageMode);
        }}
        type="button"
      >
        {isImageMode ? (
          <XMarkIcon className="size-5" />
        ) : (
          <SparklesIcon className="size-5" />
        )}
      </button>
    </Tooltip>
  );
};

export default AIImage;
