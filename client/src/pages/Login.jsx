import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex items-center justify-center py-4 px-4 md:px-8 lg:h-screen bg-gray-50">
      <div className="max-w-6xl w-full border border-slate-200 bg-white shadow-sm p-4 rounded-lg lg:p-6">
        <div className="grid md:grid-cols-2 items-center gap-x-8 gap-y-12">
          {/* Left side: form */}
          <div className="max-w-md mx-auto w-full p-2 md:p-4">
            <div className="mb-10">
              <h1 className="text-2xl font-bold text-slate-900">E-HRMS</h1>
              <p className="text-sm text-slate-500 mt-1">Employee HR Management System</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="mb-2 text-slate-900 font-medium text-sm inline-block">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="px-3 py-2.5 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
                />
              </div>

              <div className="relative">
                <label htmlFor="password" className="mb-2 text-slate-900 font-medium text-sm inline-block">
                  Password
                </label>

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute top-1 right-2 p-0.5 flex cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-[18px] fill-slate-400 text-slate-400 overflow-visible"
                    viewBox="0 0 128 128"
                  >
                    <path d="M64 104C22.127 104 1.367 67.496.504 65.943a4 4 0 0 1 0-3.887C1.367 60.504 22.127 24 64 24s62.633 36.504 63.496 38.057a4 4 0 0 1 0 3.887C126.633 67.496 105.873 104 64 104zM8.707 63.994C13.465 71.205 32.146 96 64 96c31.955 0 50.553-24.775 55.293-31.994C114.535 56.795 95.854 32 64 32 32.045 32 13.447 56.775 8.707 63.994zM64 88c-13.234 0-24-10.766-24-24s10.766-24 24-24 24 10.766 24 24-10.766 24-24 24zm0-40c-8.822 0-16 7.178-16 16s7.178 16 16 16 16-7.178 16-16-7.178-16-16-16z" />
                    {!showPassword && (
                      <path
                        d="M10.586 10.586l106.828 106.828"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                </button>

                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="px-3 py-2.5 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
                />
              </div>

              <div className="flex items-start flex-wrap gap-2">
                <label className="flex items-center group has-[input:checked]:text-slate-900 cursor-pointer">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="sr-only"
                  />
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded outline-1 outline-slate-300 bg-white group-has-[input:checked]:bg-blue-600 group-has-[input:checked]:outline-blue-600 group-focus-within:outline-2 group-focus-within:outline-blue-600"
                    aria-hidden="true"
                  >
                    <svg
                      className="size-3 text-white opacity-0 group-has-[input:checked]:opacity-100"
                      viewBox="0 0 12 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 5l3 3 7-7" />
                    </svg>
                  </span>
                  <span className="ml-3 text-sm text-slate-700">Remember me</span>
                </label>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 px-3.5 text-sm rounded-md font-semibold cursor-pointer tracking-wide text-white border border-blue-600 bg-blue-600 hover:bg-blue-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
              >
                {submitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>

          {/* Right side: image panel */}
          <div className="aspect-square bg-gray-50 relative before:absolute before:inset-0 before:bg-indigo-600/70 rounded-md overflow-hidden w-full h-full hidden md:block">
            <img
              src="https://readymadeui.com/team-image.webp"
              className="w-full h-full object-cover"
              alt="Team collaborating"
            />
            <div className="absolute inset-0 m-auto max-w-sm p-6 flex items-center justify-center">
              <div>
                <h1 className="text-white text-3xl font-bold">Sign in</h1>
                <p className="text-slate-100 text-base font-medium mt-6 leading-relaxed">
                  Sign in to your account and manage your team's HR, all in one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}