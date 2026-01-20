# Priority System Documentation

## Overview

The priority system automatically calculates the importance of each issue based on two factors:
1. **User Importance Rating**: The rating (0-5) that the user assigns when creating an issue
2. **Repost Count**: The number of times other users have reposted/shared the issue

## Priority Calculation Algorithm

### Formula

```
Priority Score = User Rating Points + Repost Points

Where:
- User Rating Points: Direct value from importanceRating field (0-5)
- Repost Points: Normalized repost count (0-5 scale)
  - Formula: (repostCount / maxReposts) * 5, capped at 5
```

### Priority Object Structure

Every issue response includes a `priority` object with the following structure:

```json
{
  "priority": {
    "totalPriority": 7.5,           // Total score (0-10 scale)
    "normalizedPriority": 3.75,     // Normalized score (0-5 scale) - easier to display
    "userRatingPoints": 4.0,        // Points from user's importance rating
    "repostPoints": 3.5,            // Points from repost count
    "repostCount": 70,              // Actual number of reposts
    "importanceRating": 4           // Original user rating
  }
}
```

## How Priority is Showcased

### 1. In API Responses

Priority is automatically included in all issue endpoints:

- ✅ `POST /api/v1/user/issues` - Creating an issue
- ✅ `GET /api/v1/user/issues` - Listing user's issues
- ✅ `GET /api/v1/user/issues/:id` - Getting a single issue
- ✅ `GET /api/v1/admin/issues` - Admin listing all issues
- ✅ `GET /api/v1/admin/issues/:id` - Admin getting a single issue
- ✅ `PUT /api/v1/admin/issues/:id/status` - Updating issue status

### 2. Priority Sorting

You can sort issues by priority using query parameters:

```http
GET /api/v1/admin/issues?sortBy=priority&order=desc
GET /api/v1/user/issues?sortBy=priority&order=desc
```

The `order` parameter can be:
- `desc` - Highest priority first (default)
- `asc` - Lowest priority first

### 3. Example Response

```json
{
  "message": "Issues retrieved successfully",
  "issues": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Large pothole on Main Street",
      "description": "Causing traffic issues",
      "importanceRating": 5,
      "status": 0,
      "repostCount": 85,
      "priority": {
        "totalPriority": 9.25,
        "normalizedPriority": 4.63,
        "userRatingPoints": 5.0,
        "repostPoints": 4.25,
        "repostCount": 85,
        "importanceRating": 5
      },
      "category": { ... },
      "user": { ... },
      "comments": [ ... ],
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "count": 1
}
```

## Priority Scoring Examples

### Example 1: New Issue
- User Rating: 3
- Reposts: 0
- Max Reposts: 100
- **Priority**: 3.0 (total), 1.5 (normalized)

### Example 2: Popular Issue
- User Rating: 4
- Reposts: 150
- Max Reposts: 100
- **Priority**: 9.0 (total - capped at 5 repost points), 4.5 (normalized)

### Example 3: Highly Rated Issue
- User Rating: 5
- Reposts: 50
- Max Reposts: 200
- **Priority**: 6.25 (total), 3.13 (normalized)

## Frontend Display Recommendations

### Using normalizedPriority (0-5 scale)

```javascript
// Display priority as stars or rating
const displayPriority = (normalizedPriority) => {
  const stars = Math.round(normalizedPriority);
  return '⭐'.repeat(stars);
};

// Display priority badge
const getPriorityBadge = (normalizedPriority) => {
  if (normalizedPriority >= 4) return 'High Priority';
  if (normalizedPriority >= 2.5) return 'Medium Priority';
  return 'Low Priority';
};
```

### Using totalPriority (0-10 scale)

```javascript
// Progress bar
const priorityPercentage = (totalPriority / 10) * 100;

// Color coding
const getPriorityColor = (totalPriority) => {
  if (totalPriority >= 8) return 'red';      // Critical
  if (totalPriority >= 6) return 'orange';   // High
  if (totalPriority >= 4) return 'yellow';   // Medium
  return 'green';                            // Low
};
```

## Normalization

The system normalizes repost counts against the maximum repost count across all issues. This ensures that:
- A new issue with 0 reposts gets 0 repost points
- An issue with the maximum reposts gets 5 repost points
- Issues with moderate reposts get proportional points

The `maxReposts` is calculated dynamically from the database, so it adjusts as issues gain popularity over time.

## Best Practices

1. **Display normalizedPriority** for user-facing UI (0-5 scale is intuitive)
2. **Use totalPriority** for internal sorting and filtering (more granular)
3. **Show breakdown** (userRatingPoints + repostPoints) to explain why priority is high/low
4. **Update priority** when new reposts are added (already handled automatically)
5. **Sort by priority** in admin dashboards to focus on most important issues first

