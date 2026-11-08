// ============================================================
// "Tahukah Antum?" — basis fakta sejarah & sains peradaban Islam
// Setiap entri mencantumkan referensi akademik yang kredibel.
// ============================================================

export type FactCategory = "sejarah" | "ilmuwan" | "penemuan" | "seni" | "geografi";

export interface IslamicFact {
  id: string;
  category: FactCategory;
  title: string;
  period: string;
  place: string;
  body: string;
  sources: string[];
}

export const FACT_CATEGORIES: { id: FactCategory | "semua"; label: string; emoji: string }[] = [
  { id: "semua", label: "Semua", emoji: "★" },
  { id: "sejarah", label: "Sejarah Ilmu", emoji: "📖" },
  { id: "ilmuwan", label: "Ilmuwan", emoji: "🔭" },
  { id: "penemuan", label: "Penemuan", emoji: "⚙" },
  { id: "seni", label: "Seni & Bangunan", emoji: "🕌" },
  { id: "geografi", label: "Penjelajahan", emoji: "🧭" },
];

export const ISLAMIC_FACTS: IslamicFact[] = [
  {
    id: "baitul-hikmah",
    category: "sejarah",
    title: "Baitul Hikmah, Kebijaksanaan dari Baghdad",
    period: "Abad ke-8–9 M",
    place: "Baghdad, Irak",
    body:
      "Baitul Hikmah (Bayt al-Ḥikmah) adalah perpustakaan kerajaan sekaligus pusat penerjemahan Dinasti Abbasiyah di Baghdad. Tempat ini mencapai puncaknya di masa Khalifah Harun al-Rasyid (786–809 M) dan putranya al-Ma'mun (813–833 M), yang mendukung penerjemahan karya Yunani, Persia, dan Suryani ke dalam bahasa Arab. Para penerjemah dari beragam latar belakang bekerja bersama para ilmuwan, dan bahasa Arab menjadi bahasa ilmu pengetahuan pada masanya.",
    sources: [
      "Encyclopaedia Britannica — “Bayt al-Ḥikmah”",
      "George Saliba, Islamic Science and the Making of the European Renaissance (MIT Press, 2007)",
    ],
  },
  {
    id: "qarawiyyin",
    category: "sejarah",
    title: "Universitas Al-Qarawiyyin, Tertua yang Masih Berjalan",
    period: "859 M",
    place: "Fez, Maroko",
    body:
      "Pada tahun 859 M, Fatima al-Fihri mendirikan masjid dan lembaga pendidikan Al-Qarawiyyin di Kota Fez. Lembaga ini kemudian tumbuh menjadi pusat ilmu pengetahuan dan diakui sebagai lembaga pendidikan tertua yang masih beroperasi hingga hari ini. Masjid Al-Azhar di Kairo menyusul pada tahun 970 M.",
    sources: [
      "Guinness World Records — “Oldest existing, continually operating educational institution”",
      "Encyclopaedia Britannica — “al-Qarawiyyīn”",
    ],
  },
  {
    id: "kertas",
    category: "sejarah",
    title: "Kertas, Revolusi Ilmu dari Baghdad",
    period: "794 M",
    place: "Baghdad & al-Andalus",
    body:
      "Teknologi kertas yang berasal dari Tiongkok dikembangkan menjadi industri besar di Baghdad pada abad ke-8 M. Kertas yang lebih murah daripada perkamen membuat naskah ilmu pengetahuan mudah diperbanyak. Dari dunia Islam, teknologi ini menyebar ke Eropa melalui al-Andalus, dan mempercepat lahirnya perpustakaan serta percetakan.",
    sources: [
      "Jonathan M. Bloom, Paper Before Print: The History and Impact of Paper in the Islamic World (Yale University Press, 2001)",
      "Encyclopaedia Britannica — “papermaking”",
    ],
  },
  {
    id: "nizamiyyah",
    category: "sejarah",
    title: "Jaringan Madrasah Nizamiyyah",
    period: "1065 M",
    place: "Nishapur, Herat, Baghdad",
    body:
      "Wazir Nizam al-Mulk mendirikan madrasah Nizamiyyah pertama di Nishapur pada 1065 M, kemudian berkembang menjadi jaringan lembaga pendidikan di banyak kota besar. Kurikulumnya mencakup ilmu agama, bahasa, kedokteran, dan matematika. Lembaga semacam ini menjadi cikal-bakal sistem universitas yang kelak dikenal di Eropa.",
    sources: [
      "Encyclopaedia Britannica — “Niẓāmiyyah”",
      "George Makdisi, The Rise of Colleges: Institutions of Learning in Islam and the West (Edinburgh University Press, 1981)",
    ],
  },
  {
    id: "khawarizmi",
    category: "ilmuwan",
    title: "Al-Khawarizmi, Bapak Aljabar & Algoritma",
    period: "± 780–850 M",
    place: "Baghdad, Irak",
    body:
      "Muhammad bin Musa al-Khawarizmi bekerja di Baitul Hikmah. Kitabnya al-Jabr wal-Muqabalah (± 820 M) menyusun cara menyelesaikan persamaan secara sistematis — dari situlah lahir istilah “aljabar”. Buku aritmetikanya memperkenalkan angka 0–9 ke dunia Islam dan Eropa, sedangkan bentuk Latin dari namanya (Algoritmi) melahirkan kata “algoritma” yang kita pakai di komputer hari ini.",
    sources: [
      "Encyclopaedia Britannica — “al-Khwārizmī”",
      "Roshdi Rashed, The Development of Arabic Mathematics: Between Arithmetic and Algebra (Springer, 1994)",
    ],
  },
  {
    id: "ibnul-haitsam",
    category: "ilmuwan",
    title: "Ibnu al-Haytham, Bapak Optik Modern",
    period: "965–1040 M",
    place: "Kairo, Mesir",
    body:
      "Dalam Kitab al-Manazir (Book of Optics, ± 1021 M), Ibnu al-Haytham membuktikan bahwa cahaya merambat lurus dari benda menuju mata — bukan sebaliknya seperti kepercayaan saat itu. Ia menjelaskan cara kerja kamera obscura dan menggunakan eksperimen untuk menguji teorinya. Pendekatan inilah yang membuatnya dijuluki Bapak Optik dan pelopor metode ilmiah.",
    sources: [
      "Encyclopaedia Britannica — “Ibn al-Haytham”",
      "David C. Lindberg, Theories of Vision: From Al-Kindi to Kepler (University of Chicago Press, 1976)",
    ],
  },
  {
    id: "ibnu-sina",
    category: "ilmuwan",
    title: "Ibnu Sina & Kedokteran Dunia",
    period: "980–1037 M",
    place: "Bukhara & Hamadan",
    body:
      "Ibnu Sina (Avicenna) menulis al-Qanun fi al-Tibb (Kanon Kedokteran), ensiklopedia kedokteran yang memuat daftar sekitar 760 obat serta pembahasan penyakit menular dan cara karantina. Buku ini menjadi rujukan utama di fakultas kedokteran Eropa sampai abad ke-17 M.",
    sources: [
      "Encyclopaedia Britannica — “Avicenna”",
      "Peter E. Pormann & Emilie Savage-Smith, Medieval Islamic Medicine (Edinburgh University Press, 2007)",
    ],
  },
  {
    id: "ar-razi",
    category: "ilmuwan",
    title: "Al-Razi, Dokter yang Memisahkan Cacar & Campak",
    period: "854–925 M",
    place: "Rayy & Baghdad",
    body:
      "Abu Bakar al-Razi (Rhazes) menulis Kitab al-Hawi dan al-Mansuri, kumpulan pengetahuan kedokteran yang sangat lengkap pada masanya. Ia pertama kali membedakan secara klinis penyakit cacar (smallpox) dan campak (measles), dua penyakit yang sebelumnya sering dianggap sama.",
    sources: [
      "Encyclopaedia Britannica — “al-Rāzī”",
      "Peter E. Pormann & Emilie Savage-Smith, Medieval Islamic Medicine (Edinburgh University Press, 2007)",
    ],
  },
  {
    id: "az-zahrawi",
    category: "ilmuwan",
    title: "Al-Zahrawi, Perintis Bedah Modern",
    period: "936–1013 M",
    place: "Córdoba, al-Andalus",
    body:
      "Al-Zahrawi (Abulcasis) menyusun Kitab al-Tasrif dalam 30 jilid, dan jilid pembedahannya memuat lebih dari 200 gambar instrumen bedah — dari pisau bedah hingga penjepit. Ia juga memakai benang dari usus hewan (catgut) untuk menjahit luka, teknik yang masih dipakai sampai sekarang.",
    sources: [
      "Encyclopaedia Britannica — “al-Zahrāwī”",
      "Plinio Prioreschi, A History of Medicine (Horatius Press, 2001)",
    ],
  },
  {
    id: "al-biruni",
    category: "ilmuwan",
    title: "Al-Biruni Mengukur Radius Bumi",
    period: "973–1048 M",
    place: "Nandana (kini Pakistan)",
    body:
      "Al-Biruni menghitung keliling dan radius Bumi dengan mengukur ketinggian gunung serta sudut ke cakrawala. Hasilnya, radius Bumi sekitar 6.339 km — sangat mendekati nilai modern 6.371 km. Ia juga menulis perbandingan agama dan budaya dalam kitab al-Hind dengan metode yang sangat teliti.",
    sources: [
      "Encyclopaedia Britannica — “al-Bīrūnī”",
      "Edward C. Sachau (trans.), Alberuni’s India (Kegan Paul, 1910)",
    ],
  },
  {
    id: "al-battani",
    category: "ilmuwan",
    title: "Al-Battani & Tahun Matahari",
    period: "858–929 M",
    place: "Raqqa, Suriah",
    body:
      "Al-Battani (Albategnius) mengukur panjang tahun matahari 365 hari 5 jam 46 menit 24 detik — hanya selisih dua menit dari nilai modern. Ia memperbaiki banyak catatan astronomi Ptolemeus dan memperkenalkan fungsi sinus dalam trigonometri.",
    sources: [
      "Encyclopaedia Britannica — “al-Battānī”",
      "G. J. Toomer, “al-Battānī” in Dictionary of Scientific Biography (Scribner, 1970)",
    ],
  },
  {
    id: "khayyam",
    category: "ilmuwan",
    title: "Umar Khayyam & Kalender Paling Teliti",
    period: "1048–1131 M",
    place: "Nishapur & Isfahan",
    body:
      "Selain dikenal sebagai penyair, Umar Khayyam adalah matematikawan yang menyelesaikan persamaan kubik dengan metode geometri. Ia juga turut menyusun kalender Jalali (1079 M) yang tingkat kesalahannya hanya sekitar 1 hari setiap 5.000 tahun — lebih teliti daripada kalender yang dipakai di Eropa saat itu.",
    sources: [
      "Encyclopaedia Britannica — “Omar Khayyam”",
      "J. J. O’Connor & E. F. Robertson, MacTutor History of Mathematics (University of St Andrews)",
    ],
  },
  {
    id: "alkindi",
    category: "ilmuwan",
    title: "Al-Kindi & Lahirnya Kriptanalisis",
    period: "± 801–873 M",
    place: "Baghdad, Irak",
    body:
      "Al-Kindi menulis risalah tentang cara memecahkan pesan rahasia (Istikhraj al-Mu'amma). Ia menyadari bahwa huruf yang paling sering muncul dalam tulisan Arab adalah yang paling sering muncul pula dalam sandi. Metode ini dikenal sebagai analisis frekuensi — cikal bakal ilmu memecahkan sandi yang dipakai sampai era komputer.",
    sources: [
      "Simon Singh, The Code Book: The Science of Secrecy from Ancient Egypt to Quantum Cryptography (Fourth Estate, 1999)",
      "Encyclopaedia Britannica — “al-Kindī”",
    ],
  },
  {
    id: "as-sufi",
    category: "ilmuwan",
    title: "Al-Sufi & Peta Bintang yang Indah",
    period: "903–986 M",
    place: "Rayy, Persia",
    body:
      "Abdulrahman al-Sufi menulis Kitab Suwar al-Kawakib al-Thabita (Buku Gambar Bintang Tetap, 964 M) yang memuat 48 konstelasi lengkap dengan koreksi posisi bintang. Di dalamnya tercatat pengamatan awal galaksi Andromeda. Sebagai penghormatan, sebuah kawah di Bulan dinamai “Azophi” — bentuk Latin dari namanya.",
    sources: [
      "Encyclopaedia Britannica — “al-Ṣūfī”",
      "International Astronomical Union / IAU WGPSN — Lunar crater “Azophi”",
    ],
  },
  {
    id: "at-tusi",
    category: "ilmuwan",
    title: "Al-Tusi & Observatorium Maragheh",
    period: "1201–1274 M",
    place: "Maragheh, Persia",
    body:
      "Nasiruddin al-Tusi memimpin Observatorium Maragheh, salah satu lembaga penelitian terbesar pada masanya. Ia merancang “pasangan Tusi”, perangkat matematika yang mengubah gerak melingkar menjadi gerak lurus. Perangkat ini kelak muncul pula dalam karya astronomi Kopernikus di Eropa.",
    sources: [
      "George Saliba, Islamic Science and the Making of the European Renaissance (MIT Press, 2007)",
      "F. Jamil Ragep, Nasir al-Din al-Tusi’s Memoir on Astronomy (Springer, 1993)",
    ],
  },
  {
    id: "ibnun-nafis",
    category: "ilmuwan",
    title: "Ibnu al-Nafis & Peredaran Darah Paru",
    period: "1213–1288 M",
    place: "Kairo, Mesir",
    body:
      "Dalam Syarh Tashrih al-Qanun, Ibnu al-Nafis menjelaskan bahwa darah dari bilik kanan jantung mengalir ke paru-paru sebelum kembali ke bilik kiri — inilah yang disebut peredaran darah kecil (sirkulasi pulmonal). Penjelasan ini ditulis berabad-abad sebelum penjelasan serupa dikenal luas di Eropa.",
    sources: [
      "Albert Z. Iskandar, Ibn al-Nafis and the Discovery of Pulmonary Circulation (Wellcome Institute, 1955)",
      "Peter E. Pormann & Emilie Savage-Smith, Medieval Islamic Medicine (Edinburgh University Press, 2007)",
    ],
  },
  {
    id: "jazari",
    category: "penemuan",
    title: "Al-Jazari & Mesin-mesin Ajaib",
    period: "1136–1206 M",
    place: "Diyarbakir, Turki",
    body:
      "Kitab Ma'rifat al-Hiyal al-Handasiyyah (Buku Pengetahuan Alat-alat Mekanis, 1206 M) karya al-Jazari memuat puluhan alat mekanis: engkol (crankshaft), batang penghubung, pompa tenaga air, dan otomata bergerak seperti Gajah Jam. Banyak bagian mesin modern yang bermula dari prinsip yang ia jelaskan.",
    sources: [
      "Encyclopaedia Britannica — “al-Jazarī”",
      "Donald R. Hill (trans.), The Book of Knowledge of Ingenious Mechanical Devices (Springer, 1974)",
    ],
  },
  {
    id: "banu-musa",
    category: "penemuan",
    title: "Tiga Bersaudara Bani Musa",
    period: "Abad ke-9 M",
    place: "Baghdad, Irak",
    body:
      "Muhammad, Ahmad, dan Hasan — tiga bersaudara Bani Musa — bekerja di Baitul Hikmah dan menulis Kitab al-Hiyal (Buku Alat-alat Cerdik). Karyanya memuat lebih dari 100 perangkat mekanis, banyak di antaranya bergerak otomatis tanpa disentuh manusia. Mereka juga mengembangkan cara mengukur volume benda yang rumit.",
    sources: [
      "Encyclopaedia Britannica — “Banū Mūsā”",
      "Donald R. Hill (trans.), The Book of Ingenious Devices (Springer, 1979)",
    ],
  },
  {
    id: "ibn-firnas",
    category: "penemuan",
    title: "Abbas ibn Firnas & Percobaan Terbang",
    period: "875 M",
    place: "Córdoba, al-Andalus",
    body:
      "Menurut catatan sejarah al-Andalus, Abbas ibn Firnas melakukan percobaan meluncur dari tempat tinggi di dekat Córdoba dengan sayap berbahan kayu yang dilapisi kain dan bulu. Ia sempat melayang sebelum mendarat dengan cedera punggung. Karena inilah ia sering disebut sebagai salah satu perintis penerbangan.",
    sources: [
      "Lynn Townsend White Jr., Medieval Technology and Social Change (Oxford University Press, 1962)",
      "Al-Maqqarī, Nafḥ al-Ṭib (kompilasi sejarawan al-Andalus abad ke-17 M)",
    ],
  },
  {
    id: "girih",
    category: "seni",
    title: "Girih: Matematika di Balik Kubah Masjid",
    period: "Abad ke-15 M",
    place: "Isfahan, Iran",
    body:
      "Ornamen girih pada bangunan seperti Masjid Darb-i Imam di Isfahan (1453 M) tersusun dari pola geometri yang sangat rapi. Pada tahun 2007, Peter Lu dan Paul Steinhardt mempublikasikan di jurnal Science bahwa pola ini menggunakan prinsip tiling kuasi-kristalin — pola yang baru dipelajari para matematikawan Barat sekitar 500 tahun kemudian.",
    sources: [
      "Peter J. Lu & Paul J. Steinhardt, “Decagonal and Quasi-Crystalline Tilings in Medieval Islamic Architecture”, Science 315, 1106–1110 (23 February 2007)",
    ],
  },
  {
    id: "idrisi",
    category: "geografi",
    title: "Al-Idrisi & Peta Dunia Paling Akurat",
    period: "1154 M",
    place: "Palermo, Sisilia",
    body:
      "Al-Idrisi menyusun Tabula Rogeriana untuk Raja Roger II di Sisilia: 70 peta dunia yang disertai teks geografi berjudul Nuzhat al-Mushtaq. Pada masanya, ini merupakan peta dunia paling lengkap dan akurat yang pernah dibuat, memadukan pengetahuan pelaut, pedagang, dan para ilmuwan.",
    sources: [
      "Encyclopaedia Britannica — “al-Idrīsī”",
      "J. B. Harley & David Woodward (eds.), The History of Cartography, Vol. 2 (University of Chicago Press, 1992)",
    ],
  },
  {
    id: "ibnu-battuta",
    category: "geografi",
    title: "Ibnu Battuta, Penjelajah Sejati",
    period: "1325–1354 M",
    place: "Maroko → Tiongkok",
    body:
      "Ibnu Battuta berangkat dari Tangier menuju Makkah, lalu meneruskan perjalanan ke Afrika, India, Maladewa, hingga Tiongkok. Total jarak jelajahnya diperkirakan mencapai ± 120.000 km selama hampir 30 tahun. Catatannya yang berjudul Rihlah menjadi sumber penting tentang dunia Islam pada abad ke-14 M.",
    sources: [
      "Encyclopaedia Britannica — “Ibn Baṭṭūṭa”",
      "H. A. R. Gibb (trans.), The Travels of Ibn Battuta (Hakluyt Society, 1958–1994)",
    ],
  },
];

export function factById(id: string) {
  return ISLAMIC_FACTS.find((f) => f.id === id);
}
