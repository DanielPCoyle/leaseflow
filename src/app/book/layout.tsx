import Link from "next/link";

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-white dark:bg-secondary">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/book" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="material-icons text-white text-lg">apartment</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-secondary dark:text-white">
              LeaseFlow
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/book"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Browse Properties
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
