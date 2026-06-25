import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button, Input } from "@/components/Shared/UI";
import { api } from "@/lib/api";
import reloadAllTabs from "@/helpers/reloadAllTabs";
import { signIn } from "@/store/persisted/useAuthStore";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setShowAuthModal, setAuthModalType } = useAuthModalStore();

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password) return;
      setIsSubmitting(true);
      try {
        const data = await api.auth.login({ email, password });
        signIn({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        });
        setShowAuthModal(false);
        reloadAllTabs();
      } catch (error: any) {
        toast.error(error?.message ?? "Login failed. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, setShowAuthModal]
  );

  return (
    <form className="space-y-4" onSubmit={handleLogin}>
      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          htmlFor="login-email"
        >
          Email
        </label>
        <div className="relative">
          <EnvelopeIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input
            autoComplete="email"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-4 pl-10 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            id="login-email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </div>
      </div>

      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          htmlFor="login-password"
        >
          Password
        </label>
        <div className="relative">
          <LockClosedIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input
            autoComplete="current-password"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-4 pl-10 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            id="login-password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            type="password"
            value={password}
          />
        </div>
      </div>

      <Button
        className="w-full justify-center"
        disabled={isSubmitting || !email || !password}
        loading={isSubmitting}
        type="submit"
      >
        Log in
      </Button>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <button
          className="font-medium text-brand-500 hover:underline"
          onClick={() => setAuthModalType("signup")}
          type="button"
        >
          Sign up
        </button>
      </p>
    </form>
  );
};

export default Login;
