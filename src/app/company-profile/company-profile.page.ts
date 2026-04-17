import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { MenuItem, MenuService } from '../services/menu.service';
import {
  Notification,
  NotificationService,
} from '../services/notification.service';
import { environment } from '../../environments/environment';
import { ImageCroppedEvent } from 'ngx-image-cropper';

type DocumentField =
  | 'motac_license_file'
  | 'trading_operation_license'
  | 'homestay_certificate';

interface AssociationItem {
  id: number;
  name: string;
  image: string;
}

interface CompanyProfileFormData {
  business_name: string;
  association_id: string;
  owner_full_name: string;
  contact_no: string;
  business_address: string;
  location: string;
  no_of_full_time_staff: string | number;
  no_of_part_time_staff: string | number;
  poscode: string;
  company_logo: string;
  motac_license_file: string;
  trading_operation_license: string;
  homestay_certificate: string;
}

@Component({
  selector: 'app-company-profile',
  templateUrl: './company-profile.page.html',
  styleUrls: ['./company-profile.page.scss'],
})
export class CompanyProfilePage implements OnInit, OnDestroy {
  uid: string | null = null;
  user: any = null;
  menuItems: MenuItem[] = [];
  unreadCount = 0;
  notifications: Notification[] = [];

  isLoading = true;
  isEditing = false;
  isSaving = false;

  private readonly maxFileSizeBytes = 1 * 1024 * 1024;
  private readonly maxTotalUploadSizeBytes = 10 * 1024 * 1024;

  associations: AssociationItem[] = [];
  readonly locationOptions: string[] = [
    'Kiulu',
    'Ranau',
    'Kota Marudu',
    'Kota Belud',
  ];

  readonly documentFields: DocumentField[] = [
    'motac_license_file',
    'trading_operation_license',
    'homestay_certificate',
  ];

  selectedFiles: Partial<Record<DocumentField, File>> = {};
  selectedFileNames: Partial<Record<DocumentField, string>> = {};
  selectedLogoFile: File | null = null;
  selectedLogoFileName = '';
  isLogoCropperOpen = false;
  logoCropFile: File | undefined;
  logoCropSourceFileName = '';
  logoCropResultBase64 = '';
  logoCropOutputFormat: 'png' | 'jpeg' = 'png';
  private logoPreviewObjectUrl: string | null = null;
  private generatedObjectUrls: string[] = [];

