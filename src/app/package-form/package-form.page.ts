import { ChangeDetectorRef, Component, input, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { NgForm } from '@angular/forms';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-package-form',
  templateUrl: './package-form.page.html',
  styleUrls: ['./package-form.page.scss'],
})
export class PackageFormPage implements OnInit {

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadActivity();
  }

  // This will hold the dynamically added input sets
  inputSets = [
    { id: Date.now(), nameOfBusiness: null, total_rm: null, packageDesc: null }
  ];

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
    package: this.inputSets,
    issuer:'',
    date:''
  };

  // Create an array of numbers from 1 to 20
  numbers: number[] = Array.from({ length: 20 }, (_, i) => i + 1);

  activities: any[] = [];
  businesses: any[] = [];

  selectedActivity: any = null; 

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

  
max: boolean = false;
  // Add a new input set
  addInputSet() {
    if (this.inputSets.length < 5) {
      // console.log(this.max);
      const newInputSet = {
        id: Date.now(),  // Unique ID for each input set (timestamp-based)
        nameOfBusiness: null,
        total_rm: null,
        packageDesc: null
      };
    
      // Manually updating the inputSets array
    // this.inputSets = [...this.inputSets, newInputSet];
    this.inputSets.push(newInputSet);
  
    // console.log('inputSets after adding:', this.inputSets);
    }else{
     
      this.max = true;
      
      
    }

   
  }

  

  // Remove an input set at the specified index
  removeInputSet(index: number) {
    this.max = false;
    this.inputSets.splice(index, 1);
    
  }


  trackByIndex(index: number): number {
    return index;  // Use index to track each item uniquely
  }

  
  //load accomodation options
  loadActivity() {

    this.apiService.getAllUser().subscribe(
      (data)=>{
        this.businesses = data;
        
        
      },
      (error)=>{
        console.log(error);
      }
    )
   
    // const uid = localStorage.getItem('uid') as string;
    // //get all accommodations by user
    // this.apiService.getAllActByUser(uid).subscribe(
    //   (data) => {
    //     this.activities = data;
    //     console.log(data);
    //   },
    //   (error) => {
    //     // alert('Error: ' + error)
    //     console.log(error);
    //   }
    // )

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
  //       this.navCtrl.navigateForward('/receipt-activity/' + this.form.receipt_id);
  //       this.clearForm(form);

  //     },
  //     (error) => {
  //       alert('Error: ' + error)
  //       console.log("Failed:", error)
  //     }
  //   )
  // }

  // async submitForm(form: NgForm) {
  //   try {
  //     // Generate a new unique receipt_id each time the form is submitted
  //     this.form.receipt_id = this.generateReceiptId();
      
  //     // Wait for the backend response using async/await
  //     const response = await this.apiService.createForm(this.form).toPromise();
  //     console.log('Form created successfully:', response);
  
  //     // Ensure receipt_id is generated before navigating
  //     this.form.receipt_id = response.receipt_id || this.form.receipt_id;
      
  //     // Clear the form only after successful backend creation
  //     this.clearForm(form);
  
  //     // Navigate to the receipt page after the data is saved
  //     this.navCtrl.navigateForward('/receipt-activity/' + this.form.receipt_id);
  
  //   } catch (error) {
  //     // Handle error gracefully
  //     alert('Server Connection Error');
  //     console.log("Failed:", error);
  //   }
  // }

  async submitForm(form: NgForm) {
    try {
      // Set loading state to true while the form is being processed
      // this.isLoading = true;

      // Calculate total_pax by adding paxA and paxD
      this.form.pax = (parseInt(this.form.pax_antarabangsa) || 0) + (parseInt(this.form.pax_domestik) || 0);
      
      // Generate a new unique receipt_id for the form
      this.form.receipt_id = this.generateReceiptId();
      
      // Wait for the backend response using async/await
      const response = await this.apiService.createForm(this.form).toPromise();

      // Check if the response contains a receipt_id
      if (response && response.receipt_id) {
        this.form.receipt_id = response.receipt_id;  // Update the form with the response's receipt_id
        // console.log();
        
      } else {
        // If the response is invalid or doesn't contain a receipt_id, show an error
        alert('Error: No receipt ID returned.');
        // this.isLoading = false;  // Hide loading indicator
        return;
      }

      // Clear the form after successful submission
      this.clearForm(form);

      // Hide the loading spinner after the form is successfully created
      // this.isLoading = false;

      // Ensure the backend processing and form clearing is fully done before navigating
      setTimeout(() => {
        // Navigate to the receipt page after everything is done
        this.navCtrl.navigateForward('/receipt-package/' + this.form.receipt_id);
      }, 300);  // Adding a slight delay to ensure everything is fully settled

    } catch (error) {
      // Handle any errors (e.g., network failure)
      // this.isLoading = false;  // Hide loading indicator
      alert('Server Connection Error');
      console.log("Failed:", error);
    }
  }


  //for testing
  trysubmit(form: NgForm){
      // Generate a new unique receipt_id for the form
      this.form.receipt_id = this.generateReceiptId();
      // console.log(this.form.package[0].nameOfBusiness);

      //loop through items
      this.form.package.forEach((item, index) => {
        console.log(item.packageDesc);
        console.log(this.form);
        
      });
      // console.log
      
  }


  
  

  onActivityChange(selectedActivity: any) {
    if (selectedActivity.activity_name) {
      this.inputSets
      // this.form.activity_name = selectedActivity.activity_name;  // Set homest_name
      // this.form.location = selectedActivity.location;  // Set location
      // this.form.activity_id = selectedActivity.activity_id; 
      // console.log(selectedActivity.location)
      // console.log(selectedActivity.homest_id)
    }
    
  }

  //for testing form object 
  // submitForm(form: NgForm){

  //   // Generate a new unique receipt_id each time the form is submitted
  //   this.form.receipt_id = this.generateReceiptId();

  //   console.log(this.form)
  //   // this.clearForm(form);
  //   this.navCtrl.navigateForward('/receipt/'+ this.form.receipt_id);
  // }

  clearForm(form: NgForm) {
    form.reset();
  }

}
