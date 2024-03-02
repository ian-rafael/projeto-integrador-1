export default function Tag ({children, title}: {children: React.ReactNode, title?: string}) {
  return (
    <span
      className="float-right font-mono text-sm shadow bg-slate-600 text-slate-50 p-1 rounded-sm"
      title={title}
    >
      {children}
    </span>
  );
}
