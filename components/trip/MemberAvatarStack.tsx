import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

interface Member {
  user_id: string;
  role: "organiser" | "member";
  profiles: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface MemberAvatarStackProps {
  members: Member[];
}

export function MemberAvatarStack({ members }: MemberAvatarStackProps) {
  const visible = members.slice(0, 5);
  const overflow = members.length - 5;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center">
        {visible.map((m, i) => (
          <div
            key={m.user_id}
            className="rounded-full border-2 border-[var(--color-surface)] relative"
            style={{ marginLeft: i === 0 ? 0 : -8, zIndex: visible.length - i }}
            title={m.profiles?.display_name}
          >
            <Avatar
              name={m.profiles?.display_name ?? "Member"}
              avatarUrl={m.profiles?.avatar_url}
              size={32}
            />
          </div>
        ))}
        {overflow > 0 && (
          <div
            className="rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-surface-secondary)] flex items-center justify-center text-[var(--font-size-xs)] text-[var(--color-text-secondary)] font-[var(--font-weight-medium)]"
            style={{ width: 32, height: 32, marginLeft: -8 }}
          >
            +{overflow}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
        <Users size={14} strokeWidth={1.5} />
        <span>
          {members.length} traveller{members.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
