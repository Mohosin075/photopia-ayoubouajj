# 🖥️ Project Ideas Admin Dashboard: UI & API Integration Guide

This guide details the specifications for the Admin Dashboard UI and Backend API integration to perform CRUD operations on **Project Ideas** (formerly known as Inspirations or Idea Cards).

---

## 📖 Feature Overview
Administrators need a management interface to:
1. View all configured Project Ideas in a paginated list/table.
2. Search and sort ideas (primarily by `order` value).
3. Create new Project Ideas and link them to valid database subcategories.
4. Edit existing Project Ideas (titles, links, subcategories, or display order).
5. Delete Project Ideas that are no longer needed.

---

## 🎨 UI/UX Mockup & Component Specifications

The management interface should consist of two main components:
1. **Management Table (Main Panel)**
2. **Create/Edit Idea Dialog (Modal Form)**

### 1. Management Table / List View
A high-quality table displaying the active cards.

- **Columns**:
  - **Order**: A badge showing the display order (e.g., `1`, `2`). Should support drag-and-drop reordering for premium UX.
  - **Title / Question**: The main card text with emojis.
  - **Link Text**: The CTA text on the card.
  - **Subcategory**: The linked subcategory name and theme badge (e.g., `Wedding` - `Theme: PHOTOGRAPHY`).
  - **Created At**: Date formatted nicely.
  - **Actions**: Edit (Icon Button) & Delete (Icon Button with confirmation dialog).

- **Controls**:
  - **Search Bar**: Filters results dynamically via typing.
  - **"Add Project Idea" Button**: Opens the creation modal.

```
+-----------------------------------------------------------------------------------------+
|  Project Ideas Management                                      [ Search... ] [ + Add ]  |
+---------+-----------------------------------------+-------------------------+-----------+
|  Order  | Title                                   | Linked Subcategory      | Actions   |
+---------+-----------------------------------------+-------------------------+-----------+
|   1     | Are 🏠 you planning a wedding? 💍       | Wedding (PHOTOGRAPHY)   | [✏️] [🗑️] |
|   2     | Expecting a new family member? 👶       | Newborn (PHOTOGRAPHY)   | [✏️] [🗑️] |
+---------+-----------------------------------------+-------------------------+-----------+
```

### 2. Create / Edit Dialog (Modal Form)
A clean, premium form with the following fields:

- **Title/Question (Input Text)**:
  - *Validation*: Required. Character count warning at 80 characters.
  - *Placeholder*: `e.g. Are you planning a wedding?`
- **Link Text (Input Text)**:
  - *Validation*: Required.
  - *Placeholder*: `e.g. See our packages`
- **Linked Subcategory (Dynamic Select Dropdown)**:
  - *Validation*: Required.
  - *Behavior*: Fetches subcategories from the Category API and displays them as grouped by parent category or theme (e.g., `"PHOTOGRAPHY > Wedding"`, `"VIDEOGRAPHY > Music Clip"`).
- **Display Order (Input Number)**:
  - *Validation*: Optional, default is `0`.
  - *Placeholder*: `e.g. 1`

---

## 🔌 API Integration Specification

All mutation endpoints (`POST`, `PUT`/`PATCH`, `DELETE`) require the request header:
`Authorization: Bearer <ADMIN_JWT_TOKEN>`

### 1. Fetching Subcategories (For Form Dropdown)
Fetches subcategories to populate the "Linked Subcategory" select field.

- **Endpoint**: `GET /api/v1/category`
- **Query Parameters**:
  - `type`: `subcategory`
  - `isActive`: `true`
  - `limit`: `100` (to fetch all available subcategories)
- **Response Structure**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "_id": "69f662050f2f322ec6ede0fa",
      "name": "Wedding",
      "theme": "PHOTOGRAPHY",
      "parent": "69f660ac0f2f322ec6eddff3",
      "type": "subcategory"
    }
  ]
}
```

### 2. Fetching All Project Ideas (For Table)
Retrieves the list of project ideas with pagination, search, and ordering.

- **Endpoint**: `GET /api/v1/project-ideas`
- **Query Parameters**:
  - `searchTerm`: `<string>` (Optional, matches title or linkText)
  - `page`: `<number>` (Optional, default: 1)
  - `limit`: `<number>` (Optional, default: 10)
  - `sortBy`: `order` (Optional, default: 'order')
  - `sortOrder`: `asc` | `desc` (Optional, default: 'asc')
- **Response Structure**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    },
    "data": [
      {
        "_id": "6a3c25858a8cfeb870a2c511",
        "title": "Are 🏠 you planning a wedding? 💍",
        "linkText": "See our wedding packages",
        "subCategoryId": {
          "_id": "69f662050f2f322ec6ede0fa",
          "name": "Wedding",
          "theme": "PHOTOGRAPHY"
        },
        "order": 1,
        "createdAt": "2026-06-24T18:44:21.023Z"
      }
    ]
  }
}
```

### 3. Create Project Idea
Adds a new idea card.

- **Endpoint**: `POST /api/v1/project-ideas`
- **Payload**:
```json
{
  "title": "Need a professional headshot for LinkedIn? 💼",
  "linkText": "Explore business portrait services",
  "subCategoryId": "69f6605b0f2f322ec6eddfb7",
  "order": 3
}
```
- **Response**: `201 Created` on success.

### 4. Update Project Idea
Modifies an existing idea card.

- **Endpoint**: `PUT /api/v1/project-ideas/:id` (or `PATCH /api/v1/project-ideas/:id`)
- **Payload**:
```json
{
  "title": "Updated Title Here 💼",
  "order": 1
}
```
- **Response**: `200 OK` on success.

### 5. Delete Project Idea
Removes an idea card.

- **Endpoint**: `DELETE /api/v1/project-ideas/:id`
- **Response**: `200 OK` on success.

---

## 🛠️ Frontend Implementation Snippets

### React/Next.js: Fetching and Populating the Dropdown
```tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Subcategory {
  _id: string;
  name: string;
  theme: string;
}

export const SubcategorySelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  useEffect(() => {
    axios
      .get('/api/v1/category?type=subcategory&isActive=true&limit=100')
      .then((res) => {
        if (res.data.success) {
          setSubcategories(res.data.data);
        }
      });
  }, []);

  return (
    <select
      className="form-select border rounded-lg p-2 w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select Subcategory</option>
      {subcategories.map((sub) => (
        <option key={sub._id} value={sub._id}>
          {sub.theme} &gt; {sub.name}
        </option>
      ))}
    </select>
  );
};
```
