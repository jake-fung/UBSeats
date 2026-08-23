import { CategoryType } from '@/supabase/schema/types';

// Utility function to convert a string ID to a CategoryType
export const validateCategoryType = (id: string): CategoryType | undefined => {
  const validCategories: CategoryType[] = ['bookable','classroom', 'library', 'quiet', 'cafe'];
  return validCategories.includes(id as CategoryType) ? (id as CategoryType) : undefined;
};
