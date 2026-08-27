import { Users } from 'lucide-react';

interface CapacityRowProps {
  capacity: number | null;
}

export const CapacityRow = ({ capacity }: CapacityRowProps) => {
  if (capacity == null) return null;
  return (
    <div className="flex items-center text-sm text-gray-500">
      <Users className="mr-2 h-4 w-4" />
      <span>Capacity: {capacity}</span>
    </div>
  );
};
