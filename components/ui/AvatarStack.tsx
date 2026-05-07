import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils/cn";

interface Member {
  id: string;
  display_name: string;
  avatar_url?: string | null;
}

interface AvatarStackProps {
  members: Member[];
  max?: number;
  size?: number;
  className?: string;
}

export function AvatarStack({ members, max = 4, size = 32, className }: AvatarStackProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <div className={cn("flex items-center", className)} style={{ marginLeft: visible.length > 1 ? 8 : 0 }}>
      {visible.map((member, i) => (
        <div
          key={member.id}
          className="rounded-full border-2 border-[var(--color-surface)]"
          style={{ marginLeft: i === 0 ? 0 : -(size * 0.25), zIndex: visible.length - i }}
        >
          <Avatar
            name={member.display_name}
            avatarUrl={member.avatar_url}
            size={size}
          />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-surface-secondary)] flex items-center justify-center shrink-0"
          style={{
            width: size,
            height: size,
            marginLeft: -(size * 0.25),
            fontSize: size * 0.35,
          }}
        >
          <span className="text-[var(--color-text-secondary)] font-[var(--font-weight-medium)]">
            +{overflow}
          </span>
        </div>
      )}
    </div>
  );
}
