# Repost Implementation Documentation

## Overview

The repost feature allows users to share/show support for issues created by other users. When a user reposts an issue, it:
- Shows community support/awareness for the issue
- Increases the issue's priority score
- Helps surface important issues in the system

Reposting is similar to "sharing" or "upvoting" functionality in social platforms.

## Database Schema

### Repost Model

```prisma
model Repost {
  id        String   @id @default(uuid())
  issueId   String
  issue     Issue    @relation(fields: [issueId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([issueId, userId]) // Prevent duplicate reposts
  @@index([issueId])
  @@index([userId])
}
```

### Key Constraints

1. **Unique Constraint**: `@@unique([issueId, userId])` ensures a user can only repost an issue once
2. **Cascade Deletion**: If an issue or user is deleted, their reposts are automatically deleted
3. **Indexes**: Both `issueId` and `userId` are indexed for fast queries

## API Endpoints

### 1. Repost an Issue

**Endpoint:** `POST /api/v1/user/issues/:issueId/repost`

**Authentication:** Required (User JWT token)

**Description:** Allows a user to repost/share an issue created by another user.

**Path Parameters:**
- `issueId` (string, UUID): The ID of the issue to repost

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:** None required

**Success Response (201):**
```json
{
  "message": "Issue reposted successfully",
  "repost": {
    "id": "repost-uuid",
    "issueId": "issue-uuid",
    "userId": "user-uuid",
    "issue": {
      "id": "issue-uuid",
      "title": "Pothole on Main Street"
    },
    "user": {
      "id": "user-uuid",
      "number": "+1234567890"
    },
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "repostCount": 42
}
```

**Error Responses:**

| Status Code | Description |
|------------|-------------|
| 400 | Issue not found, already reposted, or trying to repost own issue |
| 401 | Unauthorized - Missing or invalid JWT token |
| 404 | Issue not found |
| 500 | Server error |

**Business Rules:**
1. ✅ User cannot repost their own issues
2. ✅ User can only repost an issue once (unique constraint)
3. ✅ Issue must exist
4. ✅ User must be authenticated

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/v1/user/issues/123e4567-e89b-12d3-a456-426614174000/repost \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### 2. Remove Repost (Unrepost)

**Endpoint:** `DELETE /api/v1/user/issues/:issueId/repost`

**Authentication:** Required (User JWT token)

**Description:** Allows a user to remove their repost from an issue.

**Path Parameters:**
- `issueId` (string, UUID): The ID of the issue to unrepost

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "message": "Repost removed successfully",
  "repostCount": 41
}
```

**Error Responses:**

| Status Code | Description |
|------------|-------------|
| 401 | Unauthorized - Missing or invalid JWT token |
| 404 | Repost not found (user hasn't reposted this issue) |
| 500 | Server error |

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/v1/user/issues/123e4567-e89b-12d3-a456-426614174000/repost \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Check Repost Status

**Endpoint:** `GET /api/v1/user/issues/:issueId/repost`

**Authentication:** Required (User JWT token)

**Description:** Check if the authenticated user has reposted a specific issue.

**Path Parameters:**
- `issueId` (string, UUID): The ID of the issue to check

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "hasReposted": true,
  "repost": {
    "id": "repost-uuid",
    "issueId": "issue-uuid",
    "userId": "user-uuid",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**If user hasn't reposted:**
```json
{
  "hasReposted": false,
  "repost": null
}
```

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/v1/user/issues/123e4567-e89b-12d3-a456-426614174000/repost \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Priority Impact

### How Reposts Affect Priority

Reposts directly impact an issue's priority score, which determines how urgently it should be addressed.

**Priority Calculation:**
```
Priority = User Rating Points (0-5) + Repost Points (0-5)
Total Priority Range: 0-10
```

**Repost Points Formula:**
```
repostPoints = min((repostCount / maxReposts) * 5, 5)
```

Where `maxReposts` is the maximum repost count across all issues (for normalization).

### Example Scenarios

**Scenario 1: New Issue**
- User Rating: 3
- Reposts: 0
- Priority: 3.0 (total), 1.5 (normalized 0-5 scale)

**Scenario 2: Popular Issue**
- User Rating: 4
- Reposts: 150
- Max Reposts: 100
- Repost Points: 5.0 (capped)
- Priority: 9.0 (total), 4.5 (normalized)

**Scenario 3: Growing Issue**
- User Rating: 5
- Reposts: 50
- Max Reposts: 200
- Repost Points: 1.25
- Priority: 6.25 (total), 3.13 (normalized)

### Priority Update

Priority is automatically recalculated when:
- An issue is retrieved (GET requests)
- An issue's status is updated
- The repost count changes (after repost/unrepost operations)

The updated repost count is included in all issue responses, so the priority shown reflects the current state.

## Usage Examples

### Frontend Implementation (React Native Example)

```javascript
import { useState, useEffect } from 'react';

