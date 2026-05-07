import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const BG_COLORS = [
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-yellow-100 text-yellow-700",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

export function Avatar({ name, avatarUrl, size = 32, className }: AvatarProps) {
  const initials = getInitials(name);
  const colorClass = getColor(name);

  return (
    <div
      className={cn(
        "rounded-full overflow-hidden flex items-center justify-center shrink-0 select-none",
        !avatarUrl && colorClass,
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={name}
      aria-label={name}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-[var(--font-weight-semibold)]">{initials}</span>
      )}
    </div>
  );
}
