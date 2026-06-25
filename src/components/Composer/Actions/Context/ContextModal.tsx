import { type Dispatch, type SetStateAction, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { useEditorContext } from "@/components/Composer/Editor";

interface ContextModalProps {
  setShowModal: Dispatch<SetStateAction<boolean>>;
}

const ContextModal = ({ setShowModal }: ContextModalProps) => {
  const { currentAccount } = useAccountStore();
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const editor = useEditorContext();

  const handleSubmit = () => {
    if (!url.trim() || !description.trim() || !authorized) return;
    if (!currentAccount) {
      toast.error("You must be logged in to trigger the web agent");
      return;
    }

    if (!editor) {
      toast.error("Editor not found");
      return;
    }

    const aiCommand = `\n\n[AI_REVIEW: ${url.trim()} | ${description.trim()}]`;
    editor.insertText(aiCommand);
    
    toast.success("AI request added to your post! Publish it to dispatch the Web Agent.");
    setShowModal(false);
  };

  return (
    <div className="flex flex-col p-5 space-y-5">
      <div className="flex flex-col space-y-1">
        <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Target URL</label>
        <input
          className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2 outline-none focus:border-blue-500 dark:border-gray-700 dark:text-white"
          placeholder="https://your-website.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-bold text-gray-700 dark:text-gray-200">What is the purpose of this site?</label>
        <textarea
          className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2 outline-none focus:border-blue-500 dark:border-gray-700 dark:text-white resize-none"
          placeholder="e.g. I need an AI site that helps me build websites..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <label className="flex items-start space-x-3 cursor-pointer">
        <input
          type="checkbox"
          className="mt-1"
          checked={authorized}
          onChange={(e) => setAuthorized(e.target.checked)}
        />
        <span className="text-sm text-gray-600 dark:text-gray-300">
          I authorize the AI Web Agent to browse this URL, record a video of its browsing session, and publish it publicly on this platform.
        </span>
      </label>

      <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
        <Button
          onClick={handleSubmit}
          disabled={!url.trim() || !description.trim() || !authorized}
          icon={<GlobeAltIcon className="size-4" />}
        >
          Add to Post
        </Button>
      </div>
    </div>
  );
};

export default ContextModal;
