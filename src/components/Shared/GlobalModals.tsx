import { Modal } from "@/components/Shared/UI";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";
import { useNewPostModalStore } from "@/store/non-persisted/modal/useNewPostModalStore";
import Auth from "./Auth";
import NewPostModal from "@/components/Composer/NewPostModal";

const GlobalModals = () => {
  const { authModalType, showAuthModal, setShowAuthModal } =
    useAuthModalStore();
  const { show: showNewPostModal, setShow: setShowNewPostModal } =
    useNewPostModalStore();

  const authModalTitle = authModalType === "signup" ? "Create account" : "Login";

  return (
    <>
      <Modal
        onClose={() => setShowAuthModal(false, authModalType)}
        show={showAuthModal}
        title={authModalTitle}
      >
        <Auth />
      </Modal>
      {showNewPostModal && (
        <Modal
          onClose={() => setShowNewPostModal(false)}
          show={showNewPostModal}
          size="md"
          title="Create post"
        >
          <NewPostModal onClose={() => setShowNewPostModal(false)} />
        </Modal>
      )}
    </>
  );
};

export default GlobalModals;
