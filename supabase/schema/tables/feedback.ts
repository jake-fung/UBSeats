export type FeedbackTable = {
  Row: {
    category: string;
    created_at: string;
    device: string;
    id: string;
    message: string;
  };
  Insert: {
    category: string;
    created_at?: string;
    device: string;
    id?: string;
    message: string;
  };
  Update: {
    category?: string;
    created_at?: string;
    device?: string;
    id?: string;
    message?: string;
  };
  Relationships: [];
};

export type FeedbackCategory = 'bug' | 'feature' | 'spot' | 'other';

export type FeedbackDevice = 'iphone' | 'android' | 'ipad' | 'desktop';

export interface FeedbackInput {
  category: FeedbackCategory;
  device: FeedbackDevice;
  message: string;
}
