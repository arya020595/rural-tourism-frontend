import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-date-modal',
  templateUrl: './date-modal.component.html',
})
export class DateModalComponent {
  selectedDate: string = '';

  constructor(private modalCtrl: ModalController) {}

  close() {
    this.modalCtrl.dismiss(null);
  }

  confirm() {
    this.modalCtrl.dismiss(this.selectedDate);
  }
}

