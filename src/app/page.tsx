export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-surface font-sans">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-center py-32 px-8">
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="material-icons text-white text-2xl">apartment</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-secondary">
              LeaseFlow
            </h1>
          </div>
          <p className="max-w-lg text-lg text-muted leading-relaxed">
            Intelligent multi-property leasing platform with smart scheduling,
            travel-aware availability, and full lifecycle management.
          </p>
          <div className="flex gap-4 mt-4">
            <a
              href="/admin"
              className="flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-white font-medium transition-colors hover:bg-primary-dark"
            >
              Agent Dashboard
            </a>
            <a
              href="/book"
              className="flex h-12 items-center justify-center rounded-xl border border-border px-8 font-medium transition-colors hover:bg-surface"
            >
              Book a Tour
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
