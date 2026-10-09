import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// No component test may reach Supabase: every service call rejects unless a test sets it up.
// TanStack Query swallows the rejection, so unmocked calls are also recorded and fail the test in afterEach.
const unmockedCalls = vi.hoisted(() => [] as string[]);
vi.mock('@/supabase/services/supabaseService', () => {
  const unmocked = (name: string) =>
    vi.fn(() => {
      unmockedCalls.push(name);
      return Promise.reject(new Error(`Unmocked supabaseService call: ${name}`));
    });
  return {
    fetchCategories: unmocked('fetchCategories'),
    fetchBuildings: unmocked('fetchBuildings'),
    fetchClassroomDaySlots: unmocked('fetchClassroomDaySlots'),
    fetchClassroomAvailability: unmocked('fetchClassroomAvailability'),
    fetchRoomAvailability: unmocked('fetchRoomAvailability'),
    submitFeedback: unmocked('submitFeedback'),
  };
});

// Radix (Dialog, Popover, Tooltip) calls browser APIs that jsdom doesn't implement.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
  // Back to the rejecting defaults, so one test's mockResolvedValue can't leak into the next.
  vi.resetAllMocks();
  const calls = unmockedCalls.splice(0);
  if (calls.length > 0) throw new Error(`Unmocked supabaseService call(s): ${[...new Set(calls)].join(', ')}`);
});
