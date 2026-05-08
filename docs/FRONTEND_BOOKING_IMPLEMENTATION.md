# Frontend Booking Implementation - May 2026 (Updated)

## Overview

Comprehensive overhaul of the booking UI system with new edit workflow, form validations, enhanced user experience, real-time data fetching, client-side pagination, and improved receipt capture. The system now supports three booking types (Activity, Accommodation, Package) with consistent form patterns, proper status-based access control, and seamless PDF generation workflow.

---

## Architecture

### Component Hierarchy

```
BookingHome (parent router)
├── BookingListTable (view mode)
│   ├── Edit Button (pending only)
│   └── View Details Link
├── Calendar View (date selection)
│   ├── Month Navigation
│   ├── Status Indicators (paid, pending)
│   └── Booking Details Panel
│
BookingAdd (new workflow)
├── Type Selection (Activity, Accommodation, Package)
├── Form Selection
│   ├── ActivityBookingForm
│   ├── AccommodationBookingForm
│   └── PackageBookingForm
│
BookingEdit (new - edit workflow)
├── Type Display (locked)
├── Form in Edit Mode
│   ├── Data Pre-fill
│   └── Validation on Submit
│
BookingDetail (view-only)
├── Display All Fields
└── No Edit Capability
```

---

## Core Changes

### 1. Pages & Components

#### **booking-home.page.ts** - Major Refactor

**Key Changes**:
- ✅ **Pagination Implementation**: 10 rows per page with `pageSize = 10` constant
- ✅ **Computed Properties**:
  - `pagedBookings`: Slices full booking array for current page
  - `totalBookingPages`: Calculates total pages from booking count
  - `currentPage`: Tracks current page number (resets to 1 on data load)
- ✅ **Page Navigation**: `changeBookingPage(page)` method with boundary checks
- ✅ **Booking Source**: Now fetches real data from API via `BookingService.getBookings()` instead of mock data
- ✅ **Status Normalization**: Maps legacy "booked" status to "pending" for UI consistency
- ✅ **Menu Context**: Updated from `'operator'` to `'operator_admin'` for proper permission display
- ✅ **Data Mapping**: `mapBookingRow()` method transforms API responses to internal model

- Removed mock data generation
- Added real data fetching from backend API
- Dynamic booking list loading via `bookingService.getBookings()`
- Status normalization (backend `booked` → frontend `pending`)

**New Properties**:

```typescript
bookings: BookingDetail[] = [];           // Real data from API
loadingBookings = false;                  // Loading state
user: User = null;                        // Current logged-in user
```

**New Methods**:

- `loadBookings()`: Async data fetch with error handling
- `mapBookingRow()`: Transform API response to UI model
- `normalizeStatus()`: Normalize status strings (`booked` → `pending`)
- `editBooking(id)`: Navigate to edit page (only for pending bookings)

**Data Mapping**:

```typescript
// API → UI Model
{
  "id": "BK001",
  "booking_type": "activity",
  "status": "booked",
  "product_name": "Rafting",
  ...
}
↓
{
  id: "BK001",
  type: "Activity",
  status: "pending",  // Normalized from "booked"
  serviceName: "Rafting",
  ...
}
```

#### **booking-edit.page.ts** - NEW

**Purpose**: Edit pending bookings

**Features**:

- Type display (read-only, cannot change booking type)
- Conditional form rendering based on booking type
- Data pre-population from booking details
- Form submission handling

**Workflow**:

```
Navigate to /booking-home/edit/:id
↓
Load booking data from state or query
↓
Display type selection (disabled)
↓
Show appropriate form (Activity/Accommodation/Package)
↓
Form shows existing data
↓
User edits and submits
↓
Navigate back to list
```

**Key Methods**:

```typescript
syncSelectedType(): Determine form type from booking
handleFormSubmit(): Process form submission
goBack(): Return to booking list
```

#### **booking-home/booking-list-table.component.ts**

**Changes**:

