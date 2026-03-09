import { Component, OnInit } from '@angular/core';

// Interface to define the shape of each FAQ item
export interface FaqItem {
  value: string;       // Unique key used by the accordion
  question: string;    // The question displayed in the accordion header
  answer: string;      // The answer shown when accordion is expanded
  images?: string[];   // Optional array of image paths to show inside the answer
  link?: { url: string; label: string }; // Optional external link inside the answer
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.page.html',
  styleUrls: ['./faq.page.scss'],
})
export class FAQPage implements OnInit {

  // Current value of the search input field
  searchQuery: string = '';

  // Full list of operator FAQ items
  faqs: FaqItem[] = [
    {
      value: 'question1',
      question: 'Bolehkah beberapa orang mendaftar akaun di bawah nama perniagaan yang sama?',
      answer: 'Ya boleh. Beberapa pengguna boleh mendaftar akaun dibawah nama perniagaan yang sama.',
    },
    {
      value: 'question2',
      question: 'Apa perlu saya buat jika terlupa kata laluan akaun? Bagaimana cara untuk menetapkan semua kata laluan?',
      answer: 'Jika anda terlupa kata laluan, klik butang "Lupa Kata Laluan" di halaman log masuk dan ikut arahan untuk menetapkan semula.',
      images: ['assets/forgot_password1.png', 'assets/forgot_password2.png'],
    },
    {
      value: 'question3',
      question: 'Bolehkah kami masukan data lama ke dalam aplikasi?',
      answer: 'Ya boleh. Anda hanya perlu pilih tarikh yang betul pada ruangan tarikh semasa mengisi borang.',
    },
    {
      value: 'question4',
      question: 'Apa perlu dilakukan jika kami secara tidak sengaja memasukkan data yang sama (duplicate) atau data yang salah?',
      answer: 'Klik ikon menu dan klik butang Transaction History, cari data yang ingin dibatalkan, swipe ke kiri dan klik "Void" untuk membatalkannya.',
      images: ['assets/cancel_transaction1.png', 'assets/cancel_transaction2.png', 'assets/cancel_transaction3.png'],
    },
    {
      value: 'question5',
      question: 'Selepas menggunakan aplikasi ini, adakah kami masih perlu menghantar laporan kepada KTA?',
      answer: 'Tidak perlu. Laporan kepada KTA sudah tidak perlu dihantar kerana sistem kami sudah mempunyai rekod data bisnes untuk dihantar kepada KTA.',
    },
    {
      value: 'question6',
      question: 'Adakah terdapat cara untuk mengetahui bagaimana menggunakan aplikasi web untuk pemula?',
      answer: 'Ya, di sini terdapat pautan video yang menunjukkan cara menggunakan aplikasi web untuk pemula.',
      link: {
        url: 'https://youtu.be/ERY4Ip-5HoE',
        label: 'Manual Aplikasi Mudah Alih Sabah Rural Tourism',
      },
    },
  ];

  // Filtered list shown in the UI — starts as the full list
  filteredFaqs: FaqItem[] = [];

  constructor() {}

  ngOnInit() {
    // Show all FAQs on page load
    this.filteredFaqs = this.faqs;
  }

  // Called every time the user types in the search bar
  onSearch(event: any) {
    const query = event.target.value?.toLowerCase().trim() || '';
    this.searchQuery = query;

    if (!query) {
      // If search is empty, show all FAQs
      this.filteredFaqs = this.faqs;
    } else {
      // Filter FAQs where the question or answer contains the search keyword
      this.filteredFaqs = this.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      );
    }
  }
}
