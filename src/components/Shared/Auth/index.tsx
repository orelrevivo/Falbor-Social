import Login from "@/components/Shared/Auth/Login";
import Register from "@/components/Shared/Auth/Register";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";

const Auth = () => {
  const { authModalType } = useAuthModalStore();

  return (
    <div className="m-5">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {authModalType === "signup" ? "Create your account" : "Welcome back"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {authModalType === "signup"
            ? "Join the conversation today."
            : "Sign in to continue."}
        </p>
      </div>
      {authModalType === "signup" ? <Register /> : <Login />}
    </div>
  );
};

export default Auth;
