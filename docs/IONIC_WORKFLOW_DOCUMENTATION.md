# Rural Tourism Sabah - Ionic Workflow Documentation

## Overview

This documentation covers the workflow and architecture of the Rural Tourism Sabah mobile application built with Ionic Angular framework.

## Technology Stack

- **Framework**: Ionic 7+ with Angular
- **UI Components**: Ionic Components
- **Routing**: Angular Router
- **State Management**: LocalStorage for user session
- **API Communication**: Angular HttpClient via ApiService
- **Platform**: Cross-platform (iOS, Android, Web)

---

## Application Architecture

### 1. **Tourist Home Page Component Structure**

#### File Structure

```
src/app/tourist/home/
├── home.page.ts          # Component logic
├── home.page.html        # Template
├── home.page.scss        # Styles
├── home.module.ts        # Module configuration
├── home-routing.module.ts # Routing configuration
└── home.page.spec.ts     # Unit tests
```

---

## Workflow Breakdown

### 2. **Component Initialization Flow**

```typescript
ngOnInit() {
  this.loadUser();           // 1. Load user from localStorage
  this.loadActivities();     // 2. Fetch activities from API
  this.loadAllUsers();       // 3. Fetch all users (if needed)
  this.loadAccommodations(); // 4. Fetch accommodations from API
}

ionViewWillEnter() {
  this.loadUser();                    // Refresh user data
  this.menu.enable(true, 'mainMenu'); // Enable side menu
}
```

**Lifecycle Sequence:**

1. `ngOnInit()` - Runs once when component is initialized
2. `ionViewWillEnter()` - Runs every time the page is about to enter view
3. Data loading happens asynchronously via Observable subscriptions

---

### 3. **User Authentication Workflow**

#### Login State Management

```typescript
loadUser() {
  const userData = localStorage.getItem('user');
  if (userData) {
    this.user = JSON.parse(userData);
    if (this.user.tourist_user_id) {
      localStorage.setItem('tourist_user_id', this.user.tourist_user_id);
    }
  } else {
    this.user = null; // Guest mode
  }
}
```

**States:**

- **Guest User**: `user = null` → Shows login prompt in side menu
- **Logged-in User**: `user = {...}` → Shows user profile and menu options

#### Logout Workflow

```typescript
logOut() {
  localStorage.removeItem('user');  // 1. Clear user data
  this.user = null;                 // 2. Reset state
  this.logoutToast();              // 3. Show notification
  this.menu.close('mainMenu');     // 4. Close menu
  this.router.navigate(['/tourist/home']); // 5. Navigate home
}
```

---

### 4. **Data Loading Workflow**

#### Activities API Integration

```typescript
loadActivities() {
  this.apiService.getAllActivityMasterData().subscribe(
    (response: any) => {
      // Handle API response structure: { data: [...] }
      this.activities = response.data || response;
      console.log('Loaded activities:', this.activities);
    },
    (err) => {
      console.error('Failed to load activities', err);
    }
  );
}
```

**API Response Structure:**

```json
{
  "data": [
    {
      "id": 1,
      "activity_name": "Kiulu Water Rafting",
      "description": "...",
      "address": "Kiulu, Kota Kinabalu",
      "things_to_know": "...",
      "image": "assets/kiulu-water-rafting.jpg",
      "created_at": "2025-10-29T08:54:01.000Z",
      "updated_at": "2025-10-29T14:44:29.000Z"
    }
  ]
}
```

#### Accommodations API Integration

```typescript
loadAccommodations() {
  this.apiService.getAllAccommodations().subscribe({
    next: (response: any) => {
      this.accommodations = response.data || response;
    },
    error: (err) => {
      console.error('Failed to load accommodations', err);
    }
  });
}
```

---

### 5. **Segment Navigation System**

#### Segment Types

- **Activity** - Shows available activities
- **Accommodation** - Shows available accommodations
- **Package** - Shows "Coming Soon" message

#### Template Implementation

```html
<ion-segment [(ngModel)]="selectedSegment" scrollable>
  <ion-segment-button value="activity">
    <img src="assets/icon/activity_mountain_icon.png" />
    <ion-label>Activity</ion-label>
  </ion-segment-button>
  <ion-segment-button value="accommodation">
    <img src="assets/icon/accommodation_hotel_icon.png" />
    <ion-label>Accommodation</ion-label>
  </ion-segment-button>
  <ion-segment-button value="package">
    <img src="assets/icon/fullpackage_package_icon.png" />
    <ion-label>Package</ion-label>
  </ion-segment-button>
</ion-segment>
```

#### Conditional Content Rendering

```html
<!-- Show only when selectedSegment === 'activity' -->
<div class="section" *ngIf="selectedSegment === 'activity'">
  <!-- Activities content -->
</div>

<!-- Show only when selectedSegment === 'accommodation' -->
<div class="section" *ngIf="selectedSegment === 'accommodation'">
  <!-- Accommodations content -->
</div>

<!-- Show only when selectedSegment === 'package' -->
<div class="section-coming-soon" *ngIf="selectedSegment === 'package'">
  <!-- Coming soon message -->
</div>
```

---

### 6. **Image Handling Strategy**

#### Multi-format Image Support

```typescript
getImageSource(imagePath: string): string {
  if (!imagePath) {
    return 'assets/icon/placeholder.png'; // Fallback
  }

  // Assets path (local)
  if (imagePath.startsWith('assets/')) {
    return imagePath;
  }

  // External URL
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Backend upload (filename only)
  return `http://localhost:3000/uploads/activities/${imagePath}`;
}
```

**Supported Formats:**

1. **Local Assets**: `assets/kiulu-water-rafting.jpg`
2. **External URLs**: `https://example.com/image.jpg`
3. **Backend Uploads**: `activity-123.jpg` → `http://localhost:3000/uploads/activities/activity-123.jpg`

#### Accommodation Images

```typescript
getAccommodationImage(imageData: string): string {
  if (!imageData) {
    return 'assets/icon/placeholder.png';
  }

  if (imageData.startsWith('http') || imageData.startsWith('data:image')) {
    return imageData;
  }

  return `http://localhost:3000/uploads/accommodations/${imageData}`;
}
```

---

### 7. **Navigation Workflow**

#### Navigation Methods

```typescript
// Navigate to operator list for specific activity
goToOperatorList(id: string) {
  this.router.navigate(['/tourist/activity-operator-list', id]);
}

// Navigate to accommodation details
goToAccommodationDetails(accomId: string) {
  this.router.navigate(['/tourist/accommodation-detail', accomId]);
}
```

#### Navigation Flow Diagram

```
Home Page
    ├─> Activity Card Click → activity-operator-list/:id
    ├─> Accommodation Card Click → accommodation-detail/:accomId
    ├─> Login Button → /role
    ├─> Register Link → /tourist/register
    ├─> Booking History → /booking-home
    └─> Messages → /messages
```

---

### 8. **Side Menu Workflow**

#### Menu Structure

**Guest User View:**

```html
<div *ngIf="!user">
  <h2>Profile</h2>
  <p>Want to make a booking for your next trip?</p>
  <p>You need to log in or register your account first</p>
  <ion-button [routerLink]="['/role']">Log In Account</ion-button>
  <p>Don't have an account? <a [routerLink]="['/tourist/register']">Register Here</a></p>
</div>
```

**Logged-in User View:**

```html
<ng-template #loggedInTemplate>
  <ion-avatar>
    <img src="https://ionicframework.com/docs/img/demos/avatar.svg" />
  </ion-avatar>
  <h3>{{ user?.name || user?.username }}</h3>
  <p>{{ user?.email || user?.user_email }}</p>

  <ion-item [routerLink]="['/booking-home']">Booking History</ion-item>
  <ion-item [routerLink]="['/messages']">Messages</ion-item>
  <ion-item (click)="logOut()">Log-Out</ion-item>
</ng-template>
```

#### Menu Control

```typescript
// Close menu programmatically
closeMenu() {
  this.menu.close('mainMenu');
}

// Enable/disable menu
ionViewWillEnter() {
  this.menu.enable(true, 'mainMenu');
}
```

---

### 9. **Suggested Activities Feature**

#### Computed Property

```typescript
get suggestedActivities() {
  return this.activities.filter(activity => {
    return [true, 1, '1'].includes(activity.show_in_suggestions) ||
           [true, 1, '1'].includes(activity.showInSuggestions);
  });
}
```

**Usage in Template:**

```html
<div class="section" *ngIf="suggestedActivities.length > 0">
  <ion-text class="section-title">
    <h2>Suggestions <ion-icon name="star-outline"></ion-icon></h2>
  </ion-text>
  <div class="horizontal-scroll">
    <ion-card *ngFor="let suggestion of suggestedActivities">
      <!-- Card content -->
    </ion-card>
  </div>
