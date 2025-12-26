import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { NgForm } from '@angular/forms';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-acco-form',
  templateUrl: './acco-form.page.html',
  styleUrls: ['./acco-form.page.scss'],
})
export class AccoFormPage implements OnInit {

  //initialize
  form = {
    receipt_id: '',
    user_id: localStorage.getItem('uid'),
    citizenship: '',
    pax: 0,
    pax_domestik: '',
    pax_antarabangsa: '',
    activity_name: '',
    homest_name: '',
    location: '',//get location based on input
    activity_id: '',
    homest_id: '',
    total_rm: '',
    total_night: '',
    issuer:'',
    date:''
  };

  accommodations: any[] = [];

  selectedAccommodation: any = null; 

  
  

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController
  ) { }

    // Create an array of numbers from 1 to 20
    numbers: number[] = Array.from({ length: 20 }, (_, i) => i + 1);

  ngOnInit() {
    //load accomodation options
    this.loadAccom();
   
  }

  backHome(){
    this.navCtrl.navigateForward('/home', {
      animated: true,        // Enable animation
      animationDirection: 'back'  // Can be 'forward' or 'back' for custom direction
    });
  }

  // Function to generate a unique receipt_id with 7 random digits
  //'PE' for Accomodation forms/receipts.
  generateReceiptId(): string {
    const randomPart = Math.floor(Math.random() * 10000000); // Random number between 0 and 9999999 (7 digits)
    const formattedRandomPart = randomPart.toString().padStart(7, '0'); // Ensure it has 7 digits
    return `PE${formattedRandomPart}`; // Concatenate 'RE' with the 7-digit random number
  }

  //load accomodation options
  loadAccom() {
   
   
    // const user_id = localStorage.getItem('uid');
    //get all accommodations
    // this.apiService.getAllAccommodations().subscribe(
    //   (data) => {
    //     this.accommodations = data;
    //     console.log(data);
    //   },
    //   (error) => {
    //     console.log(error);
    //   }
    // )
    const uid = localStorage.getItem('uid') as string;
    //get all accommodations by user
    this.apiService.getAllAccomByUser(uid).subscribe(
      (data) => {
        this.accommodations = data;
        // console.log(data);
      },
      (error) => {
        console.log(error);
      }
    )

  }

  //submit function
  // submitForm(form: NgForm) {

  //   // Generate a new unique receipt_id each time the form is submitted
  //   this.form.receipt_id = this.generateReceiptId();
  //   this.apiService.createForm(this.form).subscribe(
  //     (Response) => {
  //       console.log('Form created successfully:', Response);

  //       // Ensure receipt_id is generated before navigating
  //       this.form.receipt_id = Response.receipt_id || this.form.receipt_id;
  //       // Clear the form only after successful backend creation
  //       this.navCtrl.navigateForward('/receipt/' + this.form.receipt_id);
  //       this.clearForm(form);

  //     },
  //     (error) => {
  //       alert('Server Connection Error')
  //       console.log("Failed:", error)
  //     }
  //   )
  // }

  async submitForm(form: NgForm) {
    try {

      // Calculate total_pax by adding paxA and paxD
      this.form.pax = (parseInt(this.form.pax_antarabangsa) || 0) + (parseInt(this.form.pax_domestik) || 0);

      // Generate a new unique receipt_id each time the form is submitted
      this.form.receipt_id = this.generateReceiptId();
      
      // Wait for the backend response using async/await
      const response = await this.apiService.createForm(this.form).toPromise();
      console.log('Form created successfully:', response);
  
      // Ensure receipt_id is generated before navigating
      this.form.receipt_id = response.receipt_id || this.form.receipt_id;
      
      // Clear the form only after successful backend creation
      this.clearForm(form);
  
      // Navigate to the receipt page after the data is saved
      this.navCtrl.navigateForward('/receipt/' + this.form.receipt_id);
  
    } catch (error) {
      // Handle error gracefully
      alert('Server Connection Error');
      console.log("Failed:", error);
    }
  }
  

  onAccommodationChange(selectedAccommodation: any) {
    if (selectedAccommodation.homest_name) {
      this.form.homest_name = selectedAccommodation.homest_name;  // Set homest_name
      this.form.location = selectedAccommodation.location;  // Set location
      this.form.homest_id = selectedAccommodation.homest_id; 
      // console.log(selectedAccommodation.location)
      // console.log(selectedAccommodation.homest_id)
    }
    
  }

  //for testing form object 
  // submitForm(form: NgForm){

  //   // Generate a new unique receipt_id each time the form is submitted
  //   this.form.receipt_id = this.generateReceiptId();

  //   console.log(this.form)
  //   // this.clearForm(form);
  //   // this.navCtrl.navigateForward('/receipt/'+ this.form.receipt_id);
  // }

  clearForm(form: NgForm) {
    form.reset();
  }
}
