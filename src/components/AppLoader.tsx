import React from "react";
import brandLogo from "../assets/gs-logo.png";
import "./AppLoader.css";

type AppLoaderProps = {
  label?: string;
  variant?: "screen" | "section" | "inline";
};

export default function AppLoader({ label = "Loading", variant = "section" }: AppLoaderProps) {
  return (
    <div className={`gs-app-loader gs-app-loader-${variant}`} role="status" aria-live="polite" aria-label={label}>
      <span className="gs-app-loader-emblem"><img src={brandLogo} alt="" /></span>
      <span className="gs-app-loader-copy"><strong>{label}</strong><span className="gs-app-loader-track"><i /></span></span>
    </div>
  );
}
