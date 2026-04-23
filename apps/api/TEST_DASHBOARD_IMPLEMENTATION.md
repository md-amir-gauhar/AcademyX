# Recent Completed Tests - Dashboard Implementation

## Overview

Added dashboard functionality to the existing test-attempt routes to display recent completed tests with complete results and statistics.

## New API Endpoints

### 1. GET `/api/attempts/recent-completed`

**Description**: Get all recent completed test attempts for dashboard display

**Query Parameters**:

- `page` (integer, default: 1)
- `limit` (integer, default: 20, max: 50)
- `testSeriesId` (uuid, optional) - Filter by specific test series
- `isPassed` (boolean, optional) - Filter by pass/fail status

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "attempt-uuid",
      "attemptNumber": 2,
      "userId": "user-uuid",
      "testId": "test-uuid",
      "test": {
        "id": "test-uuid",
        "title": "JEE Main Physics Mock Test 1",
        "slug": "jee-physics-mock-1",
        "totalMarks": 300,
        "duration": 180,
        "passingMarks": 100,
        "testSeries": {
          "id": "series-uuid",
          "title": "JEE Main 2025 Complete Series",
          "exam": "JEE"
        }
      },
      "totalScore": 245.5,
      "percentage": 81.83,
      "rank": 15,
      "percentile": 92.5,
      "isPassed": true,
      "correctCount": 85,
      "wrongCount": 10,
      "skippedCount": 5,
      "timeSpentSeconds": 9840,
      "submittedAt": "2025-12-05T14:30:00Z",
      "startedAt": "2025-12-05T11:46:00Z",
      "isCompleted": true
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "stats": {
    "totalTestsAttempted": 45,
    "totalTestsCompleted": 42,
    "totalTestsPassed": 36,
    "averageScore": 225.5,
    "averagePercentage": 75.2,
    "passRate": 85.71,
    "totalTimeSpentSeconds": 455400,
    "totalTimeSpentHours": 126.5,
    "bestScore": 285,
    "bestPercentage": 95.0,
    "recentTrend": "improving"
  },
  "message": "Recent completed tests retrieved successfully"
}
```

### 2. GET `/api/attempts/stats`

**Description**: Get aggregated test attempt statistics

**Query Parameters**:

- `testSeriesId` (uuid, optional) - Filter stats by test series

**Response**:

```json
{
  "success": true,
  "data": {
    "totalTestsAttempted": 45,
    "totalTestsCompleted": 42,
    "totalTestsPassed": 36,
    "averageScore": 225.5,
    "averagePercentage": 75.2,
    "passRate": 85.71,
    "totalTimeSpentSeconds": 455400,
    "totalTimeSpentHours": 126.5,
    "bestScore": 285,
    "bestPercentage": 95.0,
    "recentTrend": "improving"
  },
  "message": "Statistics retrieved successfully"
}
```

## Service Functions

### `getRecentCompletedTests(userId, filters)`

**Purpose**: Fetch recent completed test attempts with full test details

**Features**:

- Sorted by `submittedAt` DESC (most recent first)
- Includes test details with test series information
- Paginated response
- Filter by test series
- Filter by pass/fail status
- Returns aggregated statistics

**Parameters**:

- `userId` (string, required)
- `filters` (object, optional):
  - `page` (number)
  - `limit` (number)
  - `testSeriesId` (string)
  - `isPassed` (boolean)

### `getTestAttemptStats(userId, testSeriesId?)`

**Purpose**: Calculate aggregated statistics for user's test attempts

**Statistics Calculated**:

- Total attempts, completed, passed
- Average score and percentage
- Pass rate
- Total time spent (seconds and hours)
- Best score and percentage
- Recent trend (improving/stable/declining)

**Trend Calculation**:

- Analyzes last 5 completed tests
- Compares first half vs second half performance
- Improving: Recent tests 10%+ better
- Declining: Earlier tests 10%+ better
- Stable: Within 10% range

## Features

### ✅ Dashboard Display

- **Complete Test History**: All completed tests in one place
- **Test Details**: Full test information including series
- **Performance Metrics**: Score, rank, percentile, time spent
- **Pass/Fail Indicator**: Visual status
- **Sorting**: Most recent first

### ✅ Filtering & Analytics

- **Filter by Series**: View tests from specific test series
- **Filter by Status**: Show only passed or failed tests
- **Pagination**: Efficient handling of large history
- **Statistics**: Overall performance metrics
- **Trend Analysis**: Performance improvement tracking

### ✅ Performance Data

For each test attempt:

- Total score and percentage
- Rank and percentile
- Pass/fail status
- Correct/wrong/skipped counts
- Time spent
- Submission timestamp

### ✅ Statistics

- Total tests attempted/completed/passed
- Average score and percentage
- Pass rate
- Total study time
- Best performances
- Recent performance trend

## Usage Examples

### Get Recent Completed Tests

```bash
# Basic query
curl http://localhost:3000/api/attempts/recent-completed \
  -H "Authorization: Bearer YOUR_TOKEN"

