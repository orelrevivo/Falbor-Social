import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Attachment from "@/components/Composer/Actions/Attachment";
import Gif from "@/components/Composer/Actions/Gif";
import AIImage from "@/components/Composer/Actions/AIImage";
import NewAttachments from "@/components/Composer/NewAttachments";
import QuotedPost from "@/components/Post/QuotedPost";
import { AudioPostSchema } from "@/components/Shared/Audio";
import Wrapper from "@/components/Shared/Embed/Wrapper";
import EmojiPicker from "@/components/Shared/EmojiPicker";
import { Badge, Button, Card, H6 } from "@/components/Shared/UI";
import { ERRORS } from "@/data/errors";
import getAccount from "@/helpers//getAccount";
import errorToast from "@/helpers/errorToast";
import generateUUID from "@/helpers/generateUUID";
import getMentions from "@/helpers/getMentions";
import { api } from "@/lib/api";
import type { PostFragment } from "@/indexer/generated";
import { useNewPostModalStore } from "@/store/non-persisted/modal/useNewPostModalStore";
import { useCollectActionStore } from "@/store/non-persisted/post/useCollectActionStore";
import { usePostAttachmentStore } from "@/store/non-persisted/post/usePostAttachmentStore";
import {
  DEFAULT_AUDIO_POST,
  usePostAudioStore
} from "@/store/non-persisted/post/usePostAudioStore";
import { usePostLicenseStore } from "@/store/non-persisted/post/usePostLicenseStore";
import { usePostRulesStore } from "@/store/non-persisted/post/usePostRulesStore";
import { usePostStore } from "@/store/non-persisted/post/usePostStore";
import {
  DEFAULT_VIDEO_THUMBNAIL,
  usePostVideoStore
} from "@/store/non-persisted/post/usePostVideoStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import type { IGif } from "@/types/giphy";
import type { NewAttachment } from "@/types/misc";
import { Editor, useEditorContext, withEditorContext } from "./Editor";
import LinkPreviews from "./LinkPreviews";
import { Link } from "react-router";
import cn from "@/helpers/cn";
import { useManagerStore } from "@/store/persisted/useManagerStore";
import Tabs from "@/components/Shared/UI/Tabs";

interface NewPublicationProps {
  className?: string;
  post?: PostFragment;
  feed?: string;
}

