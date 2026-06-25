import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/Shared/UI";
import { api } from "@/lib/api";
import reloadAllTabs from "@/helpers/reloadAllTabs";
import { signIn } from "@/store/persisted/useAuthStore";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";

const Register = () => {
  const [form, setForm] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
    confirmPassword: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setShowAuthModal, setAuthModalType } = useAuthModalStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (form.password !== form.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (form.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      setIsSubmitting(true);
      try {
        const data = await api.auth.register({
          email: form.email,
          username: form.username,
          password: form.password,
          displayName: form.displayName || undefined
        });
        signIn({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        });
        setShowAuthModal(false);
        reloadAllTabs();
      } catch (error: any) {
        // Try to extract field-level errors
        const msg = error?.message ?? "Registration failed. Please try again.";
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, setShowAuthModal]
  );

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-4 pl-10 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white";

  return (
    <form className="space-y-3.5" onSubmit={handleRegister}>
      {/* Display name */}
      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          htmlFor="reg-displayname"
        >
          Display Name
        </label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input
            autoComplete="name"
            className={inputClass}
            id="reg-displayname"
            name="displayName"
            onChange={handleChange}
            placeholder="Your Name"
            type="text"
            value={form.displayName}
          />
        </div>
      </div>

      {/* Username */}
      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          htmlFor="reg-username"
        >
          Username <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 text-sm">
            @
          </span>
          <input
            autoComplete="username"
            className={inputClass}
            id="reg-username"
            name="username"
            onChange={handleChange}
            pattern="[a-zA-Z0-9_]+"
            placeholder="username"
            required
            type="text"
            value={form.username}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          htmlFor="reg-email"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <EnvelopeIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input
            autoComplete="email"
            className={inputClass}
            id="reg-email"
            name="email"
            onChange={handleChange}
            placeholder="you@example.com"
            required
            type="email"
            value={form.email}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          htmlFor="reg-password"
        >
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <LockClosedIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input
            autoComplete="new-password"
            className={inputClass}
            id="reg-password"
            name="password"
            onChange={handleChange}
            placeholder="At least 8 characters"
            required
            type="password"
            value={form.password}
          />
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          htmlFor="reg-confirm"
        >
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <LockClosedIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <input
            autoComplete="new-password"
            className={inputClass}
            id="reg-confirm"
            name="confirmPassword"
            onChange={handleChange}
            placeholder="••••••••"
            required
            type="password"
            value={form.confirmPassword}
          />
        </div>
      </div>

      <Button
        className="w-full justify-center"
        disabled={isSubmitting || !form.email || !form.username || !form.password}
        loading={isSubmitting}
        type="submit"
      >
        Create account
      </Button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <button
          className="font-medium text-brand-500 hover:underline"
          onClick={() => setAuthModalType("login")}
          type="button"
        >
          Log in
        </button>
      </p>
    </form>
  );
};

export default Register;
