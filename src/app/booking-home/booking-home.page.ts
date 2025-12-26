import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-booking-home',
  templateUrl: './booking-home.page.html',
  styleUrls: ['./booking-home.page.scss'],
})
export class BookingHomePage implements OnInit {

  destinasiList = [
    {
      nama: 'Kampung Tradisi',
      gambar: 'assets/kampung_tradisi.jpg',
      aktiviti: ['Melihat Kraf Tangan', 'Masakan Tempatan', 'Lawatan Kebudayaan']
    },
    {
      nama: 'Hutan Rekreasi',
      gambar: 'assets/hutan_rekreasi.jpg',
      aktiviti: ['Jungle Trekking', 'Pemerhatian Burung', 'Perkhemahan']
    },
    {
      nama: 'Pantai Indah',
      gambar: 'assets/pantai_indah.jpg',
      aktiviti: ['Sukan Air', 'Perahu Nelayan', 'Fotografi Senja']
    }
  ];

  selectedDestinasi: any = null;

  // Checkbox state: { destinasi.nama: { aktiviti: boolean } }
  selectedAktivitiMap: { [key: string]: { [activity: string]: boolean } } = {};

  // Whether at least one activity is selected
  hasSelectedAktiviti = false;

  constructor(private router: Router) {}

  ngOnInit() {}

  toggleAktiviti(destinasi: any) {
    if (this.selectedDestinasi === destinasi) {
      this.selectedDestinasi = null;
    } else {
      this.selectedDestinasi = destinasi;

      // Initialize activity selection map for the destination
      if (!this.selectedAktivitiMap[destinasi.nama]) {
        this.selectedAktivitiMap[destinasi.nama] = {};
        destinasi.aktiviti.forEach((a: string) => {
          this.selectedAktivitiMap[destinasi.nama][a] = false;
        });

      }
    }

    this.updateHasSelectedAktiviti();
  }

  onCheckboxChange() {
    this.updateHasSelectedAktiviti();
  }

  updateHasSelectedAktiviti() {
    const selected = this.selectedAktivitiMap[this.selectedDestinasi?.nama];
    this.hasSelectedAktiviti = !!selected && Object.values(selected).some(v => v);
  }

  seterusnya() {
    const selectedActivities = Object.entries(
      this.selectedAktivitiMap[this.selectedDestinasi.nama]
    )
      .filter(([_, selected]) => selected)
      .map(([activity]) => activity);

    this.router.navigate(['/activity-details'], {
      queryParams: {
        destinasi: this.selectedDestinasi?.nama,
        aktiviti: JSON.stringify(selectedActivities)
      }
    });
  }
}