const IssueCard = ({ issue, token }) => {
  const [hasReposted, setHasReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(issue.repostCount || 0);
  const [loading, setLoading] = useState(false);

  // Check repost status on mount
  useEffect(() => {
    checkRepostStatus();
  }, []);

  const checkRepostStatus = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/user/issues/${issue.id}/repost`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      setHasReposted(data.hasReposted);
    } catch (error) {
      console.error('Error checking repost status:', error);
    }
  };

  const handleRepost = async () => {
    if (hasReposted) {
      // Unrepost
      await unrepostIssue();
    } else {
      // Repost
      await repostIssue();
    }
  };

  const repostIssue = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/user/issues/${issue.id}/repost`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHasReposted(true);
        setRepostCount(data.repostCount);
        // Show success message
      } else {
        const error = await response.json();
        // Handle error (e.g., "You cannot repost your own issue")
        alert(error.message);
      }
    } catch (error) {
      console.error('Error reposting issue:', error);
    } finally {
      setLoading(false);
    }
  };

  const unrepostIssue = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/user/issues/${issue.id}/repost`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHasReposted(false);
        setRepostCount(data.repostCount);
        // Show success message
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      console.error('Error unreposting issue:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.issueCard}>
      <Text>{issue.title}</Text>
      <Text>Priority: {issue.priority?.normalizedPriority?.toFixed(1)}/5</Text>
      
      <TouchableOpacity
        onPress={handleRepost}
        disabled={loading || issue.userId === currentUserId}
        style={[
          styles.repostButton,
          hasReposted && styles.repostButtonActive,
          (loading || issue.userId === currentUserId) && styles.repostButtonDisabled
        ]}
      >
        <Icon name={hasReposted ? "share" : "share-outline"} />
        <Text>{repostCount}</Text>
      </TouchableOpacity>

      {issue.userId === currentUserId && (
        <Text style={styles.hint}>You can't repost your own issues</Text>
      )}
    </View>
  );
};
```

### Flutter Example

```dart
class IssueCard extends StatefulWidget {
  final Issue issue;
  final String token;

  const IssueCard({required this.issue, required this.token});

  @override
  _IssueCardState createState() => _IssueCardState();
}

class _IssueCardState extends State<IssueCard> {
  bool _hasReposted = false;
  int _repostCount = 0;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _repostCount = widget.issue.repostCount ?? 0;
    _checkRepostStatus();
  }

  Future<void> _checkRepostStatus() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/user/issues/${widget.issue.id}/repost'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _hasReposted = data['hasReposted'] ?? false;
        });
      }
    } catch (e) {
      print('Error checking repost status: $e');
    }
  }

  Future<void> _toggleRepost() async {
    if (_hasReposted) {
      await _unrepost();
    } else {
      await _repost();
    }
  }

  Future<void> _repost() async {
    setState(() => _loading = true);

    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/user/issues/${widget.issue.id}/repost'),
        headers: {
          'Authorization': 'Bearer ${widget.token}',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        setState(() {
          _hasReposted = true;
          _repostCount = data['repostCount'] ?? 0;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Issue reposted successfully')),
        );
      } else {
        final error = jsonDecode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error['message'] ?? 'Failed to repost')),
        );
      }
    } catch (e) {
      print('Error reposting: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _unrepost() async {
    setState(() => _loading = true);

    try {
      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/user/issues/${widget.issue.id}/repost'),
        headers: {'Authorization': 'Bearer ${widget.token}'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _hasReposted = false;
          _repostCount = data['repostCount'] ?? 0;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Repost removed')),
        );
      }
    } catch (e) {
      print('Error unreposting: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canRepost = widget.issue.userId != currentUserId;

    return Card(
      child: Column(
        children: [
          Text(widget.issue.title),
          Text('Priority: ${widget.issue.priority?.normalizedPriority?.toStringAsFixed(1)}/5'),
          
          IconButton(
            icon: Icon(_hasReposted ? Icons.share : Icons.share_outlined),
            color: _hasReposted ? Colors.blue : Colors.grey,
            onPressed: canRepost && !_loading ? _toggleRepost : null,
            tooltip: '${_repostCount} reposts',
          ),
          Text('$_repostCount'),
          
          if (!canRepost)
            Text('You can\'t repost your own issues', 
                 style: TextStyle(color: Colors.grey, fontSize: 12)),
        ],
      ),
    );
  }
}
```

## Business Rules & Edge Cases

### 1. Users Cannot Repost Their Own Issues

**Rule:** A user who created an issue cannot repost it.