- Added `editBooking` output event
- Edit button disabled if status ≠ 'pending'
- Status display shows normalized values

**Template Changes**:

```html
<button [disabled]="booking.status !== 'pending'" (click)="onEditBooking(booking)">Edit</button>
```

---

### 2. Booking Forms

#### **booking-form-base.scss** - NEW Shared Styles

**Provides**:

- Form grid layouts (one-col, two-col)
- Input field styling
- Radio button custom styling
- View mode (read-only) state styling
- Responsive design breakpoints

**Key Classes**:

- `.booking-form` - Root form container
- `.form-section` - Section wrapper
- `.field-grid` - Grid layouts
- `.radio-card` - Custom radio button
- `.booking-form.view-mode` - Read-only state

#### **activity-booking-form.component.ts** - Enhanced

**New Features**:

- Dynamic activity loading from backend API
- Activity dropdown selection (not free text)
- Date/time picker integration
- Numeric input validation
- Browser autofill prevention

**New Methods**:

```typescript
ngOnInit(); // Load activity options
loadActivityOptions(); // Fetch products where type='activity'
onActivityInput(); // Clear validation error on change
openDatePicker(input); // Trigger native date picker
openTimePicker(input); // Trigger native time picker
onNumericInput(field, value); // Strip non-numeric characters
onNumericKeydown(event); // Prevent non-numeric input
onNumericPaste(field, event); // Sanitize pasted content
normalizeDateForInput(value); // Convert formats to YYYY-MM-DD
normalizeTimeForInput(value); // Convert formats to HH:MM
```

**Key Validations**:

- Activity must exist in product list
- Dates in YYYY-MM-DD format
- Times in 24-hour HH:MM format
- Phone/numeric fields: digits only

#### **accommodation-booking-form.component.ts** - NEW

**Purpose**: Handle accommodation booking forms

**Structure**:

- Check-in/Check-out dates
- Tourist full name, phone, email
- Domestic/International/Mixed nationality
- Pax count or mixed pax
- Number of nights
- Homestay selection
- Total amount
- Operator name

**Features**:

- Mixed/Single nationality layouts
- Field validation
- Date format normalization
- View mode support

#### **package-booking-form.component.ts** - Enhanced

**Major Changes**:

1. **Company Selection**: Now searchable dropdown (not fixed select)
2. **Service Selection**: Cascading dropdown based on company
3. **Service Loading**: Fetch products per company on selection
4. **Numeric Validation**: Input sanitization for prices

**New Methods**:

```typescript
ngOnInit(); // Load companies
loadCompanies(); // Fetch package companies
loadServicesForCompany(companyId); // Fetch products for company
onCompanySearchChange(index, text); // Filter company list
selectCompany(index, company); // Select company, load services
onServiceSearchChange(index, text); // Filter service list
selectService(index, service); // Select service
onNumericInputForItem(idx, field, val); // Validate numeric input per item
```

**Search Dropdown UI**:

- Custom `.search-dropdown-wrapper` component
- `.search-input` for typed search
- `.search-dropdown` for filtered results
- `.dropdown-item` for individual options
- Focus/blur for show/hide

**Styling** (`package-booking-form.component.scss`):

```scss
.search-dropdown-wrapper {
  position: relative;
  width: 100%;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #ccc;
  max-height: 180px;
  overflow-y: auto;
  z-index: 10;
}

.dropdown-item {
  padding: 10px 12px;
  cursor: pointer;
  &:hover {
    background-color: #e8f5e9;
    color: #0b6a3e;
  }
}
```

---

### 3. Models & Types

#### **booking-home.models.ts** - Updated

**Changes**:

- Status enum expanded: `'paid' | 'booked' | 'pending' | 'cancelled' | 'confirmed' | 'completed' | 'rejected'`
- Added `package_companies?: any[]` to BookingDetail
- Type normalization support

---

### 4. Services

#### **booking.service.ts** - Enhanced

**New Methods**:

