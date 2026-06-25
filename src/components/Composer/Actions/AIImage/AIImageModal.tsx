import { type Dispatch, type SetStateAction, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/Shared/UI";
import generateUUID from "@/helpers/generateUUID";
import { api } from "@/lib/api";
import { usePostAttachmentStore } from "@/store/non-persisted/post/usePostAttachmentStore";
import type { NewAttachment } from "@/types/misc";
import { PhotoIcon, SparklesIcon } from "@heroicons/react/24/outline";

interface AIImageModalProps {
  setShowModal: Dispatch<SetStateAction<boolean>>;
}

const AIImageModal = ({ setShowModal }: AIImageModalProps) => {
  const { addAttachments } = usePostAttachmentStore();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedUrl(null);

    try {
      const res = await api.ai.generateImage(prompt.trim());
      if (res.url) {
        setGeneratedUrl(res.url);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAttach = () => {
    if (!generatedUrl) return;
    
    const attachment: NewAttachment = {
      id: generateUUID(),
      mimeType: "image/jpeg",
      previewUri: generatedUrl,
      type: "Image",
      uri: generatedUrl
    };
    
    addAttachments([attachment]);
    setShowModal(false);
  };

  return (
    <div className="flex flex-col p-4 space-y-4">
      {/* Preview Area */}
      <div className="flex h-64 w-full items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 relative">
        {isGenerating ? (
          <div className="flex flex-col items-center space-y-3 text-brand-500">
            <SparklesIcon className="size-10 animate-pulse" />
            <span className="text-sm font-semibold animate-pulse">Generating your image...</span>
          </div>
        ) : generatedUrl ? (
          <img
            src={generatedUrl}
            alt={prompt}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <PhotoIcon className="size-10 mb-2" />
            <span className="text-sm">Image preview will appear here</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex items-center space-x-2">
        <input
          className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
          placeholder="A futuristic city with flying cars..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && prompt.trim() && !isGenerating) {
              e.preventDefault();
              handleGenerate();
            }
          }}
          autoFocus
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        {generatedUrl && (
          <Button
            onClick={handleAttach}
            variant="primary"
          >
            Attach Image
          </Button>
        )}
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          loading={isGenerating}
          variant={generatedUrl ? "secondary" : "primary"}
        >
          {generatedUrl ? "Regenerate" : "Generate"}
        </Button>
      </div>
    </div>
  );
};

export default AIImageModal;