# With pagination
curl "http://localhost:3000/api/attempts/recent-completed?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by test series
curl "http://localhost:3000/api/attempts/recent-completed?testSeriesId=SERIES_UUID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Show only passed tests
curl "http://localhost:3000/api/attempts/recent-completed?isPassed=true" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Combined filters
curl "http://localhost:3000/api/attempts/recent-completed?testSeriesId=SERIES_UUID&isPassed=true&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Statistics

```bash
# Overall stats
curl http://localhost:3000/api/attempts/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Stats for specific test series
curl "http://localhost:3000/api/attempts/stats?testSeriesId=SERIES_UUID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Integration

### Dashboard Component

```javascript
// Fetch recent completed tests
const { data, pagination, stats } = await fetch(
  "/api/attempts/recent-completed?page=1&limit=10",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
).then((r) => r.json());

// Display test cards
data.forEach((attempt) => {
  const { test, totalScore, percentage, isPassed, submittedAt } = attempt;

  renderTestCard({
    title: test.title,
    series: test.testSeries?.title,
    score: `${totalScore}/${test.totalMarks}`,
    percentage: `${percentage}%`,
    status: isPassed ? "Passed" : "Failed",
    rank: attempt.rank,
    date: new Date(submittedAt).toLocaleDateString(),
  });
});

// Display statistics
renderStats({
  totalTests: stats.totalTestsCompleted,
  passRate: `${stats.passRate}%`,
  avgScore: stats.averageScore,
  trend: stats.recentTrend,
});
```

### Statistics Dashboard

```javascript
// Fetch overall statistics
const stats = await fetch("/api/attempts/stats", {
  headers: { Authorization: `Bearer ${token}` },
}).then((r) => r.json());

// Display metrics
displayMetric("Total Tests", stats.data.totalTestsCompleted);
displayMetric("Pass Rate", `${stats.data.passRate}%`);
displayMetric("Avg Score", stats.data.averageScore);
displayMetric("Best Score", stats.data.bestScore);
displayMetric("Study Time", `${stats.data.totalTimeSpentHours}h`);

// Show trend indicator
showTrend(stats.data.recentTrend); // improving/stable/declining
```

## Database Query Optimization

### Indexes Used

- `test_attempts_user_idx` - Fast user lookup
- `test_attempts_user_test_idx` - Composite index for user+test queries

### Relations Used

- `testAttempts.test` - Test details
- `test.testSeries` - Series information

### Performance Considerations

- Pagination prevents large result sets
- Efficient aggregation for statistics
- Sorted by indexed column (submittedAt)

## Files Modified

### Service Layer

- `/src/services/test-series/test-attempt.service.ts`
  - Added `getRecentCompletedTests()` function
  - Added `getTestAttemptStats()` function

### Routes

- `/src/routes/test-series/test-attempt.route.ts`
  - Added `GET /api/attempts/recent-completed` endpoint
  - Added `GET /api/attempts/stats` endpoint
  - Added validation schema `recentTestsQuerySchema`

## Benefits

1. ✅ **Complete History**: All completed tests in one view
2. ✅ **Rich Context**: Full test and series details
3. ✅ **Performance Analytics**: Comprehensive statistics
4. ✅ **Flexible Filtering**: By series, status, pagination
5. ✅ **Trend Analysis**: Performance improvement tracking
6. ✅ **Fast Queries**: Uses existing indexes
7. ✅ **Dashboard Ready**: Perfect for student dashboard UI

## Testing

### Test Scenarios

1. **Get recent completed tests**

   - Verify sorting (most recent first)
   - Check pagination works correctly
   - Validate test and series details included

2. **Filter by test series**

   - Verify only tests from specified series returned
   - Check stats filtered correctly

3. **Filter by pass/fail**

   - Show only passed tests
   - Show only failed tests

4. **Statistics calculation**

   - Verify averages calculated correctly
   - Check pass rate computation
   - Validate trend analysis

5. **Empty state**
   - User with no completed tests
   - Returns empty array with zero stats

## Next Steps

### Optional Enhancements

1. **Date Range Filter**: Add `fromDate`, `toDate` parameters
2. **Subject-wise Stats**: Break down by test sections/subjects
3. **Performance Charts**: Time-series data for graphs
4. **Comparison**: Compare with peer averages
5. **Achievements**: Badges for milestones
6. **Export**: Download test history as PDF/CSV

## Summary

✅ Integrated into existing test-attempt routes
✅ No new service files needed
✅ Two new endpoints for dashboard data
✅ Complete test history with rich details
✅ Comprehensive statistics and analytics
✅ Flexible filtering options
✅ Performance trend analysis
✅ Production-ready with proper validation
✅ Swagger documentation included
