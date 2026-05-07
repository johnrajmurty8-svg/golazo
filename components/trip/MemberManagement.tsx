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

interface MemberManagementProps {
  members: Member[];
}

export function MemberManagement({ members }: MemberManagementProps) {
  return (
    <div className="space-y-2">
      {members.length === 0 ? (
        <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] italic py-2">
          No members yet.
        </p>
      ) : (
        members.map((m) => (
          <div
            key={m.user_id}
            className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] px-3 py-2.5"
          >
            <Avatar
              name={m.profiles?.display_name ?? "Member"}
              avatarUrl={m.profiles?.avatar_url}
              size={32}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)] truncate">
                {m.profiles?.display_name ?? "Unknown"}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[var(--font-size-xs)] font-[var(--font-weight-medium)] ${
                m.role === "organiser"
                  ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
              }`}
            >
              {m.role === "organiser" ? "Organiser" : "Member"}
            </span>
          </div>
        ))
      )}

      <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] pt-1">
        Members join via the shared link. Email invites are coming in V2.
      </p>
    </div>
  );
}
