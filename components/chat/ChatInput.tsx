"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";

const MAX_CHARS = 2000;

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function ChatInput({ onSend, disabled, loading }: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled || loading) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    if (val.length > MAX_CHARS) return;
    setText(val);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  }

  const remaining = MAX_CHARS - text.length;

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div className="flex items-end gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 focus-within:border-[var(--color-primary)] focus-within:shadow-[var(--shadow-focus)] transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          placeholder="Ask me anything about your trip…"
          rows={1}
          aria-label="Chat message"
          className="flex-1 resize-none bg-transparent text-[var(--font-size-sm)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none leading-relaxed min-h-[24px] max-h-[160px] disabled:opacity-50"
        />
        <div className="flex items-center gap-2 shrink-0 pb-0.5">
          {text.length > MAX_CHARS * 0.9 && (
            <span className="text-[10px] text-[var(--color-text-muted)]">{remaining}</span>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim() || disabled || loading}
            className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white flex items-center justify-center hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
            aria-label="Send message"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={13} strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
      <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 px-1">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
