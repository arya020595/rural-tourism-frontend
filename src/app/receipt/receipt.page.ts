import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import html2canvas from 'html2canvas'; // Import html2canvas
import { environment } from '../../environments/environment';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-receipt',
  templateUrl: './receipt.page.html',
  styleUrls: ['./receipt.page.scss'],
})
export class ReceiptPage implements OnInit {
  @ViewChild('receiptContent') receiptContent!: ElementRef; // Reference to the content to capture
  receiptId: any;
  receipt: any;
  pdfUrl: string = '';

  testAPI = environment.API;
  localAPI = 'http://localhost:3000';
  uid: any; // Store the user ID
  user: any; // Object to hold user data

  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.uid = localStorage.getItem('uid'); // Retrieve user ID from local storage

    this.activatedRoute.params.subscribe((params) => {
      this.receiptId = params['receipt_id'];

      console.log('Received ID:', this.receiptId);
      if (this.receiptId) {
        this.loadForm();
      } else {
        console.log('receipt id not found');

        // this.errorMessage = 'Receipt ID not found.';
        // this.isLoading = false;  // Hide loading spinner
      }
    });

    // this.loadForm();
    this.loadUser();
  }

  loadUser() {
    if (this.uid) {
      this.apiService.getUserByID(this.uid).subscribe(
        (data) => {
          this.user = data;
          // console.log(data);
        },
        (error) => {
          console.log(error);
        },
      );
    } else {
      console.log('uid not found in storage');
    }
  }

  // ngAfterViewInit(): void {
  //   // Now, you can safely use this.receiptContent
  //   // console.log(this.receiptContent);  // To make sure it's assigned
  //   // this.generateReceipt();
  //   if (this.receipt) {
  //     this.generateReceipt();  // Generate the PDF after form is loaded
  //   }
  // }

  //get receipt details
  loadForm() {
    if (this.receiptId) {
      this.apiService.getFormByID(this.receiptId).subscribe(
        (response) => {
          // Unwrap the response to get the actual data
          this.receipt = response.data || response;
          console.log('Receipt data:', this.receipt);
          console.log('Operator data:', this.receipt.operator);
          //generate pdf here

          // setTimeout(() => {
          // this.generateReceipt();  // Delay calling generateReceipt
          // }, 2000);
          // this.generateReceipt();
        },
        (error) => {
          console.log(error);
        },
      );
    } else {
      console.log('uid not found in storage');
    }
  }

  pdfLink: string = '';
  qrCodeReady: boolean = false;

  generateQR() {
    if (this.pdfUrl) {
      this.qrCodeReady = true;
      this.cdr.detectChanges();
      this.pdfLink = this.testAPI + this.pdfUrl;
      // this.pdfLink = this.localAPI+this.pdfUrl
      console.log('Generating QR code with URL:', this.pdfLink);
    } else {
      alert('Error Generating PDF');
      console.log('No URL for QR code generation');
    }
  }

  // popup(){
  //   Swal.fire({
  //     position: "top-end",
  //     icon: "success",
  //     title: "Your work has been saved",
  //     showConfirmButton: false,
  //     timer: 1500
  //   });
  // }

  getImageDataUrl(image: HTMLImageElement): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);
      return canvas.toDataURL('image/png');
    }
    return '';
  }
  // Method to generate the receipt PDF
  generateReceipt() {
    const receiptElement = this.receiptContent.nativeElement; // Get the receipt content element

    // Use html2canvas to capture a screenshot of the element
    html2canvas(receiptElement, {
      ignoreElements: (element) => {
        // Ignore any element with the 'qr-btn' class
        return element.classList.contains('qr-btn');
      },
    })
      .then((canvas) => {
        canvas.toBlob((blob) => {
          if (blob) {
            // Prepare FormData to send the image file to the backend
            const formData = new FormData();
            formData.append('receiptImage', blob, 'receipt.png'); // Append Blob as file
            formData.append('receiptId', this.receiptId); // append receipt id as req

            // Send the formData to the backend API to generate the PDF
            this.apiService.generatePdfFromImage(formData).subscribe(
              (response: any) => {
                if (response.success) {
                  this.pdfUrl = response.fileUrl; // Save the returned PDF URL
                  this.generateQR(); // generate the QR Code
                  console.log('PDF URL:', this.pdfUrl);
                  // give the pdf url here
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
        }, 'image/png'); // Convert the canvas to a Blob in PNG format
      })
      .catch((error) => {
        alert('Error Generating PDF');
        console.error('Error capturing receipt:', error);
      });
  }

  // Method to capture screenshot and send it to the backend to generate PDF
  //  generateReceipt() {
  //   const receiptElement = this.receiptContent.nativeElement;  // Get the receipt content element

  //   html2canvas(receiptElement).then((canvas) => {
  //     const imageData = canvas.toDataURL('image/png');  // Base64 image

  //     // Compress the image before sending it to the backend
  //     new Compressor(canvas, {
  //       quality: 0.6,  // Compression quality (0 to 1)
  //       success(result) {
  //         const compressedImageData = result.toDataURL('image/png');

  //     // Send the base64 image to the backend to generate the PDF
  //     this.apiServices.generatePdfFromImage(compressedImageData).subscribe(
  //       (response: PdfResponse) => {
  //         if (response.success) {
  //           this.pdfUrl = response.fileUrl;  // Save the returned PDF URL
  //           console.log('PDF URL:', this.pdfUrl);
  //         } else {
  //           console.error('Failed to generate PDF');
  //         }
  //       },
  //       (error) => {
  //         console.error('Error generating PDF', error);
  //       }
  //     );
  //   });
  // }

  //by file transfer
  // generateReceipt() {
  //   const receiptElement = this.receiptContent.nativeElement;  // Get the receipt content element

  //   // Use html2canvas to capture a screenshot of the element
  //   html2canvas(receiptElement).then((canvas) => {
  //     // Convert canvas to Blob (image file)
  //     canvas.toBlob((blob: Blob | null) => {
  //       if (blob) {  // Check if the blob is not null
  //         // Create FormData object to send the image file
  //         const formData = new FormData();
  //         formData.append('receiptImage', blob, 'receipt.png');  // Append the image to FormData

  //         // Send the image as file upload to the backend
  //         this.apiService.uploadPdf(formData).subscribe(
  //           (response: PdfResponse) => {
  //             if (response.success) {
  //               this.pdfUrl = response.fileUrl;  // Save the returned PDF URL
  //               console.log('PDF URL:', this.pdfUrl);
  //             } else {
  //               console.error('Failed to generate PDF');
  //             }
  //           },
  //           (error) => {
  //             console.error('Error generating PDF', error);
  //           }
  //         );
  //       } else {
  //         console.error('Failed to convert canvas to Blob');
  //       }
  //     }, 'image/png');
  //   });
  // }

  //generate pdf
  // GeneratePDF()
  // apiService.generatePDF(this.receipt)

  //gemeratePDF by html
  // apiService.generatePDF
}
