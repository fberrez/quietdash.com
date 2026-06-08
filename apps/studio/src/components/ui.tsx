import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "accent" | "ghost" | "danger" }) {
  const base = "rounded-md px-3.5 py-2 text-sm font-medium transition disabled:opacity-50";
  const styles = {
    primary: "bg-ink text-paper hover:opacity-90",
    accent: "bg-brick text-paper hover:bg-brick-deep",
    ghost: "border border-line text-ink hover:bg-paper-sunk",
    danger: "border border-line text-ink-soft hover:border-brick hover:text-brick-deep",
  }[variant];
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink-soft/70 focus:border-brick focus:ring-2 focus:ring-brick/20"
      {...props}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none transition focus:border-brick focus:ring-2 focus:ring-brick/20"
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

export function CenterCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-card p-6 shadow-sm">
        <div className="label text-brick mb-3">QuietDash</div>
        <h1 className="text-xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ tone, children }: { tone: "ink" | "soft" | "brick"; children: ReactNode }) {
  const styles = {
    ink: "bg-ink/10 text-ink",
    soft: "bg-paper-sunk text-ink-soft",
    brick: "bg-brick/12 text-brick-deep",
  }[tone];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>{children}</span>;
}
