"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.promotionSearchableFields = exports.promotionFilterables = void 0;
// Filterable fields for Promotion
exports.promotionFilterables = ['code', 'description', 'createdBy'];
// Searchable fields for Promotion
exports.promotionSearchableFields = ['code', 'description', 'createdBy'];
// Helper function for set comparison
const isSetEqual = (setA, setB) => {
    if (setA.size !== setB.size)
        return false;
    for (const item of setA) {
        if (!setB.has(item))
            return false;
    }
    return true;
};
exports.isSetEqual = isSetEqual;
