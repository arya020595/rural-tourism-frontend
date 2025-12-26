import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * ImageService - Centralized image URL management
 *
 * Benefits:
 * - Consistent image URL handling across the app
 * - Easy to switch between local and remote images
 * - Fallback handling for missing images
 */
@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private baseUrl = environment.API;
  private defaultActivityImage = 'assets/icon/placeholder.png';
  private defaultAccommodationImage = 'assets/icon/placeholder.png';
  private defaultUserImage = 'assets/icon/user-placeholder.png';

  constructor() {}

  /**
   * Get the full URL for an activity image
   */
  getActivityImageUrl(imageName: string | undefined | null): string {
    if (!imageName) {
      return this.defaultActivityImage;
    }

    // If already a full URL or base64
    if (this.isFullUrl(imageName) || this.isBase64(imageName)) {
      return imageName;
    }

    return `${this.baseUrl}/uploads/activities/${imageName}`;
  }

  /**
   * Get the full URL for an accommodation image
   */
  getAccommodationImageUrl(imageName: string | undefined | null): string {
    if (!imageName) {
      return this.defaultAccommodationImage;
    }

    // If already a full URL or base64
    if (this.isFullUrl(imageName) || this.isBase64(imageName)) {
      return imageName;
    }

    return `${this.baseUrl}/uploads/accommodations/${imageName}`;
  }

  /**
   * Get the full URL for a user profile image
   */
  getUserImageUrl(imageName: string | undefined | null): string {
    if (!imageName) {
      return this.defaultUserImage;
    }

    // If already a full URL or base64
    if (this.isFullUrl(imageName) || this.isBase64(imageName)) {
      return imageName;
    }

    return `${this.baseUrl}/uploads/users/${imageName}`;
  }

  /**
   * Get a generic upload URL
   */
  getUploadUrl(folder: string, fileName: string): string {
    if (!fileName) {
      return this.defaultActivityImage;
    }

    if (this.isFullUrl(fileName) || this.isBase64(fileName)) {
      return fileName;
    }

    return `${this.baseUrl}/uploads/${folder}/${fileName}`;
  }

  /**
   * Check if string is a full URL
   */
  private isFullUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
  }

  /**
   * Check if string is base64 encoded
   */
  private isBase64(str: string): boolean {
    return str.startsWith('data:image');
  }

  /**
   * Handle image load error - returns fallback image
   */
  handleImageError(
    event: Event,
    type: 'activity' | 'accommodation' | 'user' = 'activity'
  ): void {
    const target = event.target as HTMLImageElement;
    switch (type) {
      case 'activity':
        target.src = this.defaultActivityImage;
        break;
      case 'accommodation':
        target.src = this.defaultAccommodationImage;
        break;
      case 'user':
        target.src = this.defaultUserImage;
        break;
    }
  }
}
