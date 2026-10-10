export function MedicalInformation({ notes }: { notes?: string | null }) {
  if (!notes?.trim()) return null;
  return (
    <div className="min-w-0 space-y-2 min-[360px]:col-span-2">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Safety / medical note
      </p>
      <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
        {notes.trim()}
      </p>
    </div>
  );
}
