import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-white dark:bg-secondary">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/resident" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="material-icons text-white text-lg">apartment</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-secondary dark:text-white">
              Resident Portal
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/resident" className="text-muted hover:text-foreground">Home</Link>
            <Link href="/resident/maintenance" className="text-muted hover:text-foreground">Maintenance</Link>
            <Link href="/resident/payments" className="text-muted hover:text-foreground">Payments</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
