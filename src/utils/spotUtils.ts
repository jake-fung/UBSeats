import {CategoryType} from './types';

// Utility function to convert a string ID to a CategoryType
export const validateCategoryType = (id: string): CategoryType | undefined => {
  const validCategories: CategoryType[] = ['library', 'cafe', 'quiet', 'outdoor', 'group'];
  return validCategories.includes(id as CategoryType) ? id as CategoryType : undefined;
};
