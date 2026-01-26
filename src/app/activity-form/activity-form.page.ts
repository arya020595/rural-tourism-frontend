import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { NgForm } from '@angular/forms';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-activity-form',
  templateUrl: './activity-form.page.html',
  styleUrls: ['./activity-form.page.scss'],
})
export class ActivityFormPage implements OnInit {

  constructor(
    private apiService: ApiService,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    this.loadActivities();
    this.autofillOperator();
    this.loadTouristsFromBookings();
  }

  form = {
    receipt_id: '',
    user_id: localStorage.getItem('uid')!,
    citizenship: '',
    pax: 0,
    pax_domestik: '',
    pax_antarabangsa: '',
    activity_name: '',
    location: '',
    activity_id: '',
    total_rm: '',
    issuer: '',
    operator_user_id: '',
    date: '',
  };

  activities: any[] = [];
  selectedActivity: any = null;

  touristOptions: any[] = [];
  selectedTouristUserId: string = '';

  numbers: number[] = Array.from({ length: 20 }, (_, i) => i + 1);

  // ---------------- Load Activities ----------------
  loadActivities() {
    const uid = localStorage.getItem('uid')!;
    this.apiService.getAllActByUser(uid).subscribe(
      (data) => { this.activities = data; },
      (error) => { console.error('Failed to load activities:', error); }
    );
  }

  // ---------------- Load Tourists ----------------
  loadTouristsFromBookings() {
    const operatorUid = localStorage.getItem('uid')!;
    this.apiService.getOperatorAllBookings(operatorUid).subscribe(
      (res: any) => {
        const bookings: any[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
        const bookedBookings = bookings.filter(b => (b.status || '').trim().toLowerCase() === 'booked');

        this.touristOptions = bookedBookings.map(b => ({
          user_id: b.tourist_user_id,
          name: b.contact_name || 'Unknown',
          activity_name: b.activity_name,
          activity_id: b.activity_id || '',
          location: b.location || '',
          date: b.date || '',
          citizenship: b.citizenship || '',
          total_price: b.total_price || '',
          displayText: `${b.contact_name || 'Unknown'} - ${b.activity_name || 'No Activity'} (${b.date || ''})`
        }));
      },
      (err) => { console.error('Failed to load tourists:', err); }
    );
  }

  // ---------------- Autofill Operator ----------------
autofillOperator() {
  const operatorName = localStorage.getItem('operator_name') || 'Unknown Operator';
  const operatorUid = localStorage.getItem('uid'); // the logged-in user_id

  this.form.issuer = '';
  this.form.operator_user_id = operatorUid as string; // now guaranteed to be non-null
}

  // ---------------- Generate Receipt ----------------
  generateReceiptId(): string {
    const randomPart = Math.floor(Math.random() * 10000000);
    return `PE${randomPart.toString().padStart(7, '0')}`;
  }

  // ---------------- Tourist Change ----------------
onTouristChange(selectedTouristUserId: string) {
  const booking = this.touristOptions.find(t => t.user_id === selectedTouristUserId);
  if (!booking) return;

  this.form.citizenship = booking.citizenship || '';
  this.form.date = booking.date || '';
  this.form.total_rm = booking.total_price ? booking.total_price.toString() : '';

  const matchedActivity = this.activities.find(
    a => a.id === booking.activity_id // ✅ FIX
  );

  this.selectedActivity = matchedActivity || null;

  if (this.selectedActivity) {
    this.form.activity_name = this.selectedActivity.activity_name;
    this.form.activity_id = this.selectedActivity.id; // ✅ FIX
    this.form.location = this.selectedActivity.address || '';
  }
}


  // ---------------- Activity Change ----------------
  onActivityChange(selectedActivity: any) {
    if (!selectedActivity) return;
    this.form.activity_name = selectedActivity.activity_name;
    this.form.activity_id = selectedActivity.activity_id;
    this.form.location = selectedActivity.location;
  }

  // ---------------- Submit Form ----------------
  async submitForm(form: NgForm) {
    try {
      if (!this.selectedTouristUserId) {
        alert('Please select a tourist.');
        return;
      }

      const operatorUid = this.form.operator_user_id || localStorage.getItem('uid')!;
      const paxDomestik = Number(this.form.pax_domestik) || 0;
      const paxAntarabangsa = Number(this.form.pax_antarabangsa) || 0;
      const totalPax = paxDomestik + paxAntarabangsa;
      const totalPrice = Number(this.form.total_rm);

      if (totalPax <= 0) { alert('Please enter at least 1 pax.'); return; }
      if (totalPrice <= 0) { alert('Invalid Total RM.'); return; }

      const payload = {
        receipt_id: this.generateReceiptId(),
        tourist_user_id: this.selectedTouristUserId,
        operator_user_id: operatorUid,
        citizenship: this.form.citizenship,
        pax: totalPax,
        pax_domestik: paxDomestik,
        pax_antarabangsa: paxAntarabangsa,
        activity_id: this.form.activity_id,
        activity_name: this.form.activity_name,
        location: this.form.location || null,
        total_rm: totalPrice.toString(),
        date: this.form.date || null,
        issuer: this.form.issuer || 'Unknown Operator'
      };

      console.log('FINAL PAYLOAD:', payload);

      const response: any = await this.apiService.createForm(payload).toPromise();
      const receiptId = response?.data?.receipt_id || payload.receipt_id;

      this.clearForm(form);
      this.navCtrl.navigateForward('/receipt-activity/' + receiptId);

    } catch (error) {
      console.error('SAVE FAILED:', error);
      alert('Failed to save form.');
    }
  }

  // ---------------- Clear Form ----------------
  clearForm(form: NgForm) {
    form.reset();
    this.selectedActivity = null;
    this.selectedTouristUserId = '';
  }

  // ---------------- Navigation ----------------
  backHome() {
    this.navCtrl.navigateForward('/home', { animated: true, animationDirection: 'back' });
  }

  compareWithFn(o1: any, o2: any) {
  return o1 && o2 ? o1.activity_id === o2.activity_id : o1 === o2;
}


}