**Rationale:** Self-reposting would artificially inflate priority scores.

**Implementation:** Checked in `repostIssue` method:
```javascript
if (issue.userId === userId) {
  return res.status(400).json({
    message: "You cannot repost your own issue",
  });
}
```

**Frontend Handling:**
- Hide/disable repost button for issues created by the current user
- Show message: "You can't repost your own issues"

### 2. One Repost Per User Per Issue

**Rule:** Each user can only repost an issue once.

**Enforcement:**
- Database unique constraint: `@@unique([issueId, userId])`
- Application-level check before creating repost
- Returns 400 error if attempted

**Frontend Handling:**
- Use `checkRepost` endpoint to determine button state
- Show active/inactive state based on `hasReposted` flag

### 3. Cascade Deletion

**Behavior:**
- If an issue is deleted, all its reposts are automatically deleted
- If a user is deleted, all their reposts are automatically deleted

**Database:** Handled by Prisma `onDelete: Cascade` constraint

### 4. Repost Count in Issue Responses

**Included Fields:**
- `repostCount`: Number of times the issue has been reposted
- `priority`: Complete priority object including repost contribution

**Usage:**
- Display repost count in UI
- Sort/filter by priority
- Show priority breakdown to explain high/low priority

## Error Handling

### Common Error Scenarios

| Error | Status Code | Message | Handling |
|-------|------------|---------|----------|
| Issue not found | 404 | "Issue not found" | Show error message, log issue |
| Already reposted | 400 | "You have already reposted this issue" | Update UI to show reposted state |
| Own issue | 400 | "You cannot repost your own issue" | Disable repost button permanently |
| Invalid token | 401 | "Invalid token" | Redirect to login |
| Server error | 500 | "Failed to repost issue" | Show retry option |

### Error Handling Best Practices

1. **Check repost status before allowing action** - Use `GET /repost` to check current state
2. **Handle race conditions** - Multiple rapid clicks could cause duplicate requests
3. **Optimistic UI updates** - Update UI immediately, rollback on error
4. **Show loading states** - Prevent multiple simultaneous requests
5. **Provide feedback** - Show success/error messages to user

## Performance Considerations

### Database Queries

1. **Indexed Fields**: Both `issueId` and `userId` are indexed for fast lookups
2. **Unique Constraint**: Prevents duplicate inserts at database level
3. **Count Queries**: Used to get current repost count after operations

### Caching Opportunities

- Cache repost status when loading issue list
- Batch repost status checks for multiple issues
- Consider caching repost counts with short TTL

### Optimization Tips

1. **Batch Status Checks**: When loading multiple issues, batch `checkRepost` calls
2. **Debounce Actions**: Prevent rapid fire repost/unrepost actions
3. **Optimistic Updates**: Update UI immediately, sync with server asynchronously

## Testing

### Test Cases

1. ✅ User can repost another user's issue
2. ✅ User cannot repost their own issue
3. ✅ User can only repost an issue once
4. ✅ User can remove their repost
5. ✅ Repost count increases after repost
6. ✅ Repost count decreases after unrepost
7. ✅ Priority updates with repost count
8. ✅ Deleted issue removes all reposts
9. ✅ Check repost status returns correct value
10. ✅ Unauthenticated requests are rejected

### Example Test (Jest)

```javascript
describe('Repost Controller', () => {
  test('should repost an issue', async () => {
    const response = await request(app)
      .post(`/api/v1/user/issues/${issueId}/repost`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(201);
    expect(response.body.repostCount).toBeGreaterThan(0);
    expect(response.body.repost.userId).toBe(userId);
  });

  test('should prevent reposting own issue', async () => {
    const response = await request(app)
      .post(`/api/v1/user/issues/${ownIssueId}/repost`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('cannot repost your own issue');
  });

  test('should prevent duplicate reposts', async () => {
    // First repost
    await request(app)
      .post(`/api/v1/user/issues/${issueId}/repost`)
      .set('Authorization', `Bearer ${userToken}`);

    // Second repost attempt
    const response = await request(app)
      .post(`/api/v1/user/issues/${issueId}/repost`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('already reposted');
  });
});
```

## Summary

The repost feature provides a simple yet powerful way for users to show support for issues and helps prioritize important community concerns. Key points:

- ✅ **Simple API**: Three endpoints (repost, unrepost, check status)
- ✅ **Automatic Priority**: Reposts automatically increase issue priority
- ✅ **Prevent Abuse**: Users can't repost own issues or repost multiple times
- ✅ **Real-time Updates**: Repost counts updated immediately after operations
- ✅ **Clean Data Model**: Unique constraints and indexes ensure data integrity

The implementation follows RESTful principles and integrates seamlessly with the existing priority calculation system.

