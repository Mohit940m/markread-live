export default function App() {
  return (
    <div className="min-h-screen bg-canvas text-textPrimary flex flex-col">
      <header className="h-14 border-b border-borderSubtle bg-surface px-4 flex items-center justify-between">
        <h1 className="font-semibold text-lg flex items-center gap-2">
          <span className="text-accent font-bold">MarkRead</span>
          <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-mono">Live</span>
        </h1>
      </header>
      <main className="flex-1 p-4">
        <p className="text-textMuted text-sm">Welcome to MarkRead Live — Ready to read Markdown comfortably.</p>
      </main>
    </div>
  );
}
