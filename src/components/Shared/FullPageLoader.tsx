import { Image } from "@/components/Shared/UI";

const FullPageLoader = () => {
  return (
    <div className="grid h-screen place-items-center">
      <Image
        alt="Logo"
        height={112}
        src={`/logo.png`}
        width={112}
      />
    </div>
  );
};

export default FullPageLoader;
