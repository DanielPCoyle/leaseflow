"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/10">
          <span className="material-icons text-muted text-[32px]">wifi_off</span>
        </div>
        <h1 className="text-xl font-bold text-secondary dark:text-white">
          You're Offline
        </h1>
        <p className="mt-2 text-sm text-muted max-w-sm">
          LeaseFlow requires an internet connection. Please check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
