export type RoomNotesTable = {
  Row: {
    id: string;
    note_id: string;
    room_uuid: string;
  };
  Insert: {
    id?: string;
    note_id: string;
    room_uuid: string;
  };
  Update: {
    id?: string;
    note_id?: string;
    room_uuid?: string;
  };
  Relationships: [
    {
      foreignKeyName: 'room_notes_note_id_fkey';
      columns: ['note_id'];
      isOneToOne: false;
      referencedRelation: 'notes';
      referencedColumns: ['id'];
    },
    {
      foreignKeyName: 'room_notes_room_uuid_fkey';
      columns: ['room_uuid'];
      isOneToOne: false;
      referencedRelation: 'building_rooms';
      referencedColumns: ['uuid'];
    },
  ];
};
