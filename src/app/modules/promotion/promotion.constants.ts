// Filterable fields for Promotion
export const promotionFilterables = ['code', 'description', 'createdBy'];

// Searchable fields for Promotion
export const promotionSearchableFields = ['code', 'description', 'createdBy'];

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};