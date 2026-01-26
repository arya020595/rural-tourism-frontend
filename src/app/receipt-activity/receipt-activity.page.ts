import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService, PdfResponse } from '../services/api.service';
import html2canvas from 'html2canvas';  // Import html2canvas
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-receipt-activity',
  templateUrl: './receipt-activity.page.html',
  styleUrls: ['./receipt-activity.page.scss'],
})
export class ReceiptActivityPage implements OnInit {
  @ViewChild('receiptContent') receiptContent!: ElementRef;   // Reference to the content to capture
  receiptId: any;
  receipt: any; 
  pdfUrl: string = '';

  testAPI= environment.API;
  localAPI = 'http://localhost:3000'
  uid: any; // Store the user ID
  user: any; // Object to hold user data


  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.uid = localStorage.getItem('uid'); // Retrieve user ID from local storage
    this.activatedRoute.params.subscribe(params => {
      this.receiptId = params['receipt_id'];
      
      console.log('Received ID:', this.receiptId);
      if (this.receiptId) {
        this.loadForm();
      } else {
        console.log("receipt id not found");
        
        // this.errorMessage = 'Receipt ID not found.';
        // this.isLoading = false;  // Hide loading spinner
      }

    });

    // this.loadForm();
    this.loadUser();
  }

  loadUser(){
    if(this.uid){
      this.apiService.getUserByID(this.uid).subscribe(
        (data) => {
          this.user = data;
          // console.log(data);
        },
        (error) =>{
          console.log(error);
        }
      )
    }else {
      console.log("uid not found in storage")
    }
  }


  //get receipt details
  loadForm(){
    if(this.receiptId){
     this.apiService.getFormByID(this.receiptId).subscribe(
        (data) => {
          if (data.success && data.data) {
            this.receipt = data.data; // Assign the actual form object
            console.log('Loaded receipt:', this.receipt);
          } else {
            console.error('Form data not found');
          }
        },
        (error) => {
          console.error('Error loading form:', error);
        }
      );
    }else {
      console.log("uid not found in storage")
    }
  }

  pdfLink: string = '';
  qrCodeReady: boolean = false;

  generateQR(){
    if (this.pdfUrl) {
      this.qrCodeReady = true;
      this.cdr.detectChanges();
      this.pdfLink = this.testAPI +this.pdfUrl
      // this.pdfLink = this.localAPI+this.pdfUrl
      console.log('Generating QR code with URL:', this.pdfLink);
      
    } else {
      alert('Error Generating PDF');
      console.log('No URL for QR code generation');
    }
  }

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
  const receiptElement = this.receiptContent.nativeElement;  // Get the receipt content element

  // Use html2canvas to capture a screenshot of the element
  html2canvas(receiptElement,{
    ignoreElements: (element) => {
      // Ignore any element with the 'qr-btn' class
      return element.classList.contains('qr-btn');
    }
  }).then((canvas) => {
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
              this.pdfUrl = response.fileUrl;  // Save the returned PDF URL
              this.generateQR();// generate the QR Code
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
          }
        );
      } else {
        alert('Error Generating PDF');
        console.error('Failed to capture canvas as Blob');
      }
    }, 'image/png');  // Convert the canvas to a Blob in PNG format
  }).catch((error) => {
    alert('Error Generating PDF');
    console.error('Error capturing receipt:', error);
  });
}

}