const NewPublication = ({ className, post, feed }: NewPublicationProps) => {
  const { currentAccount } = useAccountStore();
  const { isAgentAuthorized } = useManagerStore();

  // New post modal store
  const { setShow: setShowNewPostModal } = useNewPostModalStore();

  // Post store
  const {
    postContent,
    editingPost,
    quotedPost,
    isImageMode,
    generatedImage,
    setPostContent,
    setEditingPost,
    setQuotedPost,
    setIsImageMode,
    setGeneratedImage
  } = usePostStore();

  // Audio store
  const { audioPost, setAudioPost } = usePostAudioStore();

  // Video store
  const {
    setVideoDurationInSeconds,
    setVideoThumbnail,
    videoDurationInSeconds,
    videoThumbnail
  } = usePostVideoStore();

  // Attachment store
  const { addAttachments, attachments, isUploading, setAttachments } =
    usePostAttachmentStore();

  // License store
  const { setLicense } = usePostLicenseStore();

  // Collect module store
  const { collectAction, reset: resetCollectSettings } = useCollectActionStore(
    (state) => state
  );

  const { rules, setRules } = usePostRulesStore();

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [postContentError, setPostContentError] = useState("");
  const [selectedFeed, setSelectedFeed] = useState<string>(feed || "");
  const [isAiReviewMode, setIsAiReviewMode] = useState(false);
  const [aiReviewUrl, setAiReviewUrl] = useState("");
  const [aiReviewDescription, setAiReviewDescription] = useState("");

  const editor = useEditorContext();

  const isComment = Boolean(post);
  const isQuote = Boolean(quotedPost);
  const hasAudio = attachments[0]?.type === "Audio";
  const hasVideo = attachments[0]?.type === "Video";
  const videoDuration = Number.parseFloat(videoDurationInSeconds);
  const hasValidVideoMetadata =
    !hasVideo ||
    (Boolean(videoThumbnail.url) &&
      Number.isFinite(videoDuration) &&
      videoDuration > 0);

  const reset = () => {
    editor?.setMarkdown("");
    setIsSubmitting(false);
    setPostContent("");
    setAttachments([]);
    setQuotedPost(undefined);
    setEditingPost(undefined);
    setRules(undefined);
    setVideoThumbnail(DEFAULT_VIDEO_THUMBNAIL);
    setVideoDurationInSeconds("");
    setAudioPost(DEFAULT_AUDIO_POST);
    setLicense(null);
    resetCollectSettings();
    setSelectedFeed(feed || "");
    setShowNewPostModal(false);
    setIsImageMode(false);
    setGeneratedImage(null);
    setAiReviewUrl("");
    setAiReviewDescription("");
  };

  const onError = useCallback((error?: unknown) => {
    setIsSubmitting(false);
    setIsGenerating(false);
    errorToast(error);
  }, []);

  useEffect(() => {
    setSelectedFeed(feed || "");
  }, [feed]);

  useEffect(() => {
    setPostContentError("");
  }, [audioPost]);

  useEffect(() => {
    if (postContent.length > 25000) {
      setPostContentError("Content should not exceed 25000 characters!");
      return;
    }

    if (getMentions(postContent).length > 50) {
      setPostContentError("You can only mention 50 people at a time!");
      return;
    }

    setPostContentError("");
  }, [postContent]);

  const getTitlePrefix = () => {
    if (hasVideo) {
      return "Video";
    }

    return isComment ? "Comment" : isQuote ? "Quote" : "Post";
  };

  const handleGenerateImage = async () => {
    if (!postContent.trim()) {
      toast.error("Please enter a prompt to generate an image");
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratedImage(null);
      const res = await fetch("http://127.0.0.1:8001/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: postContent })
      });

      if (!res.ok) throw new Error("Failed to generate image");
      
      const data = await res.json();
      setGeneratedImage(`data:image/jpeg;base64,${data.image_base64}`);
    } catch (error: any) {
      onError(error?.message ?? "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptImage = () => {
    if (!generatedImage) return;
    
    // Add as attachment
    const attachment: NewAttachment = {
      id: generateUUID(),
      mimeType: "image/jpeg",
      previewUri: generatedImage,
      type: "Image",
      uri: generatedImage
    };
    addAttachments([attachment]);
    
    // Clear mode
    setIsImageMode(false);
    setGeneratedImage(null);
    
    // Clear prompt text from editor so they can write their actual post
    editor?.setMarkdown("");
    setPostContent("");
  };

  const handleRejectImage = () => {
    setGeneratedImage(null);
    setIsImageMode(false);
  };

  const handleCreatePost = async () => {
    if (!currentAccount) {
      return toast.error(ERRORS.SignWallet);
    }

    try {
      setIsSubmitting(true);
      if (hasAudio) {
        setPostContentError("");
        const parsedData = AudioPostSchema.safeParse(audioPost);
        if (!parsedData.success) {
          const issue = parsedData.error.issues[0];
          setIsSubmitting(false);
          return setPostContentError(issue.message);
        }
      }

      if (!postContent.length && !attachments.length) {
        setIsSubmitting(false);
        return setPostContentError(
          `${
            isComment ? "Comment" : isQuote ? "Quote" : "Post"
          } should not be empty!`
        );
      }

      if (!hasValidVideoMetadata) {
        setIsSubmitting(false);
        return setPostContentError(
          "Add a valid video thumbnail before posting."
        );
      }

      setPostContentError("");

      const mediaUrls = attachments.map(a => {
        if (a.type === "Audio") {
          const title = encodeURIComponent(audioPost.title || "");
          const artist = encodeURIComponent(audioPost.artist || "");
          const cover = encodeURIComponent(audioPost.cover || "");
          return `${a.uri}#type=Audio&title=${title}&artist=${artist}&cover=${cover}`;
        }
        return `${a.uri}#type=${a.type}`;
      }).filter(Boolean) as string[];

      await api.posts.create({
        content: postContent,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        parentId: isComment ? post?.id : undefined
      });

      toast.success(isComment ? "Comment created successfully!" : "Post created successfully!");
      reset();
      window.location.reload();
    } catch (error: any) {
      onError(error?.message ?? "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAiReview = async () => {
    if (!currentAccount) {
      return toast.error(ERRORS.SignWallet);
    }
    if (!aiReviewUrl.trim() || !aiReviewDescription.trim()) {
      return toast.error("Please provide both a URL and a description.");
    }
    if (!isAgentAuthorized) {
      return toast.error(
        <div className="flex flex-col">
          <span>You must approve the feature in the settings for it to work.</span>
          <Link to="/settings/manager" className="text-brand-500 hover:underline mt-1 font-bold">Go to Settings</Link>
        </div>,
        { duration: 5000 }
      );
    }

    try {
      setIsSubmitting(true);
      const aiCommand = `\n\n[AI_REVIEW: ${aiReviewUrl.trim()} | ${aiReviewDescription.trim()}]`;
      
      await api.posts.create({
        content: aiCommand,
        parentId: isComment ? post?.id : undefined
      });

      toast.success("AI review request submitted! The agent is now analyzing the site.");
      reset();
      window.location.reload();
    } catch (error: any) {
      onError(error?.message ?? "Failed to create review request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setGifAttachment = (gif: IGif) => {
    const attachment: NewAttachment = {
      id: generateUUID(),
      mimeType: "image/gif",
      previewUri: gif.images.original.url,
      type: "Image",
      uri: gif.images.original.url
    };
    addAttachments([attachment]);
  };

  // Removed keyboard shortcut for create post

  return (
    <Card className={className} onClick={() => setShowEmojiPicker(false)}>
      <Tabs
        active={isAiReviewMode ? "ai_review" : "standard"}
        setActive={(type) => setIsAiReviewMode(type === "ai_review")}
        layoutId="composer-tabs"
        tabs={[
          { name: "Standard Post", type: "standard" },
          { 
            name: "AI Website Review", 
            type: "ai_review", 
            suffix: <Badge className="bg-[#0099ff]/20 text-[#0099ff] border-[#0099ff]">Beta</Badge> 
          }
        ]}
        className="px-5 pt-3 pb-2 border-b border-gray-200 dark:border-gray-800 w-full"
      />

      {isAiReviewMode ? (
        <div className="flex flex-col p-5 space-y-5">
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-200">Target URL</label>
            <input
              className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
              placeholder="https://your-website.com"
              value={aiReviewUrl}
              onChange={(e) => setAiReviewUrl(e.target.value)}
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-200">What is the purpose of this site?</label>
            <textarea
              className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-2 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white resize-none"
              placeholder="e.g. I need an AI site that helps me build websites..."
              rows={3}
              value={aiReviewDescription}
              onChange={(e) => setAiReviewDescription(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end pt-2">
            <Button
              disabled={isSubmitting || !aiReviewUrl.trim() || !aiReviewDescription.trim()}
              loading={isSubmitting}
              onClick={handleCreateAiReview}
            >
              Publish Review Request
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Editor isComment={isComment} />
          {postContentError ? (
            <H6 className="mt-1 px-5 pb-3 text-red-500">{postContentError}</H6>
          ) : null}
          
          {/* Generated Image Preview Area */}
          {isImageMode && generatedImage && (
            <div className="mx-5 mb-4 flex flex-col items-center gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <img src={generatedImage} alt="Generated" className="max-h-64 rounded-lg object-contain" />
              <div className="flex w-full justify-center gap-4">
                <Button variant="danger" onClick={handleRejectImage}>
                  Reject
                </Button>
                <Button variant="secondary" onClick={handleGenerateImage} loading={isGenerating}>
                  Regenerate
                </Button>
                <Button onClick={handleAcceptImage}>
                  Accept
                </Button>
              </div>
            </div>
          )}

          <LinkPreviews />
          <NewAttachments attachments={attachments} />
          {quotedPost ? (
            <Wrapper className="m-5" zeroPadding>
              <QuotedPost isNew post={quotedPost} />
            </Wrapper>
          ) : null}
          <div className="divider" />
          <div className="block items-center px-5 py-3 sm:flex">
            <div className="flex items-center space-x-4">
              <Attachment />
              <EmojiPicker
                setEmoji={(emoji: string) => {
                  setShowEmojiPicker(false);
                  editor?.insertText(emoji);
                }}
                setShowEmojiPicker={setShowEmojiPicker}
                showEmojiPicker={showEmojiPicker}
              />
              <Gif setGifAttachment={(gif: IGif) => setGifAttachment(gif)} />
              <AIImage />
            </div>
            <div className="mt-2 ml-auto sm:mt-0">
              {isImageMode && !generatedImage ? (
                <Button
                  disabled={isGenerating || postContent.length === 0}
                  loading={isGenerating}
                  outline
                  variant="primary"
                  onClick={handleGenerateImage}
                >
                  Generate Image
                </Button>
              ) : !isImageMode && (
                <Button
                  disabled={
                    isSubmitting ||
                    isUploading ||
                    videoThumbnail.uploading ||
                    postContentError.length > 0
                  }
                  loading={isSubmitting}
                  onClick={handleCreatePost}
                >
                  {editingPost ? "Update" : isComment ? "Comment" : "Publish Post"}
                </Button>
              )}
            </div>
          </div>
          {isImageMode && (
            <style>{`
              .prose-placeholder::before, [data-placeholder]::before {
                content: "Describe the image you want to create..." !important;
              }
            `}</style>
          )}
        </>
      )}
    </Card>
  );
};

export default withEditorContext(NewPublication);
