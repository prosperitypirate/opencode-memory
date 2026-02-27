import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
        Persistent memory for AI coding agents
      </h1>
      <p className="mb-8 max-w-2xl text-lg text-fd-muted-foreground">
        Your AI remembers everything — architecture, decisions, patterns,
        progress — across every session, automatically.
      </p>
      <div className="flex gap-4">
        <Link
          href="/docs"
          className="rounded-lg bg-fd-primary px-6 py-3 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
        >
          Get Started
        </Link>
        <a
          href="https://github.com/prosperitypirate/codexfi"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-fd-border px-6 py-3 text-sm font-medium transition-colors hover:bg-fd-accent"
        >
          View on GitHub
        </a>
      </div>
    </main>
  );
}
