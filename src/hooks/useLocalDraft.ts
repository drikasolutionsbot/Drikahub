import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Persists form state to localStorage as a draft.
 * On mount, restores draft if available. On state change, saves to localStorage (debounced).
 * Call `clearDraft()` after a successful save to remove the local copy.
 *
 * @param key - Unique key for this draft (e.g. "verification" or "product-<id>")
 * @param tenantId - Tenant ID for scoping
 * @param serverState - The state loaded from the server (used as default if no draft exists)
 * @param isReady - Whether the server state has finished loading
 */
export function useLocalDraft<T extends Record<string, any>>(
  key: string,
  tenantId: string | null,
  serverState: T,
  isReady: boolean
): {
  draft: T;
  setDraft: React.Dispatch<React.SetStateAction<T>>;
  clearDraft: () => void;
  hasDraft: boolean;
  discardDraft: () => void;
} {
  const storageKey = tenantId ? `draft:${tenantId}:${key}` : null;

  const [draft, setDraft] = useState<T>(serverState);
  const [hasDraft, setHasDraft] = useState(false);
  const initialized = useRef(false);
  const userEdited = useRef(false);
  const draftRef = useRef<T>(draft);
  const storageKeyRef = useRef(storageKey);
  const serverStateRef = useRef(serverState);

  // Keep refs in sync
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    storageKeyRef.current = storageKey;
  }, [storageKey]);

  useEffect(() => {
    serverStateRef.current = serverState;
  }, [serverState]);

  // On server state ready, check if there's a saved draft
  useEffect(() => {
    if (!isReady || !storageKey) return;

    // Allow re-initialization on every ready cycle (handles remounts)
    initialized.current = true;
    userEdited.current = false;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as T;
        // Only restore draft if it actually differs from server state
        const isDifferent = JSON.stringify(parsed) !== JSON.stringify(serverState);
        if (isDifferent) {
          setDraft(parsed);
          setHasDraft(true);
          return;
        } else {
          // Draft matches server - clean it up
          localStorage.removeItem(storageKey);
        }
      }
    } catch {
      // ignore parse errors
    }

    setDraft(serverState);
    setHasDraft(false);
  }, [isReady, storageKey, serverState]);

  // Debounced save to localStorage on draft changes — only if user has edited
  useEffect(() => {
    if (!storageKey || !initialized.current || !userEdited.current) return;

    const timer = setTimeout(() => {
      try {
        // Don't save if draft matches server state
        if (JSON.stringify(draftRef.current) === JSON.stringify(serverStateRef.current)) {
          localStorage.removeItem(storageKey);
          setHasDraft(false);
        } else {
          localStorage.setItem(storageKey, JSON.stringify(draftRef.current));
          setHasDraft(true);
        }
      } catch {
        // localStorage full or unavailable
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [draft, storageKey]);

  // Flush draft to localStorage on beforeunload to prevent data loss
  useEffect(() => {
    if (!storageKey || !initialized.current) return;

    const handleBeforeUnload = () => {
      const key = storageKeyRef.current;
      const value = draftRef.current;
      if (key && initialized.current && userEdited.current) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [storageKey]);

  // Wrap setDraft to track user edits
  const setDraftWithTracking = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (value) => {
      userEdited.current = true;
      setDraft(value);
    },
    []
  );

  const clearDraft = useCallback(() => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    setHasDraft(false);
    userEdited.current = false;
  }, [storageKey]);

  const discardDraft = useCallback(() => {
    clearDraft();
    setDraft(serverStateRef.current);
  }, [clearDraft]);

  return { draft, setDraft: setDraftWithTracking, clearDraft, hasDraft, discardDraft };
}