  formData: CompanyProfileFormData = this.createEmptyFormData();
  private initialFormData: CompanyProfileFormData = this.createEmptyFormData();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private menuCtrl: MenuController,
    private menuService: MenuService,
    private notificationService: NotificationService,
    private router: Router,
    private toastController: ToastController,
  ) {}

  ngOnInit(): void {
    this.loadAssociations();
    this.loadUserData();
    this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });
  }

  ngOnDestroy(): void {
    this.closeLogoCropper();
    this.clearSelectedLogo();
    this.generatedObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.generatedObjectUrls = [];
  }

  ionViewWillEnter(): void {
    this.menuCtrl.enable(true, 'company-profile-menu');
    this.loadUserData();
  }

  get companyLogoSrc(): string {
    if (this.logoPreviewObjectUrl) {
      return this.logoPreviewObjectUrl;
    }

    return this.resolveSource(this.formData.company_logo, 'image/png');
  }

  get selectedAssociationName(): string {
    const selectedId = this.formData.association_id;
    if (!selectedId) {
      return '';
    }

    const found = this.associations.find(
      (association) => String(association.id) === String(selectedId),
    );

    return found?.name || selectedId;
  }

  get locationDropdownOptions(): string[] {
    const currentLocation = this.formData.location?.trim();
    if (!currentLocation) {
      return this.locationOptions;
    }

    if (this.locationOptions.includes(currentLocation)) {
      return this.locationOptions;
    }

    return [currentLocation, ...this.locationOptions];
  }

  private createEmptyFormData(): CompanyProfileFormData {
    return {
      business_name: '',
      association_id: '',
      owner_full_name: '',
      contact_no: '',
      business_address: '',
      location: '',
      no_of_full_time_staff: '',
      no_of_part_time_staff: '',
      poscode: '',
      company_logo: '',
      motac_license_file: '',
      trading_operation_license: '',
      homestay_certificate: '',
    };
  }

  private cloneFormData(data: CompanyProfileFormData): CompanyProfileFormData {
    return { ...data };
  }

  private loadUserData(): void {
    this.uid = this.authService.getUserId();
    this.user = this.authService.currentUser;
    this.refreshMenuItems();

    if (!this.uid) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadProfile(this.uid);
    this.loadNotifications();
  }

  private refreshMenuItems(): void {
    this.menuItems = this.menuService.getVisibleMenuItemsForContext('operator');
  }

  private loadAssociations(): void {
    this.apiService.getAssociationList().subscribe({
      next: (res: AssociationItem[]) => {
        this.associations = res || [];
      },
      error: () => {
        this.associations = [];
      },
    });
  }

  private loadProfile(userId: string): void {
    this.isLoading = true;

    this.apiService.getUserByID(userId).subscribe({
      next: (data: any) => {
        this.authService.syncUserProfile(data);
        this.user = this.authService.currentUser || data;

        const mapped = this.mapUserToFormData(data);
        this.formData = mapped;
        this.initialFormData = this.cloneFormData(mapped);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showError('Failed to load profile data.');
      },
    });
  }

  private mapUserToFormData(data: any): CompanyProfileFormData {
    const toString = (value: unknown): string => {
      if (value === null || value === undefined) {
        return '';
      }
      return String(value);
    };

    return {
      business_name: toString(
        data?.business_name ?? data?.company?.company_name,
      ),
      association_id: toString(
        data?.association_id ?? data?.associationId ?? data?.association?.id,
      ),
      owner_full_name: toString(
        data?.owner_full_name ?? data?.full_name ?? data?.name,
      ),
      contact_no: toString(data?.contact_no ?? data?.company?.contact_no),
      business_address: toString(
        data?.business_address ?? data?.company?.address,
      ),
      location: toString(data?.location ?? data?.company?.location),
      no_of_full_time_staff: toString(
        data?.no_of_full_time_staff ?? data?.company?.total_fulltime_staff,
      ),
      no_of_part_time_staff: toString(
        data?.no_of_part_time_staff ?? data?.company?.total_partime_staff,
      ),
      poscode: toString(data?.poscode ?? data?.company?.postcode),
      company_logo: toString(
        data?.company_logo ?? data?.company?.operator_logo_image,
      ),
      motac_license_file: toString(data?.motac_license_file),
      trading_operation_license: toString(data?.trading_operation_license),
      homestay_certificate: toString(data?.homestay_certificate),
    };
  }

  startEdit(): void {
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.formData = this.cloneFormData(this.initialFormData);
    this.selectedFiles = {};
    this.selectedFileNames = {};
    this.closeLogoCropper();
    this.clearSelectedLogo();
    this.isEditing = false;
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      this.showError('Logo only accepts JPG or PNG image files.');
      input.value = '';
      return;
    }

    if (file.size > this.maxFileSizeBytes) {
      this.showError('Logo file must be 1MB or smaller.');
      input.value = '';
      return;
    }

    this.logoCropFile = file;
    this.logoCropSourceFileName = file.name;
    this.logoCropOutputFormat = file.type === 'image/jpeg' ? 'jpeg' : 'png';
    this.logoCropResultBase64 = '';
    this.isLogoCropperOpen = true;
    input.value = '';
  }

  onLogoCropped(event: ImageCroppedEvent): void {
    this.logoCropResultBase64 = event.base64 || '';
  }

  cancelLogoCrop(): void {
    this.closeLogoCropper();
  }

  applyLogoCrop(): void {
    if (!this.logoCropResultBase64) {
      this.showError('Please crop the image before continuing.');
      return;
    }

    const fileName = this.buildCroppedLogoFileName(
      this.logoCropSourceFileName,
      this.logoCropOutputFormat,
    );
    const croppedFile = this.dataUrlToFile(this.logoCropResultBase64, fileName);

    if (!croppedFile) {
      this.showError(
        'Unable to process cropped image. Please try another image.',
      );
      return;
    }

    if (croppedFile.size > this.maxFileSizeBytes) {
      this.showError('Cropped logo file must be 1MB or smaller.');
      return;
    }

    this.selectedLogoFile = croppedFile;
    this.selectedLogoFileName = croppedFile.name;
    this.updateLogoPreview(croppedFile);
    this.closeLogoCropper();
  }

  onLogoCropLoadFailed(): void {
    this.showError('Unable to load the selected image for cropping.');
    this.closeLogoCropper();
  }

  onFileSelected(event: Event, field: DocumentField): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      this.showError('This document only accepts PDF, JPG, or PNG files.');
      input.value = '';
      return;
    }

    if (file.size > this.maxFileSizeBytes) {
      this.showError('Each file must be 1MB or smaller.');
      input.value = '';
      return;
    }

    this.selectedFiles[field] = file;
    this.selectedFileNames[field] = file.name;
  }

  saveProfile(): void {
    if (this.isSaving) {
      return;
    }

    const validationError = this.validateFormData();
    if (validationError) {
      this.showError(validationError);
      return;
    }

    const documentUploadSize = Object.values(this.selectedFiles).reduce(
      (sum, file) => sum + (file?.size || 0),
      0,
    );
    const logoUploadSize = this.selectedLogoFile?.size || 0;
    const totalUploadSize = documentUploadSize + logoUploadSize;

    if (totalUploadSize > this.maxTotalUploadSizeBytes) {
      this.showError(
        'Total upload size is too large. Please keep it under 10MB.',
      );
      return;
    }

    if (!this.uid) {
      this.showError('Unable to update profile. Please login again.');
      return;
    }

    const businessName = this.normalizeString(this.formData.business_name);
    const associationId = this.normalizeString(this.formData.association_id);
    const ownerFullName = this.normalizeString(this.formData.owner_full_name);
    const contactNo = this.normalizeString(this.formData.contact_no);
    const businessAddress = this.normalizeString(
      this.formData.business_address,
    );
    const location = this.normalizeString(this.formData.location);
    const fullTimeStaff = this.normalizeString(
      this.formData.no_of_full_time_staff,
    );
    const partTimeStaff = this.normalizeString(
      this.formData.no_of_part_time_staff,
    );
    const poscode = this.normalizeString(this.formData.poscode);

    const payload = new FormData();
    payload.append('business_name', businessName);
    if (associationId.length > 0) {
      payload.append('associationId', associationId);
    }
    payload.append('owner_full_name', ownerFullName);
    payload.append('contact_no', contactNo);
    payload.append('business_address', businessAddress);
    payload.append('location', location);
    payload.append('no_of_full_time_staff', fullTimeStaff);
    payload.append('no_of_part_time_staff', partTimeStaff);

    if (poscode.length > 0) {
      payload.append('poscode', poscode);
    }

    this.documentFields.forEach((field) => {
      const selectedFile = this.selectedFiles[field];
      if (selectedFile) {
        payload.append(field, selectedFile);
      }
    });

    if (this.selectedLogoFile) {
      payload.append('operator_logo_image', this.selectedLogoFile);
    }

    this.isSaving = true;

    this.apiService.updateUserByID(this.uid, payload).subscribe({
      next: (updated: any) => {
        this.authService.syncUserProfile(updated);
        this.user = this.authService.currentUser || updated;

        const mapped = this.mapUserToFormData(updated);
        this.formData = mapped;
        this.initialFormData = this.cloneFormData(mapped);

        this.selectedFiles = {};
        this.selectedFileNames = {};
        this.clearSelectedLogo();

        this.isEditing = false;
        this.isSaving = false;
        this.showSuccess('Profile updated successfully.');
      },
      error: (error: any) => {
        this.isSaving = false;

        if (error?.status === 403) {
          this.showError(
            'Update blocked by permission policy. Please make sure your account has profile:update access.',
          );
          return;
        }

        if (error?.status === 413) {
          this.showError(
            'Upload too large. Please keep each file under 1MB and total uploads under 10MB.',
          );
          return;
        }

        this.showError(
          error?.error?.message ||
            error?.error?.error ||
            'Failed to update profile.',
        );
      },
    });
  }

  private validateFormData(): string | null {
    const businessName = this.normalizeString(this.formData.business_name);
    const ownerFullName = this.normalizeString(this.formData.owner_full_name);
    const contactNo = this.normalizeString(this.formData.contact_no);
    const businessAddress = this.normalizeString(
      this.formData.business_address,
    );
    const location = this.normalizeString(this.formData.location);
    const fullTimeRaw = this.normalizeString(
      this.formData.no_of_full_time_staff,
    );
    const partTimeRaw = this.normalizeString(
      this.formData.no_of_part_time_staff,
    );

    if (!businessName) {
      return 'Business name is required.';
    }

    if (!ownerFullName) {
      return 'Owner name is required.';
    }

    if (!contactNo) {
      return 'Contact number is required.';
    }

    if (/\D/.test(contactNo)) {
      return 'Contact number only accepts digits.';
    }

    if (!businessAddress) {
      return 'Business address is required.';
    }

    if (!location) {
      return 'Location is required.';
    }

    const fullTime = Number(fullTimeRaw);
    if (!Number.isInteger(fullTime) || fullTime < 0) {
      return 'Full time staff must be a non-negative whole number.';
    }

    const partTime = Number(partTimeRaw);
    if (!Number.isInteger(partTime) || partTime < 0) {
      return 'Part time staff must be a non-negative whole number.';
    }

    return null;
  }

  private normalizeString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  private closeLogoCropper(): void {
    this.isLogoCropperOpen = false;
    this.logoCropFile = undefined;
    this.logoCropSourceFileName = '';
    this.logoCropResultBase64 = '';
    this.logoCropOutputFormat = 'png';
  }

  private buildCroppedLogoFileName(
    originalName: string,
    format: 'png' | 'jpeg',
  ): string {
    const baseName = originalName.replace(/\.[^.]+$/, '') || 'logo';
    const extension = format === 'jpeg' ? 'jpg' : 'png';
    return `${baseName}-cropped.${extension}`;
  }

  private dataUrlToFile(dataUrl: string, fileName: string): File | null {
    const [metadata, payload] = dataUrl.split(',');

    if (!metadata || !payload || !metadata.includes('base64')) {
      return null;
    }

    const mimeMatch = metadata.match(/^data:([^;]+);base64$/i);
    const mimeType = mimeMatch?.[1] || 'image/png';

    try {
      const byteChars = atob(payload);
      const byteNumbers = Array.from(byteChars, (char) => char.charCodeAt(0));
      const byteArray = new Uint8Array(byteNumbers);
      return new File([byteArray], fileName, { type: mimeType });
    } catch {
      return null;
    }
  }

  private updateLogoPreview(file: File): void {
    this.clearLogoPreviewObjectUrl();
    this.logoPreviewObjectUrl = URL.createObjectURL(file);
  }

  private clearSelectedLogo(): void {
    this.selectedLogoFile = null;
    this.selectedLogoFileName = '';
    this.clearLogoPreviewObjectUrl();
  }

  private clearLogoPreviewObjectUrl(): void {
    if (!this.logoPreviewObjectUrl) {
      return;
    }

    URL.revokeObjectURL(this.logoPreviewObjectUrl);
    this.logoPreviewObjectUrl = null;
  }

  displayOrDash(value: unknown): string {
    const normalized = String(value || '').trim();
    return normalized.length ? normalized : '-';
  }

  getDocumentFieldLabel(field: DocumentField): string {
    switch (field) {
      case 'motac_license_file':
        return 'Lesen MOTAC/MOTAC License';
      case 'trading_operation_license':
        return 'Lesen Perdagangan & Operasi/Trading & Operation';
      case 'homestay_certificate':
        return 'Sijil Homestay/Homestay Certificate';
      default:
        return '';
    }
  }

  viewDocument(field: DocumentField): void {
    const rawValue = this.normalizeString(this.formData[field]);
    if (!rawValue) {
      this.showError('No document uploaded yet.');
      return;
    }

    const fallbackMimeType = this.detectMimeTypeFromValue(rawValue);
    let source = this.resolveSource(rawValue, fallbackMimeType);

    if (source.startsWith('data:')) {
      const blobUrl = this.dataUrlToBlobUrl(source);
      if (blobUrl) {
        source = blobUrl;
      }
    } else if (this.isLikelyBase64(rawValue)) {
      const blobUrl = this.base64ToBlobUrl(rawValue, fallbackMimeType);
      if (blobUrl) {
        source = blobUrl;
      }
    }

    if (!source) {
      this.showError('No document uploaded yet.');
      return;
    }

    if (
      !source.startsWith('http://') &&
      !source.startsWith('https://') &&
      !source.startsWith('blob:') &&
      !source.startsWith('data:')
    ) {
      source = this.buildUploadsUrl(source);
    }

    const popup = window.open(source, '_blank');
    if (!popup) {
      this.showError(
        'Unable to open document. Please allow popups and try again.',
      );
    }
  }

  private detectMimeTypeFromValue(value: string): string {
    const normalized = value.toLowerCase().trim();

    if (normalized.startsWith('data:image/')) {
      return normalized.includes('png') ? 'image/png' : 'image/jpeg';
    }

    if (normalized.startsWith('data:application/pdf')) {
      return 'application/pdf';
    }

    if (normalized.endsWith('.png')) {
      return 'image/png';
    }

    if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) {
      return 'image/jpeg';
    }

    return 'application/pdf';
  }

  private buildUploadsUrl(pathOrFileName: string): string {
    const normalized = pathOrFileName.replace(/\\/g, '/').replace(/^\/+/, '');
    const withoutUploadsPrefix = normalized.replace(/^uploads\//i, '');
    const encodedPath = withoutUploadsPrefix
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    return `${environment.API}/uploads/${encodedPath}`;
  }

  private dataUrlToBlobUrl(dataUrl: string): string | null {
    const parts = dataUrl.split(',');
    if (parts.length < 2) {
      return null;
    }

    const metadata = parts[0];
    const payload = parts.slice(1).join(',');
    const mimeMatch = metadata.match(/^data:([^;]+)(;base64)?/i);

    if (!mimeMatch || !metadata.includes(';base64')) {
      return null;
    }

    const mimeType = mimeMatch[1] || 'application/octet-stream';
    return this.base64ToBlobUrl(payload, mimeType);
  }

  private base64ToBlobUrl(base64: string, mimeType: string): string | null {
    try {
      const cleaned = base64.replace(/\s/g, '');
      const byteChars = atob(cleaned);
      const byteNumbers = Array.from(byteChars, (char) => char.charCodeAt(0));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray.buffer as ArrayBuffer], {
        type: mimeType,
      });
      const objectUrl = URL.createObjectURL(blob);
      this.generatedObjectUrls.push(objectUrl);
      return objectUrl;
    } catch {
      return null;
    }
  }

  onContactNoInput(event: Event): void {
    const ionEvent = event as CustomEvent<{ value?: string | null }>;
    const rawValue = (ionEvent.detail?.value || '').toString();
    this.formData.contact_no = rawValue.replace(/\D+/g, '');
  }

  onContactNoKeydown(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Home',
      'End',
    ];

    const isShortcut =
      (event.ctrlKey || event.metaKey) &&
      ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase());

    if (allowedKeys.includes(event.key) || isShortcut) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onContactNoPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';

    if (/\D/.test(pastedText)) {
      event.preventDefault();
      const sanitized = pastedText.replace(/\D+/g, '');
      this.formData.contact_no = `${this.formData.contact_no}${sanitized}`;
    }
  }

  onMenuItemTap(item: MenuItem): void {
    this.closeMenu();

    if (item.action === 'feature-unavailable') {
      this.showError('This feature is not available yet.');
    }
  }

  trackMenuItem(_index: number, item: MenuItem): string {
    return item.id;
  }

  private loadNotifications(): void {
    if (!this.uid) {
      return;
    }

    this.notificationService.getNotifications(this.uid).subscribe({
      next: (notifications: Notification[]) => {
        this.notifications = notifications;
      },
      error: () => {
        // No-op because notification errors should not block this page.
      },
    });
  }

  goToNotifications(): void {
    if (!this.uid) {
      return;
    }

    this.router.navigate(['/notifications']);
    this.notificationService.markAllAsRead(this.uid).subscribe({
      next: () => {
        this.notifications.forEach((notification) => {
          notification.read = true;
        });
      },
      error: () => {
        // No-op for non-blocking notification updates.
      },
    });
  }

  closeMenu(): void {
    this.menuCtrl.close();
  }

  logOut(): void {
    this.authService.logout('/login');
    this.uid = null;
    this.user = null;
    this.menuCtrl.enable(false, 'company-profile-menu');
    this.menuCtrl.close();
  }

  private isLikelyBase64(value: string): boolean {
    return value.length > 100 && /^[A-Za-z0-9+/=\r\n]+$/.test(value);
  }

  private resolveSource(value: string, base64MimeType: string): string {
    const normalized = String(value || '').trim();

    if (!normalized) {
      return '';
    }

    if (
      normalized.startsWith('data:') ||
      normalized.startsWith('http://') ||
      normalized.startsWith('https://')
    ) {
      return normalized;
    }

    if (normalized.startsWith('/uploads/')) {
      return `${environment.API}${normalized}`;
    }

    if (normalized.startsWith('uploads/')) {
      return `${environment.API}/${normalized}`;
    }

    if (this.isLikelyBase64(normalized)) {
      return `data:${base64MimeType};base64,${normalized}`;
    }

    return normalized;
  }

  private async showError(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 1800,
      position: 'middle',
      cssClass: 'error-toast',
      icon: 'alert-circle',
    });
    await toast.present();
  }

  private async showSuccess(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 1600,
      position: 'middle',
      icon: 'checkmark-circle',
      color: 'success',
    });
    await toast.present();
  }
}
