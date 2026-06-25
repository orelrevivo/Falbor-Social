import type { PostFragment } from "@/indexer/generated";
import { createTrackedStore } from "@/store/createTrackedStore";

interface State {
  postContent: string;
  quotedPost?: PostFragment;
  editingPost?: PostFragment;
  isImageMode: boolean;
  generatedImage: string | null;
  setPostContent: (postContent: string) => void;
  setQuotedPost: (quotedPost?: PostFragment) => void;
  setEditingPost: (editingPost?: PostFragment) => void;
  setIsImageMode: (isImageMode: boolean) => void;
  setGeneratedImage: (generatedImage: string | null) => void;
}

const { useStore: usePostStore } = createTrackedStore<State>((set) => ({
  editingPost: undefined,
  postContent: "",
  quotedPost: undefined,
  isImageMode: false,
  generatedImage: null,
  setEditingPost: (editingPost) => set(() => ({ editingPost })),
  setPostContent: (postContent) => set(() => ({ postContent })),
  setQuotedPost: (quotedPost) => set(() => ({ quotedPost })),
  setIsImageMode: (isImageMode) => set(() => ({ isImageMode })),
  setGeneratedImage: (generatedImage) => set(() => ({ generatedImage }))
}));

export { usePostStore };
