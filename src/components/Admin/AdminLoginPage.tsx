import React, { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowRight, IconEye, IconEyeOff, IconHome, IconLock, IconMail, IconShieldCheck } from "@tabler/icons-react";
import brandLogo from "../../assets/gs-logo.png";
import "./AdminLogin.css";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin@123";

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      setError("Email or password is incorrect. Please try again.");
      return;
    }
    setError("");
    onLogin();
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-brand-panel">
        <div className="admin-login-orb admin-login-orb-one" />
        <div className="admin-login-orb admin-login-orb-two" />
        <div className="admin-login-brand">
          <img src={brandLogo} alt="Gaurav Sales logo" />
          <span>Gaurav <strong>Sales</strong></span>
        </div>
        <div className="admin-login-brand-copy">
          <span className="admin-login-kicker"><IconShieldCheck size={15} /> ADMIN WORKSPACE</span>
          <h1>Everything your store needs, in one place.</h1>
          <p>Manage products, follow every order, and keep your business moving with a clear view of your store.</p>
        </div>
        <div className="admin-login-brand-footer"><span className="admin-login-status-dot" /> Secure store management <span>·</span> Gaurav Sales</div>
      </section>

      <section className="admin-login-form-panel">
        <Link className="admin-login-home" to="/" aria-label="Go to home page"><IconHome size={17} /><span>Home</span></Link>
        <form className="admin-login-form" onSubmit={submit}>
          <div className="admin-login-mobile-brand"><img src={brandLogo} alt="" /><strong>Gaurav Sales</strong></div>
          <span className="admin-login-form-kicker">WELCOME BACK</span>
          <h2>Sign in to your account</h2>
          <p className="admin-login-intro">Enter your administrator details to continue.</p>

          <label className="admin-login-field">
            <span>Email address</span>
            <span className="admin-login-input-wrap"><IconMail size={18} /><input type="email" autoComplete="username" required value={email} onChange={(event) => { setEmail(event.currentTarget.value); setError(""); }} placeholder="admin@gmail.com" /></span>
          </label>

          <label className="admin-login-field">
            <span>Password</span>
            <span className="admin-login-input-wrap"><IconLock size={18} /><input type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => { setPassword(event.currentTarget.value); setError(""); }} placeholder="Enter your password" /><button className="admin-login-password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}</button></span>
          </label>

          {error && <div className="admin-login-error" role="alert">{error}</div>}
          <button className="admin-login-submit" type="submit">Sign in to dashboard <IconArrowRight size={18} /></button>
          <div className="admin-login-secure-note"><IconShieldCheck size={16} /><span>Authorized administrators only</span></div>
        </form>
        <footer className="admin-login-copyright">© {new Date().getFullYear()} Gaurav Sales. All rights reserved.</footer>
      </section>
    </main>
  );
}
