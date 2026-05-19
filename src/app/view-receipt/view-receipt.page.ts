import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import html2canvas from 'html2canvas'; // Import html2canvas
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { FormService } from '../services/form.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-view-receipt',
  templateUrl: './view-receipt.page.html',
  styleUrls: ['./view-receipt.page.scss'],
})
export class ViewReceiptPage implements OnInit {
  @ViewChild('receiptContent') receiptContent!: ElementRef;

  receiptId: any;
  receipt: any;
  pdfUrl: string = '';

  testAPI = environment.API;
  uid: any;
  user: any;
  packageDescArray: string[] = [];
  totalRM: number = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private formService: FormService,
    private cdr: ChangeDetectorRef,
    private navCtrl: NavController,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.uid = this.authService.getUserId();

    this.activatedRoute.params.subscribe((params) => {
      this.receiptId = params['receipt_id'];
      console.log('Received ID:', this.receiptId);
      if (this.receiptId) {
        this.loadForm();
      } else {
        console.log('receipt id not found');
      }
    });

    // Check for download query parameter and auto-download if present
    this.activatedRoute.queryParams.subscribe((queryParams) => {
      if (queryParams['download'] === 'true' && queryParams['pdfUrl']) {
        this.pdfUrl = queryParams['pdfUrl'];
        setTimeout(() => this.downloadReceipt(), 500);
      }
    });

    this.loadUser();
  }

  back() {
    const isTourist = this.authService.getCurrentRole() === 'tourist';
    this.navCtrl.navigateBack(
      isTourist ? '/tourist/transaction' : '/transaction',
    );
  }

  loadUser() {
    this.authService.refreshSession().subscribe({
      next: () => {
        this.user = this.authService.currentUser;
        this.uid = this.authService.getUserId();
      },
      error: (error) => console.log(error),
    });
  }

  // Get receipt details
  // In your ngOnInit() or after loadUser() & loadForm() are called
  // Add-ons for tourist name and proper fields

  // Get receipt details
  loadForm() {
    if (!this.receiptId) return;

    this.formService.getFormByID(this.receiptId).subscribe(
      async (response) => {
        const data = response?.data;
        if (!data) {
          console.error('No receipt data found');
          return;
        }

        this.receipt = data;

        // ----------------------------
        // Handle package mapping
        // ----------------------------
        if (data.package) {
          let packageArray: any[] = [];
          if (typeof data.package === 'string') {
            try {
              packageArray = JSON.parse(data.package);
            } catch (error) {
              console.error('Error parsing package string:', error);
              packageArray = [];
            }
          } else if (Array.isArray(data.package)) {
            packageArray = data.package;
          }
          this.packageDescArray = packageArray.map(
            (item) => item.nameOfBusiness || item.packageDesc || 'N/A',
          );
          this.totalRM = packageArray.reduce(
            (sum, item) => sum + Number(item.total_rm || 0),
            0,
          );
        } else {
          this.packageDescArray = [];
          this.totalRM = 0;
        }

        // ----------------------------
        // Ensure numeric fields
        // ----------------------------
        this.receipt.pax =
          this.receipt.pax != null ? Number(this.receipt.pax) : 1;
        this.receipt.total_night =
          this.receipt.total_night != null
            ? Number(this.receipt.total_night)
            : 0;
        this.receipt.total_rm =
          this.receipt.total_rm != null
            ? Number(this.receipt.total_rm)
            : this.totalRM;

        this.receipt.status = this.receipt.status || 'Active';

        // ----------------------------
        // Tourist (booked by) info
        // ----------------------------
        this.receipt.tourist_name =
          this.receipt.tourist?.full_name || this.user?.full_name || 'N/A';

        // ----------------------------
        // Booking / Created Date
        // ----------------------------
        this.receipt.createdAt = this.receipt.created_at
          ? new Date(this.receipt.created_at).toISOString()
          : new Date().toISOString();

        // ----------------------------
        // Optional: activity & homest stay
        // ----------------------------
        this.receipt.activity_name = this.receipt.activity_name || 'N/A';
        this.receipt.homest_name = this.receipt.homest_name || '';

        // ----------------------------
        // NEW: Fetch operator full name
        // ----------------------------
        if (this.receipt.operator_user_id) {
          try {
            const operatorData: any = await this.userService
              .getUserByID(this.receipt.operator_user_id)
              .toPromise();
            this.receipt.issuer =
              operatorData?.full_name || this.receipt.operator_user_id;
          } catch (err) {
            console.error('Error fetching operator info', err);
            this.receipt.issuer = this.receipt.operator_user_id;
          }
        } else {
          this.receipt.issuer = 'N/A';
        }
      },
      (error) => {
        console.error('Error fetching receipt:', error);
      },
    );
  }

  pdfLink: string = '';
  qrCodeReady: boolean = false;

  generateQR() {
    if (this.pdfUrl) {
      this.qrCodeReady = true;
      this.cdr.detectChanges();
      this.pdfLink = this.testAPI + this.pdfUrl;
      console.log('Generating QR code with URL:', this.pdfLink);
    } else {
      alert('Error Generating PDF');
      console.log('No URL for QR code generation');
    }
  }

  generateReceipt() {
    const receiptElement = this.receiptContent.nativeElement;

    html2canvas(receiptElement, {
      ignoreElements: (element) => element.classList.contains('qr-btn'),
    })
      .then((canvas) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const formData = new FormData();
            formData.append('receiptImage', blob, 'receipt.png');
            formData.append('receiptId', this.receiptId);

            this.formService.generatePdfFromImage(formData).subscribe(
              (response: any) => {
                if (response.success) {
                  this.pdfUrl = response.fileUrl;
                  this.generateQR();
                  console.log('PDF URL:', this.pdfUrl);
                } else {
                  alert('Error Generating PDF');
                  console.error('Failed to generate PDF');
                }
              },
              (error) => {
                alert('Error Generating PDF');
                console.error('Error generating PDF', error);
              },
            );
          } else {
            alert('Error Generating PDF');
            console.error('Failed to capture canvas as Blob');
          }
        }, 'image/png');
      })
      .catch((error) => {
        alert('Error Generating PDF');
        console.error('Error capturing receipt:', error);
      });
  }

  // Method to download the receipt PDF
  downloadReceipt(): void {
    if (!this.pdfUrl) {
      console.error('No PDF URL available for download');
      return;
    }

    try {
      const fullPdfUrl = this.pdfUrl.startsWith('http')
        ? this.pdfUrl
        : this.testAPI + this.pdfUrl;

      const link = document.createElement('a');
      link.href = fullPdfUrl;
      link.download = `receipt-${this.receiptId}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Receipt download initiated:', fullPdfUrl);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt');
    }
  }
}
