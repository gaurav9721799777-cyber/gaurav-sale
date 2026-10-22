import {
  IconArrowLeft,
  IconHome,
  IconRefresh,
  IconServer,
} from "@tabler/icons-react";

type ServerIssueStateProps = {
  message: string;
  onRetry: () => void;
  compact?: boolean;
};

export default function ServerIssueState({
  message,
  onRetry,
  compact = false,
}: ServerIssueStateProps) {
  return (
    <section
      className={`gs-server-issue${compact ? " is-compact" : ""}`}
      aria-labelledby="gs-server-issue-title"
      role="alert"
    >
      <div className="gs-server-issue-art" aria-hidden="true">
        <span className="gs-server-issue-orbit" />
        <span className="gs-server-issue-icon">
          <IconServer size={34} stroke={1.5} />
        </span>
        <span className="gs-server-issue-status">
          <span />
          CONNECTION PAUSED
        </span>
      </div>
      <div className="gs-server-issue-copy">
        <span className="gs-server-issue-eyebrow">A QUICK POWER CHECK</span>
        <h2 id="gs-server-issue-title">We’ll be back in a moment.</h2>
        <p>{message}</p>
        <div className="gs-server-issue-actions">
          <button
            className="gs-server-issue-retry"
            type="button"
            onClick={onRetry}
          >
            <IconRefresh size={17} />
            Try again
          </button>
          <a className="gs-server-issue-home" href="/">
            {compact ? <IconHome size={16} /> : <IconArrowLeft size={16} />}
            {compact ? "Go to home" : "Back to home"}
          </a>
        </div>
        <span className="gs-server-issue-footnote">
          Your visit is safe. Please try again shortly.
        </span>
      </div>
    </section>
  );
}
