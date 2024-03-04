export function Frame ({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-2 px-4 lg:overflow-y-auto lg:max-h-screen">
      {children}
    </div>
  );
}

export function FrameHeader ({ children }: { children: React.ReactNode }) {
  return (
    <header className="mb-4 border-b border-slate-300">
      <div className="flex items-center gap-4">
        {children}
      </div>
    </header>
  );
}