```typescript
// Unified booking management
getBookingById(bookingId: string)
updateBooking(bookingId: string, data: any)
cancelBooking(bookingId: string)
markBookingAsPaid(bookingId: string)

// Query with parameters
getBookings(params?: {
  page?: number;
  per_page?: number;
  booking_type?: string;
  status?: string;
  user_id?: string | number;
  company_id?: string | number;
  search?: string;
})

// Legacy endpoints (still available)
createActivityBooking(bookingData)
getTouristActivityBookings(touristId)
```

#### **product.service.ts** - Enhanced

**New Methods**:

```typescript
// Fetch products by company (for package form)
getProductsByCompany(
  companyId: string | number,
  params?: { page, per_page, search }
)

// Fetch products shared by location (for activity form)
getProductsByLocation(
  params?: { page, per_page, search }
)
```

**Used By**:

- ActivityBookingForm: `getProductsByLocation()` → activity dropdown
- PackageBookingForm: `getProductsByCompany()` → service dropdown per company

#### **company.service.ts** - NEW Method

**New Method**:

```typescript
getPackageCompanies(): Observable<any>
  // Returns companies filtered by user's association
  // Used by PackageBookingForm to populate company dropdown
```

#### **menu.service.ts** - Updated

**Changes**:

- Added context types: `'operator_admin' | 'operator_staff' | 'superadmin'`
- Updated menu items for each role
- operator_admin has full booking/master-data access
- operator_staff has read-only/transaction access

---

### 5. Pages

#### **booking-home.page.html** - Updated

**Changes**:

- Edit booking event binding: `(editBooking)="editBooking($event)"`
- Status badge colors: paid (green), pending (orange), cancelled (red)
- Calendar status classes added for pending status

#### **booking-home.page.scss** - Enhanced

**New Status Colors**:

```scss
.day-cell.pending {
  background: #ff9600;
  color: #131313;
}

.date-label.pending {
  background-color: #ffe5cc;
  color: #d97706;
  padding: 10px 12px;
  border-radius: 6px;
}

.booking-chip.pending {
  background: #ff9600;
  color: #111111;
}

.status-pill.cancelled {
  background: #f8d7da;
  color: #721c24;
}
```

---

### 6. UI Enhancements

#### **Anti-Autofill Traps**

Added to forms to prevent browser autofill interference:

```html
<!-- Hidden fields to absorb browser autofill -->
<input type="text" name="given-name" style="position: absolute; left: -9999px" />
<input type="tel" name="tel-national" style="position: absolute; left: -9999px" />
<input type="email" name="email" style="position: absolute; left: -9999px" />
```

#### **Native Picker Integration**

Date and time inputs now trigger native pickers:

```typescript
openDatePicker(input: HTMLInputElement): void {
  const withPicker = input as HTMLInputElement & { showPicker?: () => void };
  if (typeof withPicker.showPicker === 'function') {
    withPicker.showPicker();
  }
  input.focus();
  input.click();
}
```

#### **Numeric Input Sanitization**

All numeric fields validated:

```typescript
onNumericInput(field: string, value: string): void {
  const digits = String(value || '').replace(/\D+/g, '');
  (this as any)[field] = digits;
}

onNumericKeydown(event: KeyboardEvent): void {
  if (!/^\d$/.test(event.key)) {
    event.preventDefault();
  }
}

onNumericPaste(field: string, event: ClipboardEvent): void {
  const pastedText = event.clipboardData?.getData('text') || '';
  if (/\D/.test(pastedText)) {
    event.preventDefault();
    const sanitized = pastedText.replace(/\D+/g, '');
    (this as any)[field] = `${(this as any)[field] || ''}${sanitized}`;
  }
}
```

---

### 7. Other Pages Updated

#### **company-profile.page.ts**

- Menu context: `'operator'` → `'operator_admin'`

#### **e-receipt.page.ts**

- Menu context: `'operator'` → `'operator_admin'`

#### **home.page.ts**

