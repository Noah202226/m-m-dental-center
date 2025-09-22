import { useState } from "react";
import { Mail, Lock } from "lucide-react";

export default function AuthForm({ handleSubmit, submitType, onToggle }) {
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await handleSubmit(e); // your login/signup logic
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card w-full max-w-md shadow-xl bg-base-100">
      <form onSubmit={onSubmit} className="card-body space-y-6">
        {/* Title */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-base-content text-center">
          {submitType === "Sign Up" ? "Create an Account" : "Welcome Back"}
        </h2>

        {/* Email */}
        <div className="form-control">
          <label className="label">
            <span className="label-text text-base-content">Email</span>
          </label>
          <label className="input input-bordered flex items-center gap-2 w-full">
            <Mail className="w-5 h-5 opacity-70 text-base-content" />
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              // defaultValue={"noaligpitan@gmail.com"} // test only
              required
              className="grow text-base-content placeholder:text-base-content/60"
            />
          </label>
        </div>

        {/* Password */}
        <div className="form-control">
          <label className="label">
            <span className="label-text text-base-content">Password</span>
          </label>
          <label className="input input-bordered flex items-center gap-2 w-full">
            <Lock className="w-5 h-5 opacity-70 text-base-content" />
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              // defaultValue={"password123"} // test only
              required
              className="grow text-base-content placeholder:text-base-content/60"
            />
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full flex justify-center items-center"
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm mr-2"></span>
              {submitType}...
            </>
          ) : (
            submitType
          )}
        </button>

        {/* Toggle */}
        {/* {onToggle && (
          <p className="text-center text-sm text-base-content">
            {submitType === "Sign Up" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={onToggle}
                  className="link link-primary"
                  disabled={loading}
                >
                  Log In
                </button>
              </>
            ) : (
              <>
                Don’t have an account?{" "}
                <button
                  type="button"
                  onClick={onToggle}
                  className="link link-primary"
                  disabled={loading}
                >
                  Sign Up
                </button>
              </>
            )}
          </p>
        )} */}
      </form>
    </div>
  );
}
