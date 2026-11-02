/**
 * Panduan Pengguna / User Guide content for operators (operator_admin and
 * operator_staff). Every text has a Malay (bm) and English (en) version; the
 * page shows one at a time. `**bold**` is the only markup.
 *
 * Screenshots live in src/assets/user-guide/ and were taken from a demo
 * operator ("Demo Homestay & Adventure") with made-up customers, so no real
 * person's data is shown. Retake them when a screen changes.
 */

export interface GuideText {
  bm: string;
  en: string;
}

export type GuideBlock =
  | { kind: 'p'; text: GuideText }
  | { kind: 'steps'; items: GuideText[] }
  | { kind: 'list'; items: GuideText[] }
  | { kind: 'tip' | 'note' | 'warn'; text: GuideText }
  | { kind: 'img'; src: string; caption: GuideText }
  | { kind: 'table'; head: GuideText[]; rows: GuideText[][] };

export interface GuideSection {
  id: string;
  group: GuideText;
  icon: string;
  title: GuideText;
  blocks: GuideBlock[];
}

const IMG = 'assets/user-guide/';

const START: GuideText = { bm: 'Mula Di Sini', en: 'Start Here' };
const DAILY: GuideText = { bm: 'Kerja Harian', en: 'Daily Work' };
const SETTINGS: GuideText = { bm: 'Tetapan Syarikat', en: 'Company Settings' };
const REFERENCE: GuideText = { bm: 'Rujukan', en: 'Reference' };

