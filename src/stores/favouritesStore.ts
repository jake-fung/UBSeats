const STORAGE_KEY = 'ubseats:favourites';

// Immutable snapshot; replaced only when the set of favourites actually changes,
// so useSyncExternalStore's getSnapshot returns a stable reference between renders.
let snapshot: ReadonlySet<string> = readFromStorage();
const listeners = new Set<() => void>();

function readFromStorage(): ReadonlySet<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    // Storage unavailable or corrupt JSON: start empty.
    return new Set();
  }
}

function persist(favourites: ReadonlySet<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favourites]));
  } catch {
    // Storage unavailable (private mode / quota / disabled): run in-memory only.
  }
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): ReadonlySet<string> {
  return snapshot;
}

export function isFavourite(uuid: string): boolean {
  return snapshot.has(uuid);
}

export function toggle(uuid: string): void {
  const next = new Set(snapshot);
  if (next.has(uuid)) {
    next.delete(uuid);
  } else {
    next.add(uuid);
  }
  snapshot = next;
  persist(snapshot);
  emit();
}

// Keep other tabs in sync: re-read the set when localStorage changes elsewhere.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = readFromStorage();
    emit();
  });
}
