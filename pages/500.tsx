import ServerIssueState from "../src/components/ServerIssueState";

export default function ServerErrorPage() {
  return (
    <main className="gs-page gs-container gs-server-issue-page">
      <ServerIssueState
        message="Our service is temporarily unavailable. Please try again in a little while."
        onRetry={() => window.location.reload()}
      />
    </main>
  );
}