export const GUIDE_SECTIONS: GuideSection[] = [
  /* ── Start here ─────────────────────────────────────────────────── */
  {
    id: 'register',
    group: START,
    icon: 'person-add-outline',
    title: { bm: 'Daftar Akaun Baharu', en: 'Register a New Account' },
    blocks: [
      {
        kind: 'p',
        text: {
          bm: `Setiap syarikat pengendali mendaftar **sekali sahaja**. Pemilik yang mendaftar menjadi **Admin Pengendali** dan boleh menambah kakitangan kemudian.`,
          en: `Each operator company registers **once**. The owner who registers becomes the **Operator Admin** and can add staff later.`,
        },
      },
      {
        kind: 'steps',
        items: [
          { bm: `Di halaman Log Masuk, tekan **Daftar Akaun / Register Account**.`, en: `On the login page, tap **Daftar Akaun / Register Account**.` },
          { bm: `Isi **Butiran Akaun**: nama perniagaan, **persatuan anda**, alamat, poskod, lokasi, nama pemilik dan no. telefon.`, en: `Fill in the **Account Details**: business name, **your association**, address, postcode, location, owner name and phone number.` },
          { bm: `Isi bilangan kakitangan sepenuh masa dan sambilan.`, en: `Enter the number of full-time and part-time staff.` },
          { bm: `Muat naik logo, Lesen MOTAC, Lesen Perdagangan & Operasi dan Sijil Penginapan (jika ada).`, en: `Upload your logo, MOTAC License, Trading & Operation License and Homestay Certificate (if you have them).` },
          { bm: `Pilih nama pengguna, emel dan kata laluan (sekurang-kurangnya 8 aksara), tandakan terma dan syarat, kemudian hantar.`, en: `Choose a username, email and password (at least 8 characters), tick the terms and conditions, then submit.` },
        ],
      },
      { kind: 'img', src: IMG + 'register.webp', caption: { bm: 'Borang pendaftaran pengendali', en: 'The operator registration form' } },
      {
        kind: 'note',
        text: {
          bm: `Selepas mendaftar, akaun anda **menunggu kelulusan persatuan**. Anda belum boleh log masuk. Anda akan menerima **emel** apabila persatuan meluluskan pendaftaran anda.`,
          en: `After registering, your account **waits for your association to approve it**. You can't log in yet. You'll get an **email** when your association approves your registration.`,
        },
      },
    ],
  },
  {
    id: 'login',
    group: START,
    icon: 'log-in-outline',
    title: { bm: 'Log Masuk', en: 'Log In' },
    blocks: [
      {
        kind: 'steps',
        items: [
          { bm: `Masukkan **nama pengguna atau emel** anda.`, en: `Enter your **username or email**.` },
          { bm: `Masukkan **kata laluan**. Tekan ikon mata untuk melihat apa yang ditaip.`, en: `Enter your **password**. Tap the eye icon to see what you typed.` },
          { bm: `Tandakan **Ingat saya** jika ini peranti peribadi anda.`, en: `Tick **Remember me** if this is your own device.` },
          { bm: `Tekan **Log Masuk**. Anda akan dibawa ke Dashboard.`, en: `Tap **Log Masuk**. You'll be taken to your Dashboard.` },
        ],
      },
      { kind: 'img', src: IMG + 'login.webp', caption: { bm: 'Halaman Log Masuk, dengan butang Panduan Pengguna dan Video Tutorial di bawah', en: 'The login page, with the User Guide and Video Tutorial buttons at the bottom' } },
      {
        kind: 'list',
        items: [
          { bm: `**Lupa kata laluan?** Tekan **Lupa Kata Laluan?**, masukkan emel anda dan ikut pautan dalam emel untuk menetapkan kata laluan baharu.`, en: `**Forgot your password?** Tap **Lupa Kata Laluan?**, enter your email and follow the link in the email to set a new password.` },
          { bm: `**"Menunggu kelulusan"**: persatuan anda belum meluluskan pendaftaran. Tunggu emel, atau hubungi persatuan anda.`, en: `**"Awaiting approval"**: your association hasn't approved your registration yet. Wait for the email, or contact your association.` },
          { bm: `**"Akaun tidak aktif"**: persatuan telah menolak atau menyahaktifkan syarikat anda. Sebabnya dipaparkan. Hubungi persatuan anda.`, en: `**"Account inactive"**: your association rejected or deactivated your company. The reason is shown. Contact your association.` },
        ],
      },
    ],
  },
  {
    id: 'navigation',
    group: START,
    icon: 'menu-outline',
    title: { bm: 'Menu & Navigasi', en: 'Menu & Navigation' },
    blocks: [
      {
        kind: 'p',
        text: {
          bm: `Tekan ikon **☰** di kiri atas untuk membuka menu. Semua halaman boleh dibuka dari sini.`,
          en: `Tap the **☰** icon at the top left to open the menu. Every page can be opened from here.`,
        },
      },
      { kind: 'img', src: IMG + 'menu.webp', caption: { bm: 'Menu sisi pengendali', en: 'The operator side menu' } },
      {
        kind: 'table',
        head: [{ bm: 'Menu', en: 'Menu' }, { bm: 'Kegunaan', en: 'What it is for' }],
        rows: [
          [{ bm: 'Dashboard Anda', en: 'My Dashboard' }, { bm: 'Ringkasan hasil, resit dan pelancong', en: 'Summary of revenue, receipts and tourists' }],
          [{ bm: 'Sebut Harga', en: 'Quotation' }, { bm: 'Tawaran harga kepada pelanggan sebelum menempah', en: 'Price offers to customers before they book' }],
          [{ bm: 'Tempahan', en: 'Booking' }, { bm: 'Tambah, lihat dan urus tempahan', en: 'Add, view and manage bookings' }],
          [{ bm: 'Transaksi', en: 'My Transaction' }, { bm: 'Senarai bayaran dan laporan penyata', en: 'List of payments and statement reports' }],
          [{ bm: 'E-Resit', en: 'E-Receipt' }, { bm: 'Resit terus untuk pelanggan yang bayar penuh', en: 'Instant receipts for customers who pay in full' }],
          [{ bm: 'Profil Anda', en: 'My Profile' }, { bm: 'Maklumat dan dokumen syarikat', en: 'Company details and documents' }],
          [{ bm: 'Pengurusan Pengguna', en: 'User Management' }, { bm: 'Akaun kakitangan (Admin sahaja)', en: 'Staff accounts (Admin only)' }],
          [{ bm: 'Data Induk', en: 'Master Data' }, { bm: 'Senarai aktiviti dan penginapan anda', en: 'Your list of activities and accommodations' }],
        ],
      },
      {
        kind: 'list',
        items: [
          { bm: `**🔔 Loceng** (kanan atas): notifikasi, contohnya peringatan tempahan.`, en: `**🔔 Bell** (top right): notifications, such as booking reminders.` },
          { bm: `**⟳ Muat semula** (kanan atas): muatkan data terkini.`, en: `**⟳ Refresh** (top right): load the latest data.` },
          { bm: `**Log Keluar** berada di bahagian bawah menu.`, en: `**Log Out** is at the bottom of the menu.` },
        ],
      },
    ],
  },

  /* ── Daily work ─────────────────────────────────────────────────── */
  {
    id: 'dashboard',
    group: DAILY,
    icon: 'grid-outline',
    title: { bm: 'Dashboard', en: 'Dashboard' },
    blocks: [
      {
        kind: 'p',
        text: {
          bm: `Dashboard memaparkan prestasi syarikat anda. Hanya tempahan yang **sudah dibayar** dikira.`,
          en: `The Dashboard shows how your company is doing. Only **paid** bookings are counted.`,
        },
      },
      {
        kind: 'list',
        items: [
          { bm: `**Today**: jumlah hasil (RM), bilangan resit dan bilangan pelancong hari ini.`, en: `**Today**: today's total revenue (RM), number of receipts and number of tourists.` },
          { bm: `**Trend**: angka yang sama mengikut bulan, dengan carta. Pilih julat tarikh untuk melihat tempoh lain.`, en: `**Trend**: the same figures by month, with charts. Choose a date range to see another period.` },
        ],
      },
      { kind: 'img', src: IMG + 'dashboard.webp', caption: { bm: 'Dashboard, tab Today', en: 'The Dashboard, Today tab' } },
    ],
  },
  {
    id: 'quotation',
    group: DAILY,
    icon: 'document-outline',
    title: { bm: 'Sebut Harga', en: 'Quotations' },
    blocks: [
      {
        kind: 'p',
        text: {
          bm: `Sebut harga ialah tawaran harga kepada pelanggan **sebelum** mereka menempah. Ia **tidak** dikira sebagai tempahan atau hasil sehingga ditukar menjadi tempahan atau resit.`,
          en: `A quotation is a price offer to a customer **before** they book. It is **not** counted as a booking or revenue until you turn it into a booking or receipt.`,
        },
      },
      { kind: 'img', src: IMG + 'quotation-list.webp', caption: { bm: 'Senarai sebut harga, dengan carian, tarikh dicipta dan status', en: 'The quotation list, with search, created date and status' } },
      {
        kind: 'steps',
        items: [
          { bm: `Buka **Sebut Harga** dan tekan **Tambah Sebut Harga / Add Quotation**.`, en: `Open **Quotation** and tap **Tambah Sebut Harga / Add Quotation**.` },
          { bm: `**1. Butiran Pelanggan**: nama, no. telefon, emel, domestik/antarabangsa dan bilangan orang.`, en: `**1. Customer Details**: name, phone, email, local/international and number of pax.` },
          { bm: `**2. Butiran Sebut Harga**: tarikh, tarikh **sah sehingga** dan nama penyedia.`, en: `**2. Quotation Details**: date, **valid until** date and who prepared it.` },
          { bm: `**3. Perkara**: pilih syarikat, jenis produk, servis, tarikh dan harga. Tekan **Add More** untuk menambah perkara lain. Jumlah dikira sendiri.`, en: `**3. Items**: choose the company, product type, service, date and price. Tap **Add More** to add another item. The total is calculated for you.` },
          { bm: `**4. Nota & Terma**: tekan **Use Standard Text** untuk teks biasa syarikat anda, atau **Save Default** untuk menyimpan teks semasa sebagai teks biasa. Had: **5,000 aksara**.`, en: `**4. Notes & Terms**: tap **Use Standard Text** for your company's usual text, or **Save Default** to keep the current text as your usual text. Limit: **5,000 characters**.` },
          { bm: `Tekan **Simpan Sebut Harga / Save Quotation**.`, en: `Tap **Simpan Sebut Harga / Save Quotation**.` },
        ],
      },
      { kind: 'img', src: IMG + 'quotation-items.webp', caption: { bm: 'Perkara dan nota & terma dalam borang sebut harga', en: 'Items and notes & terms in the quotation form' } },
      {
        kind: 'p',
        text: {
          bm: `Dalam butiran sebut harga, butang di kanan atas digunakan apabila pelanggan bersetuju:`,
          en: `On the quotation details page, the buttons at the top right are used when the customer agrees:`,
        },
      },
      {
        kind: 'list',
        items: [
          { bm: `**PDF Quotation**: muat turun sebut harga untuk dihantar kepada pelanggan.`, en: `**PDF Quotation**: download the quotation to send to the customer.` },
          { bm: `**Tempahan/Booking**: pelanggan bayar **deposit** dahulu. Borang tempahan dibuka dengan maklumat sudah diisi.`, en: `**Tempahan/Booking**: the customer pays a **deposit** first. The booking form opens already filled in.` },
          { bm: `**Resit/Receipt**: pelanggan **bayar penuh** sekarang. Resit dikeluarkan terus.`, en: `**Resit/Receipt**: the customer **pays in full** now. A receipt is issued straight away.` },
          { bm: `**Edit Sebut Harga** dan **Batal Sebut Harga** berada di bahagian bawah.`, en: `**Edit Quotation** and **Cancel Quotation** are at the bottom.` },
        ],
      },
      { kind: 'img', src: IMG + 'quotation-detail.webp', caption: { bm: 'Butiran sebut harga', en: 'Quotation details' } },
      {
        kind: 'tip',
        text: {
          bm: `Sebut harga yang melepasi tarikh sah menjadi **Tamat**. Ia tidak dibatalkan. Edit dan panjangkan tarikh sah jika pelanggan masih berminat.`,
          en: `A quotation past its valid-until date becomes **Expired**. It isn't cancelled. Edit it and extend the date if the customer is still interested.`,
        },
      },
    ],
  },
  {
    id: 'booking-add',
    group: DAILY,
    icon: 'add-circle-outline',
    title: { bm: 'Tambah Tempahan', en: 'Add a Booking' },
    blocks: [
      {
        kind: 'p',
        text: {
          bm: `Gunakan ini apabila pelanggan menempah dan **membayar deposit** (atau belum membayar). Jika pelanggan bayar penuh terus, gunakan **E-Resit**.`,
          en: `Use this when a customer books and **pays a deposit** (or hasn't paid yet). If the customer pays in full straight away, use **E-Receipt** instead.`,
        },
      },
      {
        kind: 'steps',
        items: [
          { bm: `Buka **Tempahan** dan tekan **Tambah Tempahan / Add Booking**.`, en: `Open **Booking** and tap **Tambah Tempahan / Add Booking**.` },
          { bm: `**Pilih jenis**: Aktiviti, Penginapan atau Pakej.`, en: `**Select the type**: Activity, Accommodation or Package.` },
          { bm: `Isi tarikh (dan masa untuk aktiviti), nama pelancong, no. telefon, domestik/antarabangsa dan bilangan orang.`, en: `Fill in the date (and time for an activity), the tourist's name, phone, local/international and number of pax.` },
          { bm: `Pilih aktiviti atau penginapan dari senarai. Senarai ini datang dari **Data Induk**.`, en: `Choose the activity or accommodation from the list. The list comes from **Master Data**.` },
          { bm: `Isi **Jumlah (RM)** dan **Deposit (RM)** yang sudah dibayar, serta nama pengendali.`, en: `Enter the **Total (RM)** and the **Deposit (RM)** already paid, and the operator name.` },
          { bm: `Tekan **Hantar Tempahan / Submit Booking**.`, en: `Tap **Hantar Tempahan / Submit Booking**.` },
        ],
      },
      { kind: 'img', src: IMG + 'booking-add.webp', caption: { bm: 'Borang tempahan aktiviti', en: 'The activity booking form' } },
      {
        kind: 'tip',
        text: {
          bm: `Tiada aktiviti dalam senarai? Tambahkannya dahulu di **Data Induk**.`,
          en: `No activity in the list? Add it first in **Master Data**.`,
        },
      },
    ],
  },
  {
    id: 'booking-list',
    group: DAILY,
    icon: 'calendar-outline',
    title: { bm: 'Senarai & Kalendar Tempahan', en: 'Booking List & Calendar' },
    blocks: [
      {
        kind: 'p',
        text: {
          bm: `Halaman **Tempahan** menyenaraikan semua tempahan. Tekan **Type** atau **Status** untuk menyusun.`,
          en: `The **Booking** page lists every booking. Tap **Type** or **Status** to sort.`,
        },
      },
      { kind: 'img', src: IMG + 'booking-list.webp', caption: { bm: 'Senarai tempahan', en: 'The booking list' } },
      {
        kind: 'table',
        head: [{ bm: 'Ikon', en: 'Icon' }, { bm: 'Fungsi', en: 'What it does' }],
        rows: [
          [{ bm: 'ⓘ', en: 'ⓘ' }, { bm: 'Lihat butiran tempahan', en: 'View the booking details' }],
          [{ bm: '✎', en: '✎' }, { bm: 'Kemaskini tempahan (hanya Booked/Deposit)', en: 'Update the booking (Booked/Deposit only)' }],
          [{ bm: '⊘', en: '⊘' }, { bm: 'Batalkan tempahan', en: 'Cancel the booking' }],
        ],
      },
      {
        kind: 'p',
        text: {
          bm: `Tekan **Calendar View** untuk melihat tempahan mengikut tarikh. Tarikh **oren** ada tempahan deposit, tarikh **hijau** sudah dibayar. Tekan satu tarikh untuk melihat tempahannya. **Table View** kembali ke senarai.`,
          en: `Tap **Calendar View** to see bookings by date. **Orange** dates have deposit bookings, **green** dates are paid. Tap a date to see its bookings. **Table View** goes back to the list.`,
        },
      },
      { kind: 'img', src: IMG + 'booking-calendar.webp', caption: { bm: 'Paparan kalendar', en: 'Calendar view' } },
    ],
  },
  {
    id: 'booking-detail',
    group: DAILY,
    icon: 'reader-outline',
    title: { bm: 'Butiran, Bayaran & Pembatalan', en: 'Details, Payment & Cancelling' },
    blocks: [
      {
        kind: 'p',
        text: {
          bm: `Tekan **ⓘ** pada tempahan untuk membuka butirannya. Butang di bawah bergantung pada status:`,
          en: `Tap **ⓘ** on a booking to open its details. The buttons at the bottom depend on the status:`,
        },
      },
      {
        kind: 'list',
        items: [
          { bm: `**Booking Confirmation** (kanan atas): PDF pengesahan tempahan untuk pelanggan.`, en: `**Booking Confirmation** (top right): a booking confirmation PDF for the customer.` },
          { bm: `**Batal Tempahan**: batalkan tempahan. Deposit kekal direkodkan.`, en: `**Cancel Booking**: cancel the booking. The deposit stays on record.` },
          { bm: `**Kemaskini Tempahan**: ubah butiran tempahan.`, en: `**Update Booking**: change the booking details.` },
          { bm: `**Resit Bayaran**: apabila pelanggan **menjelaskan baki**, tekan ini. Tempahan menjadi **Booked/Paid** dan resit dikeluarkan.`, en: `**Payment Receipt**: when the customer **pays the balance**, tap this. The booking becomes **Booked/Paid** and a receipt is issued.` },
        ],
      },
      { kind: 'img', src: IMG + 'booking-detail-open.webp', caption: { bm: 'Tempahan deposit: Batal, Kemaskini dan Resit Bayaran', en: 'A deposit booking: Cancel, Update and Payment Receipt' } },
      {
        kind: 'p',
        text: {
          bm: `Untuk tempahan yang **sudah dibayar**:`,
          en: `For a **paid** booking:`,
        },
      },
      {
        kind: 'list',
        items: [
          { bm: `**Resit Bayaran**: lihat resit. Pelanggan boleh mengimbas kod QR untuk mendapatkan resit.`, en: `**Payment Receipt**: view the receipt. The customer can scan the QR code to get the receipt.` },
          { bm: `**Muat Turun PDF**: simpan resit sebagai PDF.`, en: `**Download PDF**: save the receipt as a PDF.` },
          { bm: `**Panggil Semula**: tersilap tanda sebagai dibayar? Ini mengembalikan tempahan ke status deposit, resit dibuang dan tempahan boleh diedit semula.`, en: `**Recall Booking**: marked as paid by mistake? This puts the booking back to deposit status, removes the receipt and lets you edit it again.` },
        ],
      },
      { kind: 'img', src: IMG + 'booking-detail-paid.webp', caption: { bm: 'Tempahan dibayar: Panggil Semula, Resit Bayaran dan Muat Turun PDF', en: 'A paid booking: Recall, Payment Receipt and Download PDF' } },
      { kind: 'img', src: IMG + 'receipt.webp', caption: { bm: 'Resit pembayaran', en: 'The payment receipt' } },
      {
        kind: 'warn',
        text: {
          bm: `Pembatalan **tidak boleh dibuat asal**. Semak dahulu sebelum menekan Ya.`,
          en: `Cancelling **can't be undone**. Check before you tap Yes.`,
        },
      },
    ],
  },
  {
    id: 'ereceipt',
    group: DAILY,
    icon: 'receipt-outline',
    title: { bm: 'E-Resit (Bayar Penuh)', en: 'E-Receipt (Paid in Full)' },
    blocks: [
      {
        kind: 'p',
        text: {
          bm: `Gunakan **E-Resit** apabila pelanggan **membayar penuh terus**, contohnya pelanggan datang tanpa tempahan. Tempahan direkodkan sebagai dibayar dan resit dikeluarkan serta-merta.`,
          en: `Use **E-Receipt** when a customer **pays in full straight away**, for example a walk-in customer. The booking is recorded as paid and a receipt is issued at once.`,
        },
      },
      {
        kind: 'steps',
        items: [
          { bm: `Buka **E-Resit** dan pilih **Aktiviti Tarikan**, **Tempat Penginapan** atau **Pakej Pelancongan**.`, en: `Open **E-Receipt** and choose **Aktiviti Tarikan** (activity), **Tempat Penginapan** (accommodation) or **Pakej Pelancongan** (package).` },
          { bm: `Isi butiran pelanggan, aktiviti/penginapan dan jumlah bayaran.`, en: `Fill in the customer details, the activity/accommodation and the total paid.` },
          { bm: `Hantar. Resit dipaparkan dan boleh dimuat turun atau dikongsi.`, en: `Submit. The receipt is shown and can be downloaded or shared.` },
        ],
      },
      { kind: 'img', src: IMG + 'ereceipt.webp', caption: { bm: 'Pilih jenis resit', en: 'Choose the receipt type' } },
      { kind: 'img', src: IMG + 'ereceipt-form.webp', caption: { bm: 'Borang E-Resit aktiviti', en: 'The activity E-Receipt form' } },
    ],
  },
  {
    id: 'transaction',
    group: DAILY,
    icon: 'wallet-outline',
    title: { bm: 'Transaksi & Laporan', en: 'Transactions & Reports' },
    blocks: [
      {
        kind: 'p',
        text: {
          bm: `**Transaksi** menyenaraikan semua tempahan yang **sudah dibayar**, dibahagikan kepada Aktiviti, Penginapan dan Pakej.`,
          en: `**My Transaction** lists every **paid** booking, split into Activity, Accommodation and Package.`,
        },
      },
      {
        kind: 'list',
        items: [
          { bm: `Pilih tarikh **From** dan **To** untuk menapis. **Reset Date** membuang tapisan.`, en: `Choose **From** and **To** dates to filter. **Reset Date** removes the filter.` },
          { bm: `Tekan **View Receipt** pada mana-mana transaksi untuk melihat resitnya.`, en: `Tap **View Receipt** on any transaction to see its receipt.` },
        ],
      },
      { kind: 'img', src: IMG + 'transaction.webp', caption: { bm: 'Senarai transaksi', en: 'The transaction list' } },
      {
        kind: 'steps',
        items: [
          { bm: `Tekan **Generate Report**.`, en: `Tap **Generate Report**.` },
          { bm: `Pilih **tahun**, **jenis** dan julat **bulan**.`, en: `Choose the **year**, the **type** and the range of **months**.` },
          { bm: `Tekan **Generate Report** untuk melihat Penyata Akaun, kemudian **Download Report** untuk menyimpannya.`, en: `Tap **Generate Report** to see the Account Statement, then **Download Report** to save it.` },
        ],
      },
      { kind: 'img', src: IMG + 'transaction-report.webp', caption: { bm: 'Jana laporan penyata akaun', en: 'Generating an account statement report' } },
    ],
  },

  /* ── Company settings ───────────────────────────────────────────── */
  {
    id: 'profile',
    group: SETTINGS,
    icon: 'business-outline',
    title: { bm: 'Profil Syarikat', en: 'Company Profile' },
    blocks: [
      {
        kind: 'p',
        text: {
          bm: `**Profil Anda** memaparkan butiran perniagaan, bilangan kakitangan dan dokumen syarikat. Butiran ini dipaparkan pada resit anda.`,
          en: `**My Profile** shows your business details, staff numbers and company documents. These details appear on your receipts.`,
        },
      },
      {
        kind: 'steps',
        items: [
          { bm: `Tekan **Kemaskini/Update**.`, en: `Tap **Kemaskini/Update**.` },
          { bm: `Ubah butiran yang perlu. Untuk logo, pilih gambar, laraskan bingkai dan tekan apply.`, en: `Change what you need. For the logo, choose an image, adjust the frame and apply.` },
          { bm: `Muat naik atau tukar dokumen, kemudian simpan.`, en: `Upload or replace documents, then save.` },
        ],
      },
      { kind: 'img', src: IMG + 'profile.webp', caption: { bm: 'Profil syarikat', en: 'The company profile' } },
      {
        kind: 'note',
        text: {
          bm: `Nama dan emel pemilik hanya boleh diubah oleh **pemilik** sendiri. **Buang Akaun** menghantar permintaan kepada pentadbir. Rekod tempahan dan resit lama tetap disimpan.`,
          en: `The owner's name and email can only be changed by the **owner**. **Delete Account** sends a request to an administrator. Existing booking and receipt records are kept.`,
        },
      },
    ],
  },
  {
    id: 'users',
    group: SETTINGS,
    icon: 'people-outline',
    title: { bm: 'Akaun Kakitangan', en: 'Staff Accounts' },
    blocks: [
      {
        kind: 'p',
        text: {
          bm: `Hanya **Admin Pengendali** boleh membuka **Pengurusan Pengguna**. Setiap kakitangan patut ada akaun sendiri.`,
          en: `Only the **Operator Admin** can open **User Management**. Each staff member should have their own account.`,
        },
      },
      {
        kind: 'steps',
        items: [
          { bm: `Tekan **Tambah/Add**.`, en: `Tap **Tambah/Add**.` },
          { bm: `Isi nama penuh, nama pengguna dan emel.`, en: `Fill in the full name, username and email.` },
          { bm: `Pilih **peranan**: **Operator Staff** untuk kerja harian, **Operator Admin** jika dia juga perlu mengurus pengguna.`, en: `Choose the **role**: **Operator Staff** for daily work, **Operator Admin** if they also need to manage users.` },
          { bm: `Tetapkan kata laluan (sekurang-kurangnya 8 aksara) dan tekan **Simpan / Save**.`, en: `Set a password (at least 8 characters) and tap **Simpan / Save**.` },
        ],
      },
      { kind: 'img', src: IMG + 'users-add.webp', caption: { bm: 'Tambah pengguna baharu', en: 'Adding a new user' } },
      {
        kind: 'list',
        items: [
          { bm: `**Suis Aktif**: tutup untuk menghalang kakitangan log masuk tanpa memadam akaunnya.`, en: `**Active switch**: turn it off to stop a staff member logging in without deleting their account.` },
          { bm: `**ⓘ / ✎ / 🗑**: lihat, edit atau padam pengguna.`, en: `**ⓘ / ✎ / 🗑**: view, edit or delete a user.` },
        ],
      },
      { kind: 'img', src: IMG + 'users.webp', caption: { bm: 'Senarai pengguna', en: 'The user list' } },
    ],
  },
  {
    id: 'master-data',
    group: SETTINGS,
    icon: 'list-outline',
    title: { bm: 'Data Induk (Aktiviti & Penginapan)', en: 'Master Data (Activities & Accommodations)' },
    blocks: [
      {
        kind: 'p',
        text: {
          bm: `**Data Induk** ialah senarai aktiviti dan penginapan yang syarikat anda tawarkan. Senarai ini digunakan dalam borang tempahan, E-Resit dan sebut harga. **Tambahkannya dahulu sebelum membuat tempahan pertama.**`,
          en: `**Master Data** is the list of activities and accommodations your company offers. It is used in the booking, E-Receipt and quotation forms. **Add them before making your first booking.**`,
        },
      },
      {
        kind: 'steps',
        items: [
          { bm: `Tekan **Tambah/Add**.`, en: `Tap **Tambah/Add**.` },
          { bm: `Pilih **jenis produk** (Aktiviti atau Penginapan) dan taip **nama produk**.`, en: `Choose the **product type** (Activity or Accommodation) and type the **product name**.` },
          { bm: `Tekan **Tambah/Add** dalam pop-up untuk memasukkannya ke senarai. Ulang untuk produk lain.`, en: `Tap **Tambah/Add** in the pop-up to put it on the list. Repeat for other products.` },
          { bm: `Tekan **Save/Simpan**.`, en: `Tap **Save/Simpan**.` },
        ],
      },
      { kind: 'img', src: IMG + 'master-data-add.webp', caption: { bm: 'Tambah data induk', en: 'Adding master data' } },
      {
        kind: 'tip',
        text: {
          bm: `Tidak lagi menawarkan sesuatu? Tutup suis **Aktif**. Ia tidak akan muncul dalam borang tempahan, tetapi tempahan lama kekal.`,
          en: `No longer offering something? Turn its **Active** switch off. It won't appear in the booking forms, but old bookings stay.`,
        },
      },
      { kind: 'img', src: IMG + 'master-data.webp', caption: { bm: 'Senarai data induk', en: 'The master data list' } },
    ],
  },

  /* ── Reference ──────────────────────────────────────────────────── */
  {
    id: 'statuses',
    group: REFERENCE,
    icon: 'pricetags-outline',
    title: { bm: 'Maksud Status', en: 'What the Statuses Mean' },
    blocks: [
      {
        kind: 'table',
        head: [{ bm: 'Status tempahan', en: 'Booking status' }, { bm: 'Maksud', en: 'Meaning' }],
        rows: [
          [{ bm: 'Booked/Deposit', en: 'Booked/Deposit' }, { bm: 'Ditempah, deposit dibayar atau belum bayar. Baki belum dijelaskan.', en: 'Booked, deposit paid or nothing paid yet. The balance is still owed.' }],
          [{ bm: 'Booked/Paid', en: 'Booked/Paid' }, { bm: 'Dibayar penuh. Resit sudah dikeluarkan.', en: 'Paid in full. A receipt has been issued.' }],
          [{ bm: 'Cancelled', en: 'Cancelled' }, { bm: 'Dibatalkan. Deposit (jika ada) kekal direkodkan.', en: 'Cancelled. Any deposit stays on record.' }],
        ],
      },
      {
        kind: 'table',
        head: [{ bm: 'Status sebut harga', en: 'Quotation status' }, { bm: 'Maksud', en: 'Meaning' }],
        rows: [
          [{ bm: 'Dihantar', en: 'Sent' }, { bm: 'Disimpan dan sedia dihantar kepada pelanggan.', en: 'Saved and ready to send to the customer.' }],
          [{ bm: 'Tamat', en: 'Expired' }, { bm: 'Melepasi tarikh sah. Edit untuk memanjangkannya.', en: 'Past its valid-until date. Edit it to extend.' }],
          [{ bm: 'Diterima', en: 'Accepted' }, { bm: 'Sudah ditukar menjadi tempahan atau resit.', en: 'Already turned into a booking or receipt.' }],
          [{ bm: 'Dibatalkan', en: 'Cancelled' }, { bm: 'Dibatalkan oleh pengendali.', en: 'Cancelled by the operator.' }],
        ],
      },
    ],
  },
  {
    id: 'faq',
    group: REFERENCE,
    icon: 'help-circle-outline',
    title: { bm: 'Masalah Biasa / Soalan Lazim', en: 'Troubleshooting / FAQ' },
    blocks: [
      {
        kind: 'table',
        head: [{ bm: 'Masalah', en: 'Problem' }, { bm: 'Apa perlu dibuat', en: 'What to do' }],
        rows: [
          [{ bm: 'Lupa kata laluan', en: 'Forgot password' }, { bm: 'Tekan **Lupa Kata Laluan?** di halaman log masuk dan ikut pautan dalam emel.', en: 'Tap **Lupa Kata Laluan?** on the login page and follow the link in the email.' }],
          [{ bm: '"Menunggu kelulusan" semasa log masuk', en: '"Awaiting approval" when logging in' }, { bm: 'Persatuan anda belum meluluskan pendaftaran. Tunggu emel atau hubungi persatuan.', en: "Your association hasn't approved your registration yet. Wait for the email or contact your association." }],
          [{ bm: '"Akaun tidak aktif"', en: '"Account inactive"' }, { bm: 'Hubungi persatuan anda. Sebabnya dipaparkan semasa log masuk.', en: 'Contact your association. The reason is shown when you log in.' }],
          [{ bm: 'Aktiviti tiada dalam senarai tempahan', en: "An activity isn't in the booking list" }, { bm: 'Tambahkannya di **Data Induk**, atau semak suis **Aktif**nya dihidupkan.', en: 'Add it in **Master Data**, or check its **Active** switch is on.' }],
          [{ bm: 'Tersilap tanda tempahan sebagai dibayar', en: 'Marked a booking as paid by mistake' }, { bm: 'Buka tempahan dan tekan **Panggil Semula**.', en: 'Open the booking and tap **Recall Booking**.' }],
          [{ bm: 'Tiada internet', en: 'No internet' }, { bm: 'Tempahan yang dibuat semasa luar talian disimpan dan dihantar apabila internet kembali. Halaman yang memerlukan internet akan memberitahu anda.', en: "Bookings made offline are saved and sent when the internet is back. Pages that need the internet will tell you." }],
          [{ bm: 'Skrin nampak lama selepas kemas kini sistem', en: 'Screens look old after a system update' }, { bm: 'Log keluar dan log masuk semula, atau muat semula halaman.', en: 'Log out and back in, or reload the page.' }],
        ],
      },
      {
        kind: 'note',
        text: {
          bm: `Masih perlukan bantuan? Hubungi persatuan anda.`,
          en: `Still need help? Contact your association.`,
        },
      },
    ],
  },
];