- Menu context: `'operator'` → `'operator_admin'`

#### **master-data.page.ts**

- Menu context: `'operator'` → `'operator_admin'`

#### **users.page.ts**

- Menu context: `'operator'` → `'operator_admin'`

#### **my-transaction.page.ts**

- Menu context: `'operator'` → `'operator_admin'`

#### **confirm-booking-details.page.ts** (Tourist)

- Changed from AlertController to template-driven ion-alert
- Success alert now uses `isSuccessAlertOpen` property
- Matches registration popup pattern

#### **register.page.ts**

- Fixed: Association list response parsing: `res.data` instead of raw `res`
- Fixed: Staff count validation allows empty/zero values

#### **operator-bookings.page.ts**

- Status handling: `'pending'` and `'booked'` both map to warning color

---

### 8. Form Naming Convention

All form inputs follow pattern for autofill prevention:

**Activity Form**:

- `actF01`, `actF02`, `actF03` for tourist info

**Package Form**:

- `pkgF01`, `pkgF02`, `pkgF03`, `pkgF04`, `pkgF05` for basic info
- `pkgS01-S06` for service/company selections

**Accommodation Form**:

- Standard labels (being created fresh)

**Package Form (old)**:

- `total_rm` → `pkgTotal_{{index}}`
- `package_desc` → `pkgDesc_{{index}}`
- `issuer` → `pkgF02`

---

## Data Flow

### Booking Creation

```
User navigates to /booking-add
↓
Selects booking type (Activity/Accommodation/Package)
↓
Form displays with auto-loaded options:
  - Activities: Product list from productService.getProductsByLocation()
  - Packages: Companies from companyService.getPackageCompanies()
  - Services per company: productService.getProductsByCompany()
↓
User fills form with validation
↓
Submit event emitted from form
↓
bookingService.createUnifiedBooking(payload)
↓
Backend creates booking, returns ID
↓
Navigate to /booking-home
```

### Booking Editing

```
User clicks Edit on pending booking
↓
Navigate to /booking-home/edit/:id with state
↓
booking-edit.page loads booking from route state
↓
Type selection disabled (read-only)
↓
Form component loads with mode='edit'
↓
applyBooking() pre-fills all fields
↓
loadServices/loadCompanies for dropdowns
↓
User edits fields
↓
Submit event with updated data
↓
bookingService.updateBooking(id, payload)
↓
Backend updates, returns updated booking
↓
Navigate back to /booking-home
```

### Booking List Loading

```
bookingService.getBookings({ user_id, page, per_page })
↓
Backend returns paginated list
↓
mapBookingRow() transforms each record
  - Normalizes status: "booked" → "pending"
  - Extracts service name from product/package
  - Handles all three booking types
↓
Calendar rebuilt with new data
↓
Display table with edit/view buttons
```

---

## Validation Rules

### Global

- Phone: 15 chars max, digits only
- Email: Valid email format
- Dates: YYYY-MM-DD format
- Times: HH:MM 24-hour format
- Numbers: Positive integers only

### Activity

- Date: Required
- Activity: Must exist in product list
- Tourist name: Required
- Pax count: Required
- Total amount: Required

### Accommodation

- Check-in date: Required
- Check-out date: Required (must be ≥ check-in)
- Homestay: Required
- Nights: Required
- Pax count: Required

### Package

- Company: Must exist, must be in user's association
- Service: Must belong to selected company
- Price: Required, must be numeric
- Date: Required
- Pax count: Required

---

## Status Access Control

### Edit Permission

```
Status      | Can Edit | Can View
---------   | -------- | ---------
pending     | ✅ Yes   | ✅ Yes
booked      | ❌ No    | ✅ Yes
confirmed   | ❌ No    | ✅ Yes
paid        | ❌ No    | ✅ Yes
cancelled   | ❌ No    | ✅ Yes
completed   | ❌ No    | ✅ Yes
rejected    | ❌ No    | ✅ Yes
```

### UI Implementation

