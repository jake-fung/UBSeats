import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// No component test may reach Supabase: every service call rejects unless a test sets it up.
vi.mock('@/supabase/services/supabaseService', () => {
  const unmocked = () => vi.fn(() => Promise.reject(new Error('Unmocked supabaseService call')));
  return {
    fetchCategories: unmocked(),
    fetchBuildings: unmocked(),
    fetchClassroomDaySlots: unmocked(),
    fetchClassroomAvailability: unmocked(),
    fetchRoomAvailability: unmocked(),
    submitFeedback: unmocked(),
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
});
