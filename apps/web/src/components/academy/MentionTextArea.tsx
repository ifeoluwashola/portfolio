"use client";

import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import { User } from "lucide-react";
import { searchStudents } from "@/app/academy/actions";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  cohort_id: number;
  avatar_s3_key?: string;
  username: string;
  display_name?: string;
}

interface MentionTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
  onFocus?: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function MentionTextArea({
  value,
  onChange,
  placeholder,
  disabled,
  rows = 3,
  className = "",
  onFocus,
  inputRef,
}: MentionTextAreaProps) {
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerIndex, setTriggerIndex] = useState(-1);
  const localRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef || localRef;
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (!showSuggestions || triggerIndex === -1) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await searchStudents(searchQuery);
        if (Array.isArray(data)) {
          // Exclude students who don't have a valid username
          setSuggestions(data.filter((s) => s.username));
        }
      } catch (err) {
        console.error("Failed to fetch students for autocomplete", err);
      }
    }, 200); // 200ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, showSuggestions, triggerIndex]);

  const checkMentionTrigger = (text: string, caretPos: number) => {
    // Look backward from caret position to see if we are in a mention
    const beforeCaret = text.slice(0, caretPos);
    
    // Find the last "@" character before the caret
    const lastAtIdx = beforeCaret.lastIndexOf("@");
    if (lastAtIdx === -1) {
      setShowSuggestions(false);
      setTriggerIndex(-1);
      return;
    }

    // Ensure the "@" is either at the start of text or preceded by whitespace/newline
    const charBeforeAt = lastAtIdx > 0 ? beforeCaret[lastAtIdx - 1] : "";
    const isValidTrigger = lastAtIdx === 0 || /\s/.test(charBeforeAt);

    if (!isValidTrigger) {
      setShowSuggestions(false);
      setTriggerIndex(-1);
      return;
    }

    // Extract the text segment from "@" to the caret
    const mentionSegment = beforeCaret.slice(lastAtIdx + 1);

    // If there is any space in the segment, the mention trigger is completed/invalidated
    if (/\s/.test(mentionSegment)) {
      setShowSuggestions(false);
      setTriggerIndex(-1);
      return;
    }

    // We are actively inside a mention query!
    setTriggerIndex(lastAtIdx);
    setSearchQuery(mentionSegment);
    setShowSuggestions(true);
    setActiveIndex(0);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);

    const caretPos = e.target.selectionStart;
    checkMentionTrigger(val, caretPos);
  };

  const handleTextareaSelectOrKeyUp = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    checkMentionTrigger(target.value, target.selectionStart);
  };

  const handleSelectStudent = (student: Student) => {
    if (triggerIndex === -1 || !textareaRef.current) return;

    const caretPos = textareaRef.current.selectionStart;
    const textBeforeTrigger = value.slice(0, triggerIndex);
    const textAfterCaret = value.slice(caretPos);

    // Insert @username and a space
    const mentionText = `@${student.username} `;
    const newValue = textBeforeTrigger + mentionText + textAfterCaret;
    
    onChange(newValue);
    setShowSuggestions(false);
    setTriggerIndex(-1);

    // Reset caret position right after the inserted space
    const newCaretPos = triggerIndex + mentionText.length;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCaretPos, newCaretPos);
      }
    }, 10);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelectStudent(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onKeyUp={handleTextareaSelectOrKeyUp}
        onSelect={handleTextareaSelectOrKeyUp}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`w-full ${className}`}
      />

      {/* Autocomplete Suggestions Popover */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={popoverRef}
          className="absolute z-50 bottom-full left-0 mb-2 w-72 bg-slate-950/95 backdrop-blur-md border border-yellow-500/20 rounded-2xl shadow-2xl max-h-56 overflow-y-auto scrollbar-hide py-2 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {suggestions.map((student, idx) => {
            const displayName = student.display_name || `${student.first_name || ""} ${student.last_name || ""}`.trim() || student.username;
            const isHighlighted = idx === activeIndex;
            
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => handleSelectStudent(student)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors border-l-2 ${
                  isHighlighted
                    ? "bg-yellow-500/10 text-yellow-500 border-yellow-500"
                    : "text-foreground hover:bg-slate-900 border-transparent"
                }`}
              >
                {/* Fallback User Avatar with initials */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-[10px] font-black shrink-0 uppercase select-none transition-colors ${
                  isHighlighted 
                    ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-500" 
                    : "bg-slate-900 border-border text-muted-foreground"
                }`}>
                  {student.username ? student.username[0] : <User className="w-3.5 h-3.5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate leading-tight ${isHighlighted ? "text-yellow-500" : "text-foreground"}`}>
                    @{student.username}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 truncate uppercase tracking-tight mt-0.5">
                    {displayName}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
