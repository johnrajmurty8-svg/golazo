export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-4 py-12">
      {/* Wordmark */}
      <div className="mb-8 text-center">
        <h1
          className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="text-[var(--color-text-primary)]">Go</span>
          <span className="text-[var(--color-primary)]">lazo</span>
        </h1>
        <p className="mt-1 text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
          Your trips, automatically organised.
        </p>
      </div>

      {children}
    </div>
  );
}
