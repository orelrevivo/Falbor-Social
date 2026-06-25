import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Modal, Tooltip } from "@/components/Shared/UI";
import ContextModal from "./ContextModal";

const ContextAction = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Tooltip content="Add Context & Trigger AI Review" placement="top" withDelay>
        <button
          aria-label="Add Context"
          className="rounded-full outline-offset-8 transition-colors hover:bg-[#0099ff]/20 hover:text-[#0099ff] p-1"
          onClick={() => {
            umami.track("open_ai_context_generator");
            setShowModal(!showModal);
          }}
          type="button"
        >
          <GlobeAltIcon className="size-5" />
        </button>
      </Tooltip>
      <Modal
        onClose={() => setShowModal(false)}
        show={showModal}
        title="Trigger AI Web Agent"
      >
        <ContextModal setShowModal={setShowModal} />
      </Modal>
    </>
  );
};

export default ContextAction;
