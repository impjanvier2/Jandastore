
import { useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Auth({ onClose, onSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          setMessage("Konti yawe yakozwe neza!");
          onSuccess?.(data.user);
        } else {
          setMessage(
            "Konti yakozwe. Reba email yawe wemeze konti, hanyuma winjire."
          );
        }
      } else {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (error) throw error;

        onSuccess?.(data.user);
      }
    } catch (err) {
      setError(
        err.message || "Habaye ikibazo. Ongera ugerageze."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="relative my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close authentication form"
          className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100"
        >
          <X size={20} />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
            <LockKeyhole size={27} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            {isRegister ? "Create your account" : "Welcome back"}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {isRegister
              ? "Create your JandaStore account."
              : "Sign in to your JandaStore account."}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800"
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label
                htmlFor="auth-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Full name
              </label>

              <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3">
                <UserRound size={18} className="text-gray-400" />
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  maxLength={100}
                  required
                  className="w-full py-3 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email address
            </label>

            <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3">
              <Mail size={18} className="text-gray-400" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full py-3 outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3">
              <LockKeyhole size={18} className="text-gray-400" />
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete={
                  isRegister ? "new-password" : "current-password"
                }
                minLength={6}
                required
                className="w-full py-3 outline-none"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="text-gray-500"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {isRegister
            ? "Already have an account? "
            : "Don't have an account? "}

          <button
            type="button"
            onClick={() => {
              setIsRegister((value) => !value);
              setError("");
              setMessage("");
            }}
            className="font-semibold text-green-700 hover:underline"
          >
            {isRegister ? "Sign in" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}