```html
<!-- Edit button disabled for non-pending -->
<button class="icon-btn edit" [disabled]="booking.status !== 'pending'" (click)="onEditBooking(booking)" aria-label="Edit booking">
  <ion-icon name="create"></ion-icon>
</button>
```

---

## Responsive Design

### Breakpoints

```scss
@media (max-width: 992px) {
  // Tablet sizes
  .field-grid.two-col {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .radio-grid.three-col {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  // Mobile sizes
  .field-grid.two-col,
  .radio-grid.three-col,
  .action-row {
    grid-template-columns: 1fr;
  }

  .bottom-action.cancel {
    order: 2;
  }

  .bottom-action.submit {
    order: 1;
  }
}
```

---

## Performance Optimizations

### API Caching

Product lists cached by company to avoid repeated fetches:

```typescript
serviceOptionsByCompanyId: Record<number, Array<{ id: number; name: string }>> = {};

loadServicesForCompany(companyId: number) {
  if (this.serviceOptionsByCompanyId[companyId]) {
    return; // Already loaded
  }
  // Fetch and cache
}
```

### Batch Serialization

Companies serialized in batch:

```typescript
getPackageCompanies(): Observable<any> {
  return this.http.get(`${this.apiUrl}/companies/package-options`);
  // Returns: [{ id, company_name }, ...]
  // Frontend maps to: [{ id, name }, ...]
}
```

---

## Testing Scenarios

✅ **Activity Booking**:

- Domestic pax only
- International pax only
- Mixed domestic/international
- Multiple dates

✅ **Accommodation Booking**:

- Various check-in/check-out periods
- Mixed nationality
- Single nationality

✅ **Package Booking**:

- Single company package
- Multi-company package
- Service selection per company
- Price aggregation

✅ **Editing**:

- Edit pending booking
- Cannot edit non-pending
- Preserve booking type
- Update and re-fetch

✅ **Validation**:

- Activity must exist
- Company must exist
- Service must belong to company
- Dates format validation
- Numeric field validation

---

## Accessibility Features

- ARIA labels on buttons: `aria-label="Edit booking"`
- Semantic HTML: `<button type="submit">`
- Icon color contrast: ✅ WCAG AA
- Form labels associated with inputs
- Error messages displayed inline
- Hidden elements for autofill traps

---

## Browser Compatibility

- ✅ Date picker: HTML5 `<input type="date">`
- ✅ Time picker: HTML5 `<input type="time">`
- ✅ Fallback: Text input with format validation
- ✅ Tested on: iOS Safari, Chrome, Firefox

---

## Booking Pagination Implementation

### Architecture

**Client-Side Pagination** (not API-level) chosen because:
- Calendar view needs full dataset (month calculations)
- Booking count varies by filter/status
- 10 rows per page simple for local slicing
- No additional API calls needed
- Supports unlimited bookings on same page

### Implementation

**booking-home.page.ts**:

```typescript
readonly pageSize = 10;           // Fixed rows per page
currentPage = 1;                  // Current active page

get pagedBookings(): BookingDetail[] {
  const startIndex = (this.currentPage - 1) * this.pageSize;
  return this.bookings.slice(startIndex, startIndex + this.pageSize);
}

get totalBookingPages(): number {
  return Math.max(1, Math.ceil(this.bookings.length / this.pageSize));
}

changeBookingPage(page: number): void {
  this.currentPage = Math.min(Math.max(1, page), this.totalBookingPages);
}

loadBookings(): void {
  // ... fetch bookings
  this.currentPage = 1;  // Reset to page 1 on new load
}
```

**booking-list-table.component.ts**:

