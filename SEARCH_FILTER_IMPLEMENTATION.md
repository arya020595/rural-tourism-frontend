# Search and Date Filter Implementation

## Overview

Implemented comprehensive search and date filtering functionality for the Rural Tourism Sabah home page, allowing users to filter both activities and accommodations.

## Features Implemented

### 1. Search Functionality

- **Real-time search** with 300ms debounce
- Searches across multiple fields:
  - Activity name
  - Description
  - Address
  - Accommodation name

### 2. Date Filter

- Toggle-able date picker UI
- Filters activities and accommodations based on availability
- Checks if selected date falls within `date_from` and `date_to` range
- Displays human-readable date format in UI

### 3. UI Components Added

#### Search Bar

```html
<ion-searchbar [(ngModel)]="searchQuery" (ionChange)="onSearchChange($event)" debounce="300" placeholder="Start Your Search"></ion-searchbar>
```

#### Filter Controls

- **Date Filter Button**: Toggles date picker visibility
- **Clear Button**: Resets all filters (only shows when filters are active)

#### Date Picker

```html
<ion-datetime [(ngModel)]="selectedDate" (ionChange)="onDateChange($event)" presentation="date" [preferWheel]="true"></ion-datetime>
```

#### Results Summary

Shows filtered count vs total count for current segment

#### No Results Message

Displays friendly message when no items match filter criteria

### 4. TypeScript Implementation

#### Properties

```typescript
searchQuery: string = '';              // Search input value
filteredActivities: any[] = [];       // Filtered activities array
filteredAccommodations: any[] = [];   // Filtered accommodations array
selectedDate: string = '';            // Selected date ISO string
showDateFilter: boolean = false;      // Date picker visibility
```

#### Key Methods

**`onSearchChange(event: any)`**

- Triggers filter application on search input change
- Debounced at 300ms for performance

**`onDateChange(event: any)`**

- Handles date selection
- Triggers filter application

**`toggleDateFilter()`**

- Shows/hides date picker UI

**`clearFilters()`**

- Resets search query and selected date
- Re-applies filters to show all items

**`applyFilters()`**

- Main filtering logic
- Combines search and date filters
- Filters both activities and accommodations

**`isActivityAvailableOnDate(activity: any, date: Date): boolean`**

- Checks if activity is available on selected date
- Compares against date_from and date_to range

**`isAccommodationAvailableOnDate(accom: any, date: Date): boolean`**

- Checks if accommodation is available on selected date
- Compares against date_from and date_to range

### 5. Styling

#### Filter Controls

```scss
.filter-controls {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  align-items: center;
}
```

#### Date Filter

```scss
.date-filter {
  padding: 0 16px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin: 0 16px;
}
```

#### No Results

```scss
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 16px;
  text-align: center;
}
```

## User Flow

1. **Initial Load**: All activities/accommodations displayed
2. **Enter Search**: Results filter in real-time as user types
3. **Toggle Date Filter**: Click date button to show/hide picker
4. **Select Date**: Choose date to filter by availability
5. **View Results**: See count summary and filtered items
6. **Clear Filters**: Click clear button to reset

## Technical Details

### Search Logic

```typescript
const query = this.searchQuery.toLowerCase();
this.filteredActivities = this.activities.filter((activity) => activity.activity_name?.toLowerCase().includes(query) || activity.description?.toLowerCase().includes(query) || activity.address?.toLowerCase().includes(query));
```

### Date Filter Logic

```typescript
if (this.selectedDate) {
  const filterDate = new Date(this.selectedDate);
  this.filteredActivities = this.filteredActivities.filter((activity) => this.isActivityAvailableOnDate(activity, filterDate));
}
```

### Date Availability Check

```typescript
isActivityAvailableOnDate(activity: any, date: Date): boolean {
  if (!activity.date_from || !activity.date_to) return true;

  const dateFrom = new Date(activity.date_from);
  const dateTo = new Date(activity.date_to);

  return date >= dateFrom && date <= dateTo;
}
```

## Files Modified

### Frontend Files

1. **home.page.ts** - Added filter logic and methods
2. **home.page.html** - Added UI components for search/filter
3. **home.page.scss** - Added styling for new components
4. **home.module.ts** - FormsModule already imported

## Testing Recommendations

### Manual Testing

1. ✅ Test search with various keywords
2. ✅ Test date filter with different dates
3. ✅ Test combined search + date filter
4. ✅ Test clear filters functionality
5. ✅ Test with empty results
6. ✅ Switch between segments (activities/accommodations)
7. ✅ Verify results count accuracy

### Edge Cases

- Empty search query
- Date outside available ranges
- No results found
- Special characters in search
- Very long search queries

## Performance Considerations

1. **Debounce**: 300ms debounce on search prevents excessive filtering
2. **Client-side filtering**: Fast response, no server calls
3. **Efficient filtering**: Uses array.filter() with early returns

## Future Enhancements

1. **Advanced Filters**: Price range, rating, category
2. **Sort Options**: By name, price, rating, date
3. **Save Filters**: Remember user preferences
4. **Filter Presets**: Popular destinations, upcoming events
5. **Server-side Search**: For large datasets, use backend Ransack API
6. **Search History**: Show recent searches
7. **Auto-complete**: Suggest search terms

## Integration with Backend

The current implementation uses **client-side filtering**. For larger datasets, consider integrating with the backend Ransack search API:

```typescript
// Example backend integration
async searchActivities(query: string, date: string) {
  const params = {
    'q[activity_name_cont]': query,
    'q[date_from_lteq]': date,
    'q[date_to_gteq]': date,
    page: 1,
    per_page: 20
  };

  return this.apiService.get('/activity-master-data', { params });
}
```

## Conclusion

The search and filter implementation provides users with powerful tools to find relevant activities and accommodations quickly. The implementation is performant, user-friendly, and follows Ionic/Angular best practices.
