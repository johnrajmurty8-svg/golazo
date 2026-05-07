import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/Avatar";
import type { ChatMessage as ChatMessageType } from "@/types/database";

interface ChatMessageProps {
  message: ChatMessageType;
  userName: string;
  isOrganiser: boolean;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function ChatMessage({ message, userName, isOrganiser }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 items-end", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <Avatar
        name={isUser ? userName : "Golazo AI"}
        size={28}
        className="shrink-0 mb-0.5"
      />

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[75%] rounded-[var(--radius-lg)] px-4 py-2.5",
          isUser
            ? "bg-[var(--color-primary)] text-white rounded-br-[var(--radius-sm)]"
            : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-bl-[var(--radius-sm)] shadow-[var(--shadow-sm)]"
        )}
      >
        <p className="text-[var(--font-size-sm)] leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <p
          className={cn(
            "text-[10px] mt-1.5",
            isUser ? "text-white/60 text-right" : "text-[var(--color-text-muted)]"
          )}
        >
          {formatTime(message.created_at)}
          {!isUser && (
            <span className="ml-2 font-[var(--font-weight-medium)] text-[var(--color-primary)]">
              {isOrganiser ? "AI Assistant" : "AI Assistant"}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
