import React, { FormEvent, useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconEye,
  IconEyeOff,
  IconHome,
  IconLock,
  IconMail,
  IconShieldCheck,
} from "@tabler/icons-react";
import brandLogo from "../../assets/gs-logo.png";
import { assetSource } from "../../utils/assetSource";

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Could not sign in.");
      setError("");
      onLogin();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not sign in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-brand-panel">
        <div className="admin-login-orb admin-login-orb-one" />
        <div className="admin-login-orb admin-login-orb-two" />
        <div className="admin-login-brand">
          <img src={assetSource(brandLogo)} alt="Gaurav Sales logo" />
          <span>
            Gaurav <strong>Sales</strong>
          </span>
        </div>
        <div className="admin-login-brand-copy">
          <span className="admin-login-kicker">
            <IconShieldCheck size={15} /> ADMIN WORKSPACE
          </span>
          <h1>Everything your store needs, in one place.</h1>
          <p>
            Manage products, follow every order, and keep your business moving
            with a clear view of your store.
          </p>
        </div>
        <div className="admin-login-brand-footer">
          <span className="admin-login-status-dot" /> Secure store management{" "}
          <span>·</span> Gaurav Sales
        </div>
      </section>

      <section className="admin-login-form-panel">
        <Link className="admin-login-home" href="/" aria-label="Go to home page">
          <IconHome size={17} />
          <span>Home</span>
        </Link>
        <form className="admin-login-form" onSubmit={submit}>
          <div className="admin-login-mobile-brand">
            <img src={assetSource(brandLogo)} alt="" />
            <strong>Gaurav Sales</strong>
          </div>
          <span className="admin-login-form-kicker">WELCOME BACK</span>
          <h2>Sign in to your account</h2>
          <p className="admin-login-intro">
            Enter your administrator details to continue.
          </p>

          <label className="admin-login-field">
            <span>Username</span>
            <span className="admin-login-input-wrap">
              <IconMail size={18} />
              <input
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(event) => {
                  setUsername(event.currentTarget.value);
                  setError("");
                }}
                placeholder="Enter your username"
              />
            </span>
          </label>

          <label className="admin-login-field">
            <span>Password</span>
            <span className="admin-login-input-wrap">
              <IconLock size={18} />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.currentTarget.value);
                  setError("");
                }}
                placeholder="Enter your password"
              />
              <button
                className="admin-login-password-toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? (
                  <IconEyeOff size={18} />
                ) : (
                  <IconEye size={18} />
                )}
              </button>
            </span>
          </label>

          {error && (
            <div className="admin-login-error" role="alert">
              {error}
            </div>
          )}
          <button className="admin-login-submit" type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in to dashboard"}{" "}
            <IconArrowRight size={18} />
          </button>
          <div className="admin-login-secure-note">
            <IconShieldCheck size={16} />
            <span>Authorized administrators only</span>
          </div>
        </form>
        <footer className="admin-login-copyright">
          © {new Date().getFullYear()} Gaurav Sales. All rights reserved.
        </footer>
      </section>
    </main>
  );
}
