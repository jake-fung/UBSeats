import { LocateFixed } from 'lucide-react';
import { cn } from '@/utils/cnUtils';

interface LocateButtonProps {
  enabled: boolean;
  onToggle: () => void;
}

const LocateButton = ({ enabled, onToggle }: LocateButtonProps) => (
  <button
    aria-label="Show my location"
    aria-pressed={enabled}
    onClick={onToggle}
    className={cn(
      'flex items-center rounded-full p-3 shadow-lg',
      enabled ? 'bg-primary text-white' : 'bg-white text-gray-700',
    )}
  >
    <LocateFixed />
  </button>
);

export default LocateButton;
