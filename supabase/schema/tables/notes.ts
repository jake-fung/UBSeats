export type NotesTable = {
  Row: {
    color: string | null;
    description: string | null;
    icon: string | null;
    id: string;
    name: string;
  };
  Insert: {
    color?: string | null;
    description?: string | null;
    icon?: string | null;
    id: string;
    name: string;
  };
  Update: {
    color?: string | null;
    description?: string | null;
    icon?: string | null;
    id?: string;
    name?: string;
  };
  Relationships: [];
};

export interface Note {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  icon: string | null;
}
