export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
      <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
        Loading VaahanSafe Experience...
      </p>
    </div>
  );
}
