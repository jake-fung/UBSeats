import { LocateFixed } from 'lucide-react';
import { RoundButton } from '@/components/ui/round-button';

interface LocateButtonProps {
  enabled: boolean;
  onToggle: () => void;
}

const LocateButton = ({ enabled, onToggle }: LocateButtonProps) => (
  <RoundButton label="Show my location" pressed={enabled} onClick={onToggle}>
    <LocateFixed aria-hidden="true" />
  </RoundButton>
);

export default LocateButton;