```typescript
@Input() bookings: BookingDetail[] = [];
@Input() currentPage = 1;
@Input() pageSize = 10;
@Input() totalBookings = 0;
@Input() totalPages = 1;
@Output() pageChange = new EventEmitter<number>();

get startEntry(): number {
  return (this.totalBookings === 0) ? 0 : (this.currentPage - 1) * this.pageSize + 1;
}

get endEntry(): number {
  return Math.min(this.currentPage * this.pageSize, this.totalBookings);
}

get pageNumbers(): number[] {
  return Array.from({ length: this.totalPages }, (_, i) => i + 1);
}

goToPreviousPage(): void {
  if (this.currentPage > 1) this.pageChange.emit(this.currentPage - 1);
}

goToNextPage(): void {
  if (this.currentPage < this.totalPages) this.pageChange.emit(this.currentPage + 1);
}

goToPage(page: number): void {
  if (page !== this.currentPage) this.pageChange.emit(page);
}
```

**Template (booking-home.page.html)**:

```html
<app-booking-list-table
  [bookings]="pagedBookings"
  [currentPage]="currentPage"
  [pageSize]="pageSize"
  [totalBookings]="bookings.length"
  [totalPages]="totalBookingPages"
  (pageChange)="changeBookingPage($event)">
</app-booking-list-table>
```

**Footer (booking-list-table.component.html)**:

```html
<div class="pagination">
  <button class="page-btn prev" 
    [disabled]="currentPage <= 1" 
    (click)="goToPreviousPage()">Previous</button>
  
  <div class="page-number-group">
    <button *ngFor="let page of pageNumbers" 
      class="page-btn" 
      [class.active]="page === currentPage" 
      (click)="goToPage(page)">{{ page }}</button>
  </div>
  
  <button class="page-btn next" 
    [disabled]="currentPage >= totalPages" 
    (click)="goToNextPage()">Next</button>
</div>
<div class="entry-info">
  Showing {{ startEntry }} to {{ endEntry }} out of {{ totalBookings }} entries
</div>
```

**Styling (booking-list-table.component.scss)**:

```scss
.pagination {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
  
  .page-btn {
    border: 1px solid #ccc;
    background: #fff;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 14px;
    
    &:hover:not(:disabled) {
      background: #f5f5f5;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &.active {
      background: #015c2f;
      color: #fff;
      border-color: #015c2f;
    }
    
    &:first-child {
      border-top-left-radius: 6px;
      border-bottom-left-radius: 6px;
    }
    
    &:last-child {
      border-top-right-radius: 6px;
      border-bottom-right-radius: 6px;
    }
  }
}

.entry-info {
  margin-left: 16px;
  font-size: 12px;
  color: #666;
}
```

---

## Receipt Pages Implementation

### Receipt Capture & PDF Generation

**Pages Implemented**:
- `receipt.page.ts` / `receipt.page.html` - Accommodation receipts
- `receipt-activity.page.ts` / `receipt-activity.page.html` - Activity receipts
- `receipt-package.page.ts` / `receipt-package.page.html` - Package receipts

### Key Features

1. **Booking Integration**: Load receipt data from booking state passed via navigation
2. **Auto-Generation**: PDF automatically generates after component fully loads
3. **Company Profile**: Fetches company name, email, logo for receipt header
4. **Portrait Layout**: Capture clone forced to 520px width for vertical card layout
5. **Two-Column Grid**: Desktop shows 2-column receipt item layout; mobile shows 1 column
6. **QR Code**: Generated from PDF URL for scanning
7. **Error Handling**: Comprehensive logging with fallback UI

### Architecture

**Data Flow**:

```
Navigation to receipt page with booking state
↓
loadReceipt() → Check state.booking first
↓
mapBookingToReceipt() → Transform to receipt format
↓
loadUser() → Get issuer info (async)
↓
loadCompanyProfile() → Get company name/email/logo (async)
↓
tryAutoGenerateReceipt() → Wait for all ready
↓
createCaptureClone() → Clone DOM with isolated CSS
↓
generateReceipt() → Capture image → POST to /api/receipts/generate-pdf-from-image
↓
Backend returns PDF file URL
↓
generateQRCode() → Encode URL to QR
↓
Display receipt with QR and "Scan to View" instructions
```

