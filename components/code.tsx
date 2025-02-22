export function Code({ children }: { children: string }) {
  return (
    <div className="-mx-2 whitespace-pre-wrap break-all rounded-md border border-stone-200 bg-white px-6 py-4 font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-stone-50">
      {children}
    </div>
  );
}

export function CodeInline({ children }: { children: string }) {
  return (
    <span className="-mx-1 -my-0.5 rounded-sm border bg-neutral-50 px-1 py-0.5 font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-stone-50">
      {children}
    </span>
  );
}
