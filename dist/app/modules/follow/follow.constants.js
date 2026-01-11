"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.followSearchableFields = exports.followFilterables = void 0;
// Filterable fields for Follow
exports.followFilterables = [];
// Searchable fields for Follow
exports.followSearchableFields = [];
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