**receipt.page.ts Key Methods**:

```typescript
async loadReceipt(): Promise<void> {
  // Check state.booking first, fallback to API
  const booking = history.state?.booking;
  if (booking) {
    this.booking = booking;
    this.receipt = this.mapBookingToReceipt(booking);
  } else {
    // Load from API if ID provided
  }
}

mapBookingToReceipt(booking: any): Receipt {
  return {
    bookedByName: booking.tourist_name || booking.user_name,
    accommodationName: booking.accommodation_name,
    checkInDate: booking.check_in_date,
    checkOutDate: booking.check_out_date,
    numberOfNights: booking.no_of_nights,
    numberOfRooms: booking.no_of_rooms,
    numberOfPax: booking.no_of_pax,
    totalAmount: booking.total_amount,
    bookingDate: booking.created_at,
    status: booking.status,
  };
}

async createCaptureClone(): Promise<HTMLElement> {
  const original = this.receiptElement.nativeElement;
  const clone = original.cloneNode(true) as HTMLElement;
  
  // Apply capture-specific CSS
  clone.classList.add('receipt-capture-clone');
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '-9999px';
  clone.style.width = '520px';
  
  document.body.appendChild(clone);
  return clone;
}

async generateReceipt(): Promise<void> {
  const captureElement = await this.createCaptureClone();
  
  // Wait for images
  await this.waitForImages(captureElement);
  
  // Capture to image
  const canvas = await html2canvas(captureElement, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    imageTimeout: 15000,
  });
  
  // Convert to blob
  canvas.toBlob(async (blob) => {
    // POST to backend
    const formData = new FormData();
    formData.append('image', blob, 'receipt.png');
    formData.append('booking_id', this.booking.id);
    
    const response = await this.http.post(
      '/api/receipts/generate-pdf-from-image',
      formData
    ).toPromise();
    
    this.pdfLink = response.fileUrl;
    this.qrCodeReady = true;
  });
  
  // Cleanup
  document.body.removeChild(captureElement);
}

async tryAutoGenerateReceipt(): Promise<void> {
  // Wait for all ready conditions
  if (this.user && this.receipt && this.receiptElement) {
    await this.generateReceipt();
  }
}
```

### Template Structure

**receipt.page.html**:

```html
<ion-content>
  <div class="receipt-card" #receiptElement>
    <!-- Header -->
    <div class="receipt-header">
      <div class="header-left">
        <img [src]="companyLogoUrl" class="company-logo" />
      </div>
      <div class="header-right">
        <div class="company-name">{{ companyName }}</div>
        <div class="issue-date">{{ receipt.bookingDate | date: 'dd MMM yyyy' }}</div>
      </div>
    </div>

    <!-- Details Grid (2-column on desktop, 1-column on mobile) -->
    <div class="details-grid">
      <div class="receipt-row receipt-row--booked">
        <div class="row-label">Booked By</div>
        <div class="row-value">{{ bookedByName }}</div>
      </div>
      <div class="receipt-row receipt-row--accommodation">
        <div class="row-label">Accommodation</div>
        <div class="row-value">{{ receipt.accommodationName }}</div>
      </div>
      <!-- ... more rows ... -->
    </div>

    <!-- Footer (left: issued-by, right: total) -->
    <div class="receipt-footer">
      <div class="issued-block">
        <div class="issued-label">Issued By</div>
        <div class="company-email">{{ companyEmail }}</div>
      </div>
      <div class="total-block">
        <div class="total-label">Total</div>
        <div class="total-amount">RM {{ receipt.totalAmount }}</div>
      </div>
    </div>
  </div>

  <!-- QR Section -->
  <div class="receipt-qr-section" *ngIf="qrCodeReady && pdfLink">
    <div class="qr-code-container">
      <qrcode [qrdata]="pdfLink" [size]="200" [level]="'M'" [scale]="2"></qrcode>
    </div>
    <div class="scan-instruction">
      Scan QR code to view PDF receipt
    </div>
  </div>
</ion-content>
```

