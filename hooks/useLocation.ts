import { useLocationContext, Coords } from '../contexts/LocationContext';

// Re-export Coords for compatibility
export type { Coords };

export function useLocation() {
  return useLocationContext();
}
