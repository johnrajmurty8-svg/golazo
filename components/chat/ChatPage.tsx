"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { RateLimitBanner } from "./RateLimitBanner";
import { toast } from "@/lib/utils/toast";
import type { ChatMessage as ChatMessageType } from "@/types/database";

interface ChatPageProps {
  tripId: string;
  initialMessages: ChatMessageType[];
  userName: string;
  userRole: "organiser" | "member";
  rateLimitHit: boolean;
}

export function ChatPage({
  tripId,
  initialMessages,
  userName,
  userRole,
  rateLimitHit: initialRateLimitHit,
}: ChatPageProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(false);
  const [rateLimitHit, setRateLimitHit] = useState(initialRateLimitHit);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(text: string) {
    // Optimistically add user message
    const optimistic: ChatMessageType = {
      id: `opt-${Date.now()}`,
      trip_id: tripId,
      user_id: "me",
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setLoading(true);

    try {
      const res = await fetch(`/api/trips/${tripId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setRateLimitHit(true);
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        return;
      }

      if (!res.ok) {
        toast.error(data.error ?? "AI service unavailable. Please try again shortly.");
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        return;
      }

      // Replace optimistic + add assistant response. Guard against a missing
      // userMessage/assistantMessage in the API response so a partial body
      // can't poison the array with `undefined` and crash the messages.map.
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        data.userMessage,
        data.assistantMessage,
      ].filter((m): m is ChatMessageType => Boolean(m?.id)));
    } catch {
      toast.error("AI service unavailable. Please try again shortly.");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Role badge header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
        <div>
          <p className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
            AI Chat
          </p>
          <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
            Answers from your trip data only
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-[var(--color-surface-secondary)] px-2.5 py-1 text-[var(--font-size-xs)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)]">
          {userRole === "organiser" ? "Organiser" : "Group Member"}
        </span>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-5 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center mb-3">
              <span className="text-[var(--color-primary)] text-xl">✦</span>
            </div>
            <p className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
              Ask me anything about your trip
            </p>
            <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mt-1">
              Flight times, check-in dates, what&apos;s planned…
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            userName={userName}
            isOrganiser={userRole === "organiser"}
          />
        ))}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Rate limit banner */}
      {rateLimitHit && <RateLimitBanner />}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={rateLimitHit}
        loading={loading}
      />
    </div>
  );
}