### Responsive Styling

**receipt.page.scss**:

```scss
/* Mobile (default) */
.receipt-card {
  padding: 22px 20px 18px;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

.receipt-footer {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 24px;
}

.total-block {
  background: #e9e9e9;
  border: 1px solid #d4d4d4;
  padding: 10px 14px;
}

/* Desktop (920px+) */
@media (min-width: 921px) {
  .details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 46px;
    row-gap: 22px;
  }

  .receipt-row--booked { grid-column: 1; grid-row: 1; }
  .receipt-row--accommodation { grid-column: 2; grid-row: 1; }
  .receipt-row--checkin { grid-column: 1; grid-row: 2; }
  .receipt-row--checkout { grid-column: 2; grid-row: 2; }
  /* ... etc for all rows ... */

  .receipt-footer {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 20px;
  }

  .total-block {
    background: transparent;
    border: 0;
  }
}

/* PDF Capture Override */
.receipt-capture-clone {
  width: 520px !important;
  max-width: 520px !important;
  
  .details-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    column-gap: 20px !important;
    row-gap: 16px !important;
  }

  .receipt-row--booked { grid-column: 1 !important; grid-row: 1 !important; }
  .receipt-row--accommodation { grid-column: 2 !important; grid-row: 1 !important; }
  /* ... ensure grid placement in all sizes ... */

  .receipt-footer {
    grid-template-columns: 1fr auto !important;
  }

  .total-block {
    background: transparent !important;
    border: 0 !important;
  }
}
```

---

## Deployment Checklist

- [x] API base URL configured in environment
- [x] Verify bookingService endpoints
- [x] Test productService.getProductsByCompany()
- [x] Test productService.getProductsByLocation()
- [x] Verify companyService.getPackageCompanies()
- [x] Test edit workflow with pending bookings
- [x] Validate form submission and data mapping
- [x] Check calendar data loading
- [x] Verify status normalization
- [x] Test responsive design on mobile
- [x] ✅ **Pagination: 10 rows per page with direct page number jumps**
- [x] ✅ **Receipt PDF auto-generation with capture clone**
- [x] ✅ **QR code generation from PDF URL**
- [x] ✅ **Company profile loading for receipt header**
- [x] ✅ **Receipt responsive layout (2-column desktop, 1-column mobile)**

---

## Related Documentation

- Form Base Styles: [booking-form-base.scss](../src/app/booking-forms/booking-form-base.scss)
- Backend API: [BACKEND_BOOKING_IMPLEMENTATION.md](../../rural-tourism-backend/docs/BACKEND_BOOKING_IMPLEMENTATION.md)
- API Test Results: [BOOKING_API_TEST_REPORT.md](../../rural-tourism-backend/docs/BOOKING_API_TEST_REPORT.md)

---

## Version

**Last Updated**: May 8, 2026 (Final Update)  
**Version**: 1.1 (Pagination + Receipt PDF Implementation)  
**Status**: Production Ready ✅

---

## What's New in This Update (May 8)

✅ **Pagination Implementation**:
- Client-side 10-row per page pagination
- Previous/Next buttons with disabled states
- Direct page number buttons (1, 2, 3, ...)
- "Showing X to Y out of Z entries" counter
- Supports unlimited bookings

✅ **Receipt PDF Generation**:
- Auto-generation after component loads
- Capture clone with 520px portrait sizing
- Two-column grid layout (desktop) / single column (mobile)
- Company profile loading for receipt header
- QR code generation from PDF URL
- Responsive styling with media queries

✅ **Booking Integration**:
- Receipts load from booking state (navigation)
- Fallback to API if state not available
- Company info populated from CompanyService
- User info used for "Issued By" section

✅ **Responsive Design**:
- Receipt layout adapts to screen size
- PDF capture uses portrait styling with !important overrides
- Mobile: single-column details, vertical footer
- Desktop: 2-column details, horizontal footer
