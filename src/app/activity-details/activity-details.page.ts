import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';  // <-- Import Router

@Component({
  selector: 'app-activity-details',
  templateUrl: './activity-details.page.html',
  styleUrls: ['./activity-details.page.scss'],
})
export class ActivityDetailsPage implements OnInit {

  form = {
    operator: '',
    phone: '',
    destinasi: '',
    aktiviti: '',
    jumlahPelancong: null,
    nationality: '',
    catatan: ''
  };

  pelancong = [
    { nama: '', ic: '', phone: '' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    // Auto-fill destinasi & aktiviti from Page 1 query params
    this.route.queryParams.subscribe(params => {
      this.form.destinasi = params['destinasi'] || '';
      this.form.aktiviti = params['aktiviti'] || '';
    });
  }

  addPelancong() {
    this.pelancong.push({ nama: '', ic: '', phone: '' });
  }

  hantar() {
    console.log('Maklumat Tempahan:', this.form);
    console.log('Senarai Pelancong:', this.pelancong);
    alert('Maklumat tempahan telah dihantar (mock)');

    // Navigate to home page after submission
    this.router.navigate(['/home']);
  }
}
