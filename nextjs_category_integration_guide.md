# Next.js Category Integration Guide - Photopia

This guide explains how a Next.js developer should design and integrate the Category system of Photopia.

## 1. System Overview
The Category system is hierarchical and divided into three levels:
- **Themes**: High-level groups (e.g., `PHOTOGRAPHY`, `VIDEOGRAPHY`).
- **Categories**: Main service areas within a theme (e.g., `Portrait & People` under `PHOTOGRAPHY`).
- **Subcategories**: Specific services (e.g., `Studio portrait` under `Portrait & People`).

## 2. API Endpoints

### Get All Categories (with Filters)
**Endpoint:** `GET /api/v1/category`

**Query Parameters:**
- `theme`: Filter by theme (e.g., `theme=PHOTOGRAPHY`)
- `type`: Filter by level (e.g., `type=category` or `type=subcategory`)
- `parent`: Filter by parent ID (useful for getting subcategories of a specific category)
- `isActive`: `true` (default)
- `limit`: Number of items per page
- `page`: Current page number

### Get Single Category
**Endpoint:** `GET /api/v1/category/:id`

---

## 3. Integration Logic (Next.js)

### A. Fetching Themes
Since Themes are hardcoded in the database, you can get unique themes by fetching all main categories and extracting unique `theme` values, or by using a specific filter.

```typescript
// Fetch unique themes
const response = await axios.get('/api/v1/category?type=category&limit=100');
const themes = [...new Set(response.data.data.map(cat => cat.theme))];
```

### B. Fetching Categories for a Theme
When a user selects a Theme (e.g., Photography), fetch its categories:

```typescript
const getCategoriesByTheme = async (themeName: string) => {
  const res = await axios.get(`/api/v1/category?theme=${themeName}&type=category`);
  return res.data.data; // List of categories
};
```

### C. Fetching Subcategories
When a user selects a Category, fetch its subcategories using the `parent` filter:

```typescript
const getSubCategories = async (categoryId: string) => {
  const res = await axios.get(`/api/v1/category?parent=${categoryId}&type=subcategory`);
  return res.data.data; // List of subcategories
};
```

---

## 4. UI/UX Design Recommendations

### Theme Selection (Level 1)
- **Component**: Horizontal Tabs or a Sidebar.
- **Iconography**: Use icons for `Photography` (Camera), `Videography` (Video Camera), and `Post-Production` (Edit icon).

### Category Listing (Level 2)
- **Component**: A Grid of Cards or an Accordion.
- **Interaction**: Clicking a category should expand it to show subcategories or navigate to a filtered service list.

### Subcategory Selection (Level 3)
- **Component**: Checkboxes (for multi-select filters) or simple Chips/Tags.
- **Usage**: These are typically used in the "Create Service" form or the "Search Filter" sidebar.

## 5. Implementation Example (React/Next.js Component)

```tsx
'use client';
import { useState, useEffect } from 'react';

export default function CategorySelector() {
  const [selectedTheme, setSelectedTheme] = useState('PHOTOGRAPHY');
  const [categories, setCategories] = useState([]);
  
  useEffect(() => {
    // Fetch categories when theme changes
    fetch(`/api/v1/category?theme=${selectedTheme}&type=category`)
      .then(res => res.json())
      .then(data => setCategories(data.data));
  }, [selectedTheme]);

  return (
    <div>
      {/* Theme Tabs */}
      <div className="flex gap-4">
        {['PHOTOGRAPHY', 'VIDEOGRAPHY', 'EDITING & POST-PRODUCTION'].map(theme => (
          <button 
            key={theme}
            onClick={() => setSelectedTheme(theme)}
            className={selectedTheme === theme ? 'active' : ''}
          >
            {theme}
          </button>
        ))}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        {categories.map(cat => (
          <CategoryCard key={cat._id} category={cat} />
        ))}
      </div>
    </div>
  );
}
```

## 6. Key Data Fields to Use
- `_id`: Use for API requests.
- `name`: Display text.
- `theme`: Grouping header.
- `parent`: Hierarchy linking.
- `type`: Logic switching (Category vs Subcategory).