</div>
```

---

### 10. **Toast Notifications**

#### Implementation

```typescript
async logoutToast() {
  const toast = await this.toastController.create({
    message: 'User Logged Out',
    duration: 1500,
    position: 'bottom',
    cssClass: 'error-toast',
    icon: 'alert-circle'
  });
  await toast.present();
}
```

---

### 11. **Horizontal Scrolling Cards**

#### SCSS Implementation

```scss
.horizontal-scroll {
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 20px;
  gap: 1px;
  scrollbar-width: none; /* Hide scrollbar */
}

.option-card {
  width: 200px;
  height: 180px;
  min-width: 200px;
  min-height: 180px;
  transition: transform 0.3s ease;
  position: relative;
}

.option-card:hover {
  transform: scale(1.05);
  z-index: 10;
}
```

#### Template Usage

```html
<div class="horizontal-scroll">
  <ion-card class="option-card" *ngFor="let activity of activities" (click)="goToOperatorList(activity.id)">
    <img [src]="getImageSource(activity.image)" alt="{{ activity.activity_name }}" />
    <div class="card-title-overlay">{{ activity.activity_name }}</div>
  </ion-card>
</div>
```

---

## Best Practices

### 1. **Error Handling**

- Always implement error callbacks in Observable subscriptions
- Provide fallback images for missing data
- Log errors to console for debugging

### 2. **Performance Optimization**

- Use `*ngIf` to conditionally render large sections
- Implement lazy loading for images
- Use trackBy in `*ngFor` loops for better performance

### 3. **User Experience**

- Show loading indicators during API calls
- Provide feedback via toast notifications
- Handle empty states gracefully

### 4. **Security**

- Validate user data from localStorage
- Use try-catch blocks when parsing JSON
- Sanitize user inputs

---

## API Service Integration

### Expected Methods in ApiService

```typescript
// Activities
getAllActivityMasterData(): Observable<any>

// Accommodations
getAllAccommodations(): Observable<any>

// Users
getAllUser(): Observable<any[]>
```

### API Endpoint Examples

```
GET /api/activities/master-data  → { data: [...] }
GET /api/accommodations          → { data: [...] }
GET /api/users                   → [...]
```

---

## Environment Configuration

### Development

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000",
};
```

### Production

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: "https://api.ruraltourism-sabah.com",
};
```

---

## Testing Workflow

### Unit Test Structure

```typescript
describe("HomePage", () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  // Add more tests here
});
```

---

## Common Issues & Solutions

### Issue 1: Images Not Loading

**Solution**: Check image path format and ensure backend server is running

### Issue 2: User Data Not Persisting

**Solution**: Verify localStorage is enabled and data is properly stringified

### Issue 3: Menu Not Opening

**Solution**: Ensure menu is enabled with `menu.enable(true, 'mainMenu')`

### Issue 4: API Response Empty

**Solution**: Check API response structure and handle both `response.data` and direct arrays

---

## Future Enhancements

1. **Offline Mode**: Implement Ionic Storage for offline data caching
2. **Push Notifications**: Integrate Firebase Cloud Messaging
3. **Image Optimization**: Implement lazy loading and image compression
4. **Search Functionality**: Add search/filter capabilities to the searchbar
5. **Analytics**: Integrate Google Analytics or Firebase Analytics
6. **Internationalization**: Add multi-language support using i18n

---

## Deployment

### Build Commands

```bash
# Development build
ionic serve

# Production build for web
ionic build --prod

# Build for Android
ionic capacitor build android

# Build for iOS
ionic capacitor build ios
```

### Testing on Devices

```bash
# Run on Android device
ionic capacitor run android

# Run on iOS device
ionic capacitor run ios
```

---

## Support & Resources

- **Ionic Documentation**: https://ionicframework.com/docs
- **Angular Documentation**: https://angular.io/docs
- **Capacitor Documentation**: https://capacitorjs.com/docs
- **Community**: https://forum.ionicframework.com

---

**Last Updated**: December 30, 2025
**Version**: 1.0.0
