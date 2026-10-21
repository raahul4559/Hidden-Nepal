"use client";

import { useEffect, useId, useState } from "react";

type DestinationSuggestion = {
  slug: string;
  name: string;
  district: string | null;
  region: string;
};

type DestinationSuggestionsInputProps = {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder: string;
  className: string;
};

export function DestinationSuggestionsInput({
  id,
  name,
  defaultValue,
  placeholder,
  className,
}: DestinationSuggestionsInputProps) {
  const listId = useId();
  const [value, setValue] = useState(defaultValue ?? "");
  const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`/api/destinations/suggestions?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Suggestion request failed");
          const result: { suggestions: DestinationSuggestion[] } = await response.json();
          setSuggestions(result.suggestions);
          setActiveIndex(-1);
          setError(false);
          setOpen(result.suggestions.length > 0);
        })
        .catch((requestError: unknown) => {
          if (requestError instanceof Error && requestError.name === "AbortError") return;
          setSuggestions([]);
          setError(true);
          setOpen(true);
        });
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  function chooseSuggestion(suggestion: DestinationSuggestion) {
    setValue(suggestion.name);
    setSuggestions([]);
    setActiveIndex(-1);
    setOpen(false);
    setError(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault();
      chooseSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type="search"
        maxLength={80}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open && suggestions.length ? listId : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        aria-describedby={error ? `${listId}-error` : undefined}
        className={className}
        onChange={(event) => {
          setValue(event.currentTarget.value);
          setSuggestions([]);
          setActiveIndex(-1);
          setOpen(false);
          setError(false);
        }}
        onFocus={() => {
          if (suggestions.length || error) setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />

      {open && (suggestions.length > 0 || error) ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-white text-navy shadow-lg">
          {error ? (
            <p id={`${listId}-error`} role="status" className="px-3 py-2 text-sm">
              Suggestions are unavailable. You can still search.
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Place suggestions" className="py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.slug}
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={
                    index === activeIndex
                      ? "cursor-pointer bg-ivory px-3 py-2"
                      : "cursor-pointer px-3 py-2 hover:bg-ivory"
                  }
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseSuggestion(suggestion)}
                >
                  <span className="block text-sm font-medium">{suggestion.name}</span>
                  <span className="block text-xs text-ink-muted">
                    {[suggestion.district, suggestion.region].filter(Boolean).join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
