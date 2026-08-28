// const Jurnal7KaihService = {
//     // =====================================================
//     // INIT
//     // =====================================================
//     async init() {
//         const user = AppState.currentUser;
//         if (!user) {
//             console.warn(
//                 "Jurnal7KaihService: user belum tersedia"
//             );
//             return;
//         }
//         this.setupTanggal();
//         this.setupForm();
//         const tanggalEl =
//             document.getElementById(
//                 "jurnal-tanggal"
//             );
//         if (tanggalEl) {
//             tanggalEl.addEventListener(
//                 "change",
//                 async () => {
//                     if (
//                         !this.isValidJournalDate(
//                             tanggalEl.value
//                         )
//                     ) {
//                         await this.showValidationAlert(
//                             "Tanggal Tidak Valid",
//                             "Jurnal hanya dapat diisi untuk hari ini atau hari sebelumnya.",
//                             tanggalEl,
//                             "Pilih Tanggal"
//                         );
//                         tanggalEl.value =
//                             this.getLocalDate();
//                         return;
//                     }
//                     await this.loadExisting();
//                 }
//             );
//         }
//         await this.loadExisting();
//     },
//     // =====================================================
//     // TANGGAL
//     // =====================================================
//     setupTanggal() {
//         const tanggalEl =
//             document.getElementById(
//                 "jurnal-tanggal"
//             );
//         if (!tanggalEl) {
//             return;
//         }
//         const today =
//             this.getLocalDate();
//         const yesterday =
//             this.getLocalDate(-1);
//         tanggalEl.min =
//             yesterday;
//         tanggalEl.max =
//             today;
//         if (!tanggalEl.value) {
//             tanggalEl.value =
//                 today;
//         }
//     },
//     // =====================================================
//     // FORM EVENT
//     // =====================================================
//     setupForm() {
//         const form =
//             document.getElementById(
//                 "form-jurnal-7-kaih"
//             );
//         if (!form) {
//             return;
//         }
//         form.onsubmit =
//             async event => {
//                 event.preventDefault();
//                 await this.review();
//             };
//     },
//     // =====================================================
//     // SWEETALERT VALIDASI
//     // =====================================================
//     async showValidationAlert(
//         title,
//         text,
//         element = null,
//         buttonText = "Isi Sekarang"
//     ) {
//         await Swal.fire({
//             icon: "warning",
//             title: title,
//             text: text,
//             confirmButtonText:
//                 buttonText,
//             confirmButtonColor:
//                 "#4f46e5",
//             allowOutsideClick:
//                 false,
//             allowEscapeKey:
//                 true,
//             customClass: {
//                 popup:
//                     "rounded-2xl",
//                 title:
//                     "text-lg font-bold text-slate-800",
//                 htmlContainer:
//                     "text-sm text-slate-600",
//                 confirmButton:
//                     "rounded-xl px-5 py-2.5 font-semibold"
//             },
//             buttonsStyling: true
//         });
//         // =================================================
//         // KEMBALI KE FIELD
//         // =================================================
//         if (!element) {
//             return;
//         }
//         // Pastikan modal/review ditutup
//         this.closeReview();
//         // =================================================
//         // SCROLL KE FIELD
//         // =================================================
//         setTimeout(() => {
//             element.scrollIntoView({
//                 behavior: "smooth",
//                 block: "center"
//             });
//             // Fokus setelah posisi scroll mulai bergerak
//             setTimeout(() => {
//                 element.focus({
//                     preventScroll: true
//                 });
//             }, 300);
//         }, 150);
//     },
//     // =====================================================
//     // REVIEW
//     // =====================================================
//     async review() {
//         console.log("=== REVIEW JURNAL 7 KAIH ===");
//         const user = AppState.currentUser;
//         if (!user) {
//             await Swal.fire({
//                 icon: "error",
//                 title: "Data Siswa Tidak Ditemukan",
//                 text: "Silakan login kembali.",
//                 confirmButtonText: "OK",
//                 confirmButtonColor: "#4f46e5",
//                 customClass: {
//                     popup: "rounded-2xl",
//                     confirmButton:
//                         "rounded-xl px-5 py-2.5 font-semibold"
//                 }
//             });
//             return;
//         }
//         // =================================================
//         // AMBIL DATA FORM
//         // =================================================
//         const tanggal =
//             document.getElementById("jurnal-tanggal")?.value || "";
//         const bangun =
//             document.getElementById("jurnal-bangun")?.value || "";
//         const ibadah =
//             document.getElementById("jurnal-ibadah")?.value || "";
//         const olahraga =
//             document.getElementById("jurnal-olahraga")?.value || "";
//         const makan =
//             document.getElementById("jurnal-makan")?.value.trim() || "";
//         const gemar =
//             document.getElementById("jurnal-gemar")?.value.trim() || "";
//         const bermasyarakat =
//             document.getElementById("jurnal-bermasyarakat")?.value.trim() || "";
//         const tidur =
//             document.getElementById("jurnal-tidur")?.value || "";
//         // =================================================
//         // DEBUG
//         // =================================================
//         console.log("DATA FORM:", {
//             tanggal,
//             bangun,
//             ibadah,
//             olahraga,
//             makan,
//             gemar,
//             bermasyarakat,
//             tidur
//         });
//         // =================================================
//         // VALIDASI
//         // =================================================
//         if (!tanggal) {
//             await this.showValidationAlert(
//                 "Tanggal Belum Diisi",
//                 "Silakan pilih tanggal jurnal.",
//                 document.getElementById("jurnal-tanggal")
//             );
//             return;
//         }
//         if (!this.isValidJournalDate(tanggal)) {
//             await this.showValidationAlert(
//                 "Tanggal Tidak Valid",
//                 "Jurnal hanya dapat diisi untuk hari ini atau hari sebelumnya.",
//                 document.getElementById("jurnal-tanggal"),
//                 "Pilih Tanggal"
//             );
//             return;
//         }
//         if (!bangun) {
//             await this.showValidationAlert(
//                 "Jam Bangun Belum Diisi",
//                 "Silakan masukkan jam berapa kamu bangun pagi.",
//                 document.getElementById("jurnal-bangun")
//             );
//             return;
//         }
//         if (
//             ibadah === "" ||
//             !Number.isInteger(Number(ibadah)) ||
//             Number(ibadah) < 0
//         ) {
//             await this.showValidationAlert(
//                 "Data Ibadah Belum Valid",
//                 "Silakan masukkan jumlah ibadah dalam bentuk angka.",
//                 document.getElementById("jurnal-ibadah")
//             );
//             return;
//         }
//         if (
//             olahraga === "" ||
//             !Number.isInteger(Number(olahraga)) ||
//             Number(olahraga) < 0
//         ) {
//             await this.showValidationAlert(
//                 "Data Olahraga Belum Valid",
//                 "Silakan masukkan durasi olahraga dalam satuan menit.",
//                 document.getElementById("jurnal-olahraga")
//             );
//             return;
//         }
//         if (!makan) {
//             await this.showValidationAlert(
//                 "Jurnal Makan Belum Diisi",
//                 "Tuliskan makanan dan minuman sehat yang kamu konsumsi.",
//                 document.getElementById("jurnal-makan")
//             );
//             return;
//         }
//         if (!gemar) {
//             await this.showValidationAlert(
//                 "Jurnal Gemar Belum Diisi",
//                 "Tuliskan pelajaran atau pengetahuan yang kamu pelajari.",
//                 document.getElementById("jurnal-gemar")
//             );
//             return;
//         }
//         if (!bermasyarakat) {
//             await this.showValidationAlert(
//                 "Jurnal Bermasyarakat Belum Diisi",
//                 'Tuliskan kegiatan bermasyarakat atau "Tidak Ada".',
//                 document.getElementById("jurnal-bermasyarakat")
//             );
//             return;
//         }
//         if (!tidur) {
//             await this.showValidationAlert(
//                 "Jam Tidur Belum Diisi",
//                 "Silakan masukkan jam berapa kamu tidur malam.",
//                 document.getElementById("jurnal-tidur")
//             );
//             return;
//         }
//         // =================================================
//         // CEK JURNAL SUDAH ADA
//         // =================================================
//         try {
//             const {
//                 data: existingJurnal,
//                 error: checkError
//             } =
//                 await window.supabaseClient
//                     .from("jurnal_7_kaih")
//                     .select("id, tanggal")
//                     .eq("username", user.username)
//                     .eq("tanggal", tanggal)
//                     .maybeSingle();
//             if (checkError) {
//                 throw checkError;
//             }
//             // =============================================
//             // JIKA SUDAH ADA
//             // =============================================
//             if (existingJurnal) {
//                 await Swal.fire({
//                     icon: "info",
//                     title: "Jurnal Sudah Diisi",
//                     text:
//                         "Kamu sudah mengisi Jurnal 7 KAIH untuk tanggal tersebut. Jurnal tidak dapat diisi dua kali pada hari yang sama.",
//                     confirmButtonText: "OK",
//                     confirmButtonColor: "#4f46e5",
//                     customClass: {
//                         popup:
//                             "rounded-2xl",
//                         title:
//                             "text-lg font-bold text-slate-800",
//                         htmlContainer:
//                             "text-sm text-slate-600",
//                         confirmButton:
//                             "rounded-xl px-5 py-2.5 font-semibold"
//                     },
//                     buttonsStyling: true
//                 });
//                 return;
//             }
//         }
//         catch (error) {
//             console.error(
//                 "Jurnal7KaihService.review - cek jurnal:",
//                 error
//             );
//             await Swal.fire({
//                 icon: "error",
//                 title: "Gagal Memeriksa Jurnal",
//                 text:
//                     error?.message ||
//                     "Terjadi kesalahan saat memeriksa data jurnal.",
//                 confirmButtonText: "Tutup",
//                 confirmButtonColor: "#dc2626",
//                 customClass: {
//                     popup:
//                         "rounded-2xl",
//                     confirmButton:
//                         "rounded-xl px-5 py-2.5 font-semibold"
//                 }
//             });
//             return;
//         }
//         // =================================================
//         // AMBIL MODAL
//         // =================================================
//         const modal =
//             document.getElementById("modal-review-jurnal");
//         if (!modal) {
//             console.error(
//                 "modal-review-jurnal tidak ditemukan!"
//             );
//             return;
//         }
//         // =================================================
//         // ISI DATA KE MODAL
//         // =================================================
//         const reviewTanggal =
//             document.getElementById("review-tanggal");
//         const reviewBangun =
//             document.getElementById("review-bangun");
//         const reviewIbadah =
//             document.getElementById("review-ibadah");
//         const reviewOlahraga =
//             document.getElementById("review-olahraga");
//         const reviewMakan =
//             document.getElementById("review-makan");
//         const reviewGemar =
//             document.getElementById("review-gemar");
//         const reviewBermasyarakat =
//             document.getElementById("review-bermasyarakat");
//         const reviewTidur =
//             document.getElementById("review-tidur");
//         // =================================================
//         // SET VALUE
//         // =================================================
//         if (reviewTanggal) {
//             reviewTanggal.textContent =
//                 this.formatDateLong(tanggal);
//         }
//         if (reviewBangun) {
//             reviewBangun.textContent =
//                 bangun;
//         }
//         if (reviewIbadah) {
//             reviewIbadah.textContent =
//                 `${ibadah} kali`;
//         }
//         if (reviewOlahraga) {
//             reviewOlahraga.textContent =
//                 `${olahraga} menit`;
//         }
//         if (reviewMakan) {
//             reviewMakan.textContent =
//                 makan;
//         }
//         if (reviewGemar) {
//             reviewGemar.textContent =
//                 gemar;
//         }
//         if (reviewBermasyarakat) {
//             reviewBermasyarakat.textContent =
//                 bermasyarakat;
//         }
//         if (reviewTidur) {
//             reviewTidur.textContent =
//                 tidur;
//         }
//         // =================================================
//         // DEBUG MODAL
//         // =================================================
//         console.log("DATA REVIEW:", {
//             tanggal: reviewTanggal?.textContent,
//             bangun: reviewBangun?.textContent,
//             ibadah: reviewIbadah?.textContent,
//             olahraga: reviewOlahraga?.textContent,
//             makan: reviewMakan?.textContent,
//             gemar: reviewGemar?.textContent,
//             bermasyarakat: reviewBermasyarakat?.textContent,
//             tidur: reviewTidur?.textContent
//         });
//         // =================================================
//         // TAMPILKAN MODAL
//         // =================================================
//         modal.classList.remove("hidden");
//         modal.classList.add("flex");
//         document.body.classList.add("overflow-hidden");
//     },
//     // =====================================================
//     // TUTUP REVIEW
//     // =====================================================
//     closeReview() {
//         const modal =
//             document.getElementById(
//                 "modal-review-jurnal"
//             );
//         if (!modal) {
//             return;
//         }
//         // Sembunyikan modal
//         modal.classList.add("hidden");
//         modal.classList.remove("flex");
//         // Kembalikan scroll halaman
//         document.body.classList.remove(
//             "overflow-hidden"
//         );
//     },
//     // =====================================================
//     // SUBMIT / SIMPAN
//     // =====================================================
//     async submit() {
//         const user =
//             AppState.currentUser;
//         if (!user) {
//             await this.showValidationAlert(
//                 "Data Siswa Tidak Tersedia",
//                 "Data siswa belum tersedia. Silakan login kembali.",
//                 null,
//                 "OK"
//             );
//             return;
//         }
//         // =================================================
//         // AMBIL ELEMENT
//         // =================================================
//         const tanggalEl =
//             document.getElementById(
//                 "jurnal-tanggal"
//             );
//         const bangunEl =
//             document.getElementById(
//                 "jurnal-bangun"
//             );
//         const ibadahEl =
//             document.getElementById(
//                 "jurnal-ibadah"
//             );
//         const olahragaEl =
//             document.getElementById(
//                 "jurnal-olahraga"
//             );
//         const makanEl =
//             document.getElementById(
//                 "jurnal-makan"
//             );
//         const gemarEl =
//             document.getElementById(
//                 "jurnal-gemar"
//             );
//         const bermasyarakatEl =
//             document.getElementById(
//                 "jurnal-bermasyarakat"
//             );
//         const tidurEl =
//             document.getElementById(
//                 "jurnal-tidur"
//             );
//         // =================================================
//         // VALUE
//         // =================================================
//         const tanggal =
//             tanggalEl?.value;
//         const bangun =
//             bangunEl?.value;
//         const ibadahRaw =
//             String(
//                 ibadahEl?.value || ""
//             ).trim();
//         const olahragaRaw =
//             String(
//                 olahragaEl?.value || ""
//             ).trim();
//         const ibadah =
//             ibadahRaw === ""
//                 ? null
//                 : Number(ibadahRaw);
//         const olahraga =
//             olahragaRaw === ""
//                 ? null
//                 : Number(olahragaRaw);
//         const makan =
//             String(
//                 makanEl?.value || ""
//             ).trim();
//         const gemar =
//             String(
//                 gemarEl?.value || ""
//             ).trim();
//         const bermasyarakat =
//             String(
//                 bermasyarakatEl?.value || ""
//             ).trim();
//         const tidur =
//             tidurEl?.value;
//         // =================================================
//         // LOADING BUTTON MODAL
//         // =================================================
//         const button =
//             document.getElementById(
//                 "btn-simpan-review-jurnal"
//             );
//         const originalText =
//             button?.innerHTML;
//         if (button) {
//             button.disabled = true;
//             button.innerHTML = `
//                 <i class="fas fa-spinner fa-spin mr-2"></i>
//                 Menyimpan...
//             `;
//         }
//         try {
//             // =================================================
//             // PAYLOAD
//             // =================================================
//             const payload = {
//                 username:
//                     user.username,
//                 nama_lengkap:
//                     user.nama_lengkap ||
//                     user.nama ||
//                     "",
//                 kategori:
//                     user.kategori ||
//                     "",
//                 tanggal,
//                 bangun,
//                 ibadah,
//                 olahraga,
//                 makan,
//                 gemar,
//                 bermasyarakat,
//                 tidur
//             };
//             // =================================================
//             // INSERT SUPABASE
//             // =================================================
//             const {
//                 data,
//                 error
//             } =
//                 await window.supabaseClient
//                     .from("jurnal_7_kaih")
//                     .insert(payload)
//                     .select()
//                     .single();
//             if (error) {
//                 throw error;
//             }
//             console.log(
//                 "Jurnal berhasil disimpan:",
//                 data
//             );
//             // =================================================
//             // TUTUP MODAL
//             // =================================================
//             this.closeReview();
//             // =================================================
//             // RESET FORM
//             // =================================================
//             this.resetForm();
//             // =================================================
//             // SUCCESS
//             // =================================================
//             await Swal.fire({
//                 icon: "success",
//                 title:
//                     "Jurnal Tersimpan",
//                 text:
//                     "Jurnal 7 KAIH berhasil disimpan.",
//                 timer: 1800,
//                 showConfirmButton: false
//             });
//             // =================================================
//             // LOAD DATA TERBARU
//             // =================================================
//             await this.loadExisting();
//         }
//         catch (error) {
//             console.error(
//                 "Jurnal7KaihService.submit:",
//                 error
//             );
//             // Duplicate unique constraint
//             if (
//                 error?.code === "23505"
//             ) {
//                 await Swal.fire({
//                     icon: "info",
//                     title: "Jurnal Sudah Diisi",
//                     text:
//                         "Jurnal 7 KAIH untuk tanggal tersebut sudah pernah disimpan dan tidak dapat diubah.",
//                     confirmButtonText: "OK",
//                     confirmButtonColor: "#4f46e5",
//                     customClass: {
//                         popup:
//                             "rounded-2xl",
//                         confirmButton:
//                             "rounded-xl px-5 py-2.5 font-semibold"
//                     }
//                 });
//                 this.closeReview();
//                 return;
//             }
//             await Swal.fire({
//                 icon: "error",
//                 title: "Gagal Menyimpan",
//                 text:
//                     error?.message ||
//                     "Terjadi kesalahan saat menyimpan jurnal.",
//                 confirmButtonText:
//                     "Tutup",
//                 confirmButtonColor:
//                     "#dc2626",
//                 customClass: {
//                     popup:
//                         "rounded-2xl",
//                     confirmButton:
//                         "rounded-xl px-5 py-2.5 font-semibold"
//                 }
//             });
//         }
//         finally {
//             if (button) {
//                 button.disabled = false;
//                 button.innerHTML =
//                     originalText ||
//                     `
//                         <i class="fas fa-save mr-2"></i>
//                         Simpan Jurnal
//                     `;
//             }
//         }
//     },
//     // =====================================================
//     // LOAD DATA EXISTING
//     // =====================================================
//     async loadExisting() {
//         const user =
//             AppState.currentUser;
//         const tanggalEl =
//             document.getElementById(
//                 "jurnal-tanggal"
//             );
//         if (
//             !user ||
//             !tanggalEl?.value
//         ) {
//             return;
//         }
//         const tanggal =
//             tanggalEl.value;
//         try {
//             const {
//                 data,
//                 error
//             } =
//                 await window.supabaseClient
//                     .from(
//                         "jurnal_7_kaih"
//                     )
//                     .select(`
//                         id,
//                         username,
//                         nama_lengkap,
//                         kategori,
//                         tanggal,
//                         bangun,
//                         ibadah,
//                         olahraga,
//                         makan,
//                         gemar,
//                         bermasyarakat,
//                         tidur
//                     `)
//                     .eq(
//                         "username",
//                         user.username
//                     )
//                     .eq(
//                         "tanggal",
//                         tanggal
//                     )
//                     .maybeSingle();
//             if (error) {
//                 throw error;
//             }
//             if (!data) {
//                 this.clearForm();
//                 return;
//             }
//             this.fillForm(
//                 data
//             );
//         }
//         catch (error) {
//             console.error(
//                 "Jurnal7KaihService.loadExisting:",
//                 error
//             );
//         }
//     },
//     // =====================================================
//     // FILL FORM
//     // =====================================================
//     fillForm(data) {
//         const set =
//             (id, value) => {
//                 const el =
//                     document.getElementById(
//                         id
//                     );
//                 if (el) {
//                     el.value =
//                         value ?? "";
//                 }
//             };
//         set(
//             "jurnal-bangun",
//             data.bangun
//         );
//         set(
//             "jurnal-ibadah",
//             data.ibadah
//         );
//         set(
//             "jurnal-olahraga",
//             data.olahraga
//         );
//         set(
//             "jurnal-makan",
//             data.makan
//         );
//         set(
//             "jurnal-gemar",
//             data.gemar
//         );
//         set(
//             "jurnal-bermasyarakat",
//             data.bermasyarakat
//         );
//         set(
//             "jurnal-tidur",
//             data.tidur
//         );
//     },
//     // =====================================================
//     // CLEAR FORM
//     // =====================================================
//     clearForm() {
//         const ids = [
//             "jurnal-bangun",
//             "jurnal-ibadah",
//             "jurnal-olahraga",
//             "jurnal-makan",
//             "jurnal-gemar",
//             "jurnal-bermasyarakat",
//             "jurnal-tidur"
//         ];
//         ids.forEach(
//             id => {
//                 const el =
//                     document.getElementById(
//                         id
//                     );
//                 if (el) {
//                     el.value = "";
//                 }
//             }
//         );
//     },
//     // =====================================================
//     // RESET FORM
//     // =====================================================
//     resetForm() {
//         const form =
//             document.getElementById(
//                 "form-jurnal-7-kaih"
//             );
//         if (form) {
//             form.reset();
//         }
//         // Kembalikan tanggal ke hari ini
//         const tanggalEl =
//             document.getElementById(
//                 "jurnal-tanggal"
//             );
//         if (tanggalEl) {
//             tanggalEl.value =
//                 this.getLocalDate();
//         }
//         // Pastikan semua field kosong
//         const ids = [
//             "jurnal-bangun",
//             "jurnal-ibadah",
//             "jurnal-olahraga",
//             "jurnal-makan",
//             "jurnal-gemar",
//             "jurnal-bermasyarakat",
//             "jurnal-tidur"
//         ];
//         ids.forEach(id => {
//             const el =
//                 document.getElementById(id);
//             if (el) {
//                 el.value = "";
//             }
//         });
//     },
//     // =====================================================
//     // VALIDASI TANGGAL
//     // =====================================================
//     isValidJournalDate(
//         tanggal
//     ) {
//         if (!tanggal) {
//             return false;
//         }
//         const today =
//             this.getLocalDate();
//         const yesterday =
//             this.getLocalDate(-1);
//         return (
//             tanggal === today ||
//             tanggal === yesterday
//         );
//     },
//     // =====================================================
//     // LOCAL DATE
//     // =====================================================
//     getLocalDate(
//         offsetDays = 0
//     ) {
//         const date =
//             new Date();
//         date.setHours(
//             0,
//             0,
//             0,
//             0
//         );
//         date.setDate(
//             date.getDate() +
//             offsetDays
//         );
//         const year =
//             date.getFullYear();
//         const month =
//             String(
//                 date.getMonth() + 1
//             ).padStart(
//                 2,
//                 "0"
//             );
//         const day =
//             String(
//                 date.getDate()
//             ).padStart(
//                 2,
//                 "0"
//             );
//         return `${year}-${month}-${day}`;
//     },
//     // =====================================================
//     // FORMAT DATE
//     // =====================================================
//     formatDate(value) {
//         if (!value) {
//             return "-";
//         }
//         const [
//             year,
//             month,
//             day
//         ] =
//             value.split("-");
//         return `${day}/${month}/${year}`;
//     },
//     // =====================================================
//     // FORMAT DATE LONG
//     // =====================================================
//     formatDateLong(value) {
//         if (!value) {
//             return "-";
//         }
//         const [
//             year,
//             month,
//             day
//         ] =
//             value.split("-");
//         const date =
//             new Date(
//                 Number(year),
//                 Number(month) - 1,
//                 Number(day)
//             );
//         return date.toLocaleDateString(
//             "id-ID",
//             {
//                 day: "numeric",
//                 month: "long",
//                 year: "numeric"
//             }
//         );
//     }
// };

const JURNAL_START_DATE = "2026-08-25";
const Jurnal7KaihService = {
    // =====================================================
    // DATA
    // =====================================================
    calendarDate: new Date(),
    journals: [],
    // =====================================================
    // CEK APAKAH SISWA WAJIB JURNAL 7 KAIH
    // =====================================================
    isJurnalWajib() {
        const user = AppState.currentUser;
        if (!user) {
            return false;
        }
        const kategori =
            String(user.kategori || "")
                .trim()
                .toUpperCase();
        // Hanya kelas X yang wajib
        return kategori.startsWith("X ");
    },
    // =====================================================
    // HIDE 7 KAIH UNTUK KELAS XI
    // =====================================================
    updateJurnalMenuVisibility() {
        const menu =
            document.getElementById(
                "menu-jurnal-7-kaih"
            );
        if (!menu) {
            return;
        }
        const wajib =
            this.isJurnalWajib();
        menu.classList.toggle(
            "hidden",
            !wajib
        );
    },
    // =====================================================
    // INIT
    // =====================================================
    async init() {
        const user = AppState.currentUser;
        if (!user) {
            console.warn(
                "Jurnal7KaihService: user belum tersedia"
            );
            return;
        }
        // =================================================
        // CEK KEWAJIBAN JURNAL
        // =================================================
        if (!this.isJurnalWajib()) {
            console.log(
                "Jurnal 7 KAIH tidak wajib untuk:",
                user.kategori
            );
            return;
        }
        this.updateJurnalMenuVisibility();
        this.setupTanggal();
        this.setupForm();
        await this.loadDashboard();
    },
    // =====================================================
    // SETUP TANGGAL
    // =====================================================
    setupTanggal() {
        const tanggalEl =
            document.getElementById(
                "jurnal-tanggal"
            );
        if (!tanggalEl) {
            return;
        }
        const today =
            this.getLocalDate();
        // Jurnal hanya boleh dimulai dari tanggal resmi
        tanggalEl.min =
            JURNAL_START_DATE;
        // Tidak boleh memilih tanggal masa depan
        tanggalEl.max =
            today;
        if (!tanggalEl.value) {
            tanggalEl.value =
                today;
        }
    },
    // =====================================================
    // SETUP FORM
    // =====================================================
    setupForm() {
        const form =
            document.getElementById(
                "form-jurnal-7-kaih"
            );
        if (!form) {
            return;
        }
        form.onsubmit =
            async event => {
                event.preventDefault();
                await this.review();
            };
    },
    // =====================================================
    // LOAD DASHBOARD
    // =====================================================
    async loadDashboard() {
        const user =
            AppState.currentUser;
        if (!user) {
            return;
        }
        try {
            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("jurnal_7_kaih")
                    .select(`
                        id,
                        username,
                        nama_lengkap,
                        kategori,
                        tanggal,
                        bangun,
                        ibadah,
                        olahraga,
                        makan,
                        gemar,
                        bermasyarakat,
                        tidur
                    `)
                    .eq(
                        "username",
                        user.username
                    )
                    .order(
                        "tanggal",
                        {
                            ascending: false
                        }
                    );
            if (error) {
                throw error;
            }
            this.journals =
                data || [];
            this.renderDashboard();
        }
        catch (error) {
            console.error(
                "Jurnal7KaihService.loadDashboard:",
                error
            );
            await Swal.fire({
                icon: "error",
                title:
                    "Gagal Memuat Jurnal",
                text:
                    error?.message ||
                    "Data jurnal tidak dapat dimuat.",
                confirmButtonText:
                    "Tutup",
                confirmButtonColor:
                    "#dc2626"
            });
        }
    },
    // =====================================================
    // RENDER DASHBOARD
    // =====================================================
    renderDashboard() {
        this.renderStatistics();
        this.renderTodayStatus();
        this.renderCalendar();
        this.renderHistory();
    },
    // =====================================================
    // STATISTICS
    // =====================================================
    renderStatistics() {
        const totalEl =
            document.getElementById(
                "jurnal-total"
            );
        const streakEl =
            document.getElementById(
                "jurnal-streak"
            );
        if (totalEl) {
            totalEl.textContent =
                this.journals.length;
        }
        if (streakEl) {
            const streak =
                this.calculateStreak();
            streakEl.textContent =
                `${streak} hari`;
        }
    },
    // =====================================================
    // STATUS HARI INI
    // =====================================================
    renderTodayStatus() {
        const container =
            document.getElementById(
                "jurnal-status-hari-ini"
            );
        if (!container) {
            return;
        }
        const today =
            this.getLocalDate();
        const journal =
            this.journals.find(
                item =>
                    item.tanggal === today
            );
        if (journal) {
            container.innerHTML = `
                <div class="flex items-start gap-4">
                    <div
                        class="w-12 h-12 rounded-xl
                               bg-emerald-100
                               flex items-center
                               justify-center shrink-0"
                    >
                        <i
                            class="fas fa-check
                                   text-emerald-600"
                        ></i>
                    </div>
                    <div class="flex-1">
                        <p
                            class="text-xs
                                   text-emerald-600
                                   font-semibold"
                        >
                            JURNAL HARI INI
                        </p>
                        <h3
                            class="font-bold
                                   text-slate-800 mt-1"
                        >
                            🎉 Jurnal sudah selesai!
                        </h3>
                        <p
                            class="text-sm
                                   text-slate-500 mt-1"
                        >
                            ${this.formatDateLong(today)}
                        </p>
                        <div
                            class="flex flex-wrap
                                   gap-3 mt-4
                                   text-sm"
                        >
                            <span>
                                🌅 ${journal.bangun || "-"}
                            </span>
                            <span>
                                🙏 ${journal.ibadah ?? 0}x
                            </span>
                            <span>
                                🏃 ${journal.olahraga ?? 0} menit
                            </span>
                        </div>
                        <button
                            type="button"
                            onclick="Jurnal7KaihService.openDetailById('${journal.id}')"
                            class="mt-4 text-sm
                                   font-semibold
                                   text-indigo-600
                                   hover:text-indigo-700"
                        >
                            <i class="fas fa-eye mr-1"></i>
                            Lihat Jurnal
                        </button>
                        <span>
                            <button
                            type="button"
                            onclick="Jurnal7KaihService.openForm()"
                            class="mt-4 bg-indigo-600
                                hover:bg-indigo-700
                                text-white
                                font-semibold
                                rounded-xl px-4 py-2.5"
                                >
                            <i class="fas fa-plus mr-2"></i>
                            Isi Jurnal
                            </button>
                        </span>
                    </div>
                </div>
            `;
            return;
        }
        // BELUM ADA
        container.innerHTML = `
            <div class="flex items-start gap-4">
                <div
                    class="w-12 h-12 rounded-xl
                           bg-indigo-100
                           flex items-center
                           justify-center shrink-0"
                >
                    <i
                        class="fas fa-pen
                               text-indigo-600"
                    ></i>
                </div>
                <div class="flex-1">
                    <p
                        class="text-xs
                               text-indigo-600
                               font-semibold"
                    >
                        JURNAL HARI INI
                    </p>
                    <h3
                        class="font-bold
                               text-slate-800 mt-1"
                    >
                        🌱 Saatnya mengisi jurnal
                    </h3>
                    <p
                        class="text-sm
                               text-slate-500 mt-1"
                    >
                        Kamu belum mengisi
                        Jurnal 7 KAIH hari ini.
                    </p>
                    <button
                        type="button"
                        onclick="Jurnal7KaihService.openForm()"
                        class="mt-4 bg-indigo-600
                               hover:bg-indigo-700
                               text-white
                               font-semibold
                               rounded-xl px-4 py-2.5"
                    >
                        <i class="fas fa-plus mr-2"></i>
                        Isi Jurnal Hari Ini
                    </button>
                </div>
            </div>
        `;
    },
    // =====================================================
    // HISTORY
    // =====================================================
    renderHistory() {
        const container =
            document.getElementById(
                "jurnal-history"
            );
        if (!container) {
            return;
        }
        // =====================================================
        // BELUM ADA JURNAL
        // =====================================================
        if (!this.journals.length) {
            container.innerHTML = `
                <div
                    class="text-center
                        py-8
                        text-slate-400"
                >
                    <div class="text-4xl mb-3">
                        📖
                    </div>
                    <p class="font-medium">
                        Belum ada jurnal
                    </p>
                    <p
                        class="text-xs mt-1"
                    >
                        Yuk mulai jurnal pertamamu!
                    </p>
                </div>
            `;
            return;
        }
        // =====================================================
        // AMBIL 5 JURNAL TERBARU
        // =====================================================
        const latestJournals =
            [...this.journals]
                .sort(
                    (a, b) =>
                        new Date(b.tanggal) -
                        new Date(a.tanggal)
                )
                .slice(0, 5);
        // =====================================================
        // RENDER
        // =====================================================
        container.innerHTML =
            latestJournals
                .map(
                    journal => `
                        <div
                            class="
                                border
                                rounded-2xl
                                p-4
                                hover:bg-slate-50
                                transition
                            "
                        >
                            <!-- HEADER -->
                            <div
                                class="
                                    flex
                                    items-start
                                    justify-between
                                    gap-3
                                "
                            >
                                <div>
                                    <p
                                        class="
                                            font-bold
                                            text-slate-800
                                        "
                                    >
                                        ${this.formatDateLong(
                                            journal.tanggal
                                        )}
                                    </p>
                                    <div
                                        class="
                                            flex
                                            flex-wrap
                                            gap-3
                                            mt-2
                                            text-xs
                                            text-slate-500
                                        "
                                    >
                                        <span>
                                            🌅
                                            ${journal.bangun || "-"}
                                        </span>
                                        <span>
                                            🙏
                                            ${journal.ibadah ?? 0}x
                                        </span>
                                        <span>
                                            🏃
                                            ${journal.olahraga ?? 0}
                                            menit
                                        </span>
                                    </div>
                                </div>
                                <!-- STATUS -->
                                <span
                                    class="
                                        text-xs
                                        font-semibold
                                        text-emerald-600
                                        bg-emerald-50
                                        px-2.5
                                        py-1
                                        rounded-full
                                        shrink-0
                                    "
                                >
                                    ✓ Selesai
                                </span>
                            </div>
                            <!-- RINGKASAN MAKAN -->
                            <div
                                class="
                                    mt-3
                                    text-sm
                                    text-slate-500
                                    line-clamp-2
                                "
                            >
                                ${
                                    journal.makan ||
                                    "Tidak ada catatan makan."
                                }
                            </div>
                            <!-- DETAIL -->
                            <button
                                type="button"
                                onclick="Jurnal7KaihService.openDetailById('${journal.id}')"
                                class="
                                    mt-3
                                    text-sm
                                    font-semibold
                                    text-indigo-600
                                    hover:text-indigo-700
                                    transition
                                "
                            >
                                Lihat Detail
                                <i
                                    class="
                                        fas
                                        fa-arrow-right
                                        ml-1
                                    "
                                ></i>
                            </button>
                        </div>
                    `
                )
                .join("");
    },
    // =====================================================
    // CALENDAR
    // =====================================================
    renderCalendar() {
        const container =
            document.getElementById(
                "jurnal-calendar"
            );
        const title =
            document.getElementById(
                "jurnal-calendar-title"
            );
        if (!container) {
            return;
        }
        // =====================================================
        // BULAN YANG SEDANG DITAMPILKAN
        // =====================================================
        const current =
            this.calendarDate;
        const year =
            current.getFullYear();
        const month =
            current.getMonth();
        // =====================================================
        // TITLE BULAN
        // =====================================================
        if (title) {
            title.textContent =
                current.toLocaleDateString(
                    "id-ID",
                    {
                        month: "long",
                        year: "numeric"
                    }
                );
        }
        // =====================================================
        // INFORMASI HARI
        // =====================================================
        const firstDay =
            new Date(
                year,
                month,
                1
            ).getDay();
        const totalDays =
            new Date(
                year,
                month + 1,
                0
            ).getDate();
        const dayNames = [
            "Min",
            "Sen",
            "Sel",
            "Rab",
            "Kam",
            "Jum",
            "Sab"
        ];
        let html = "";
        // =====================================================
        // NAMA HARI
        // =====================================================
        dayNames.forEach(
            day => {
                html += `
                    <div
                        class="
                            text-center
                            text-xs
                            font-semibold
                            text-slate-400
                            py-1
                        "
                    >
                        ${day}
                    </div>
                `;
            }
        );
        // =====================================================
        // KOSONG SEBELUM TANGGAL 1
        // =====================================================
        for (
            let i = 0;
            i < firstDay;
            i++
        ) {
            html += `
                <div></div>
            `;
        }
        // =====================================================
        // TANGGAL
        // =====================================================
        const today =
            this.getLocalDate();
        for (
            let day = 1;
            day <= totalDays;
            day++
        ) {
            const date =
                `${year}-${String(
                    month + 1
                ).padStart(2, "0")}-${String(
                    day
                ).padStart(2, "0")}`;
            // =================================================
            // CEK HARI
            // =================================================
            const dateObj =
                new Date(
                    year,
                    month,
                    day
                );
            const dayOfWeek =
                dateObj.getDay();
            // 0 = Minggu
            const isSunday =
                dayOfWeek === 0;
            // =================================================
            // CARI JURNAL
            // =================================================
            const journal =
                this.journals.find(
                    item =>
                        item.tanggal === date
                );
            // =================================================
            // CEK HARI INI
            // =================================================
            const isToday =
                date ===
                this.getLocalDate();
            // =================================================
            // STATUS
            // =================================================
            let status =
                "⚪";
            if (isSunday) {
                status =
                    "🔵";
            }
            else if (journal) {
                status =
                    "🟢";
            }
            else if (isToday) {
                status =
                    "🟡";
            }
            // =================================================
            // STYLE
            // =================================================
            let buttonClass = "";
            if (isSunday) {
                buttonClass = `
                    bg-indigo-50
                    border
                    border-indigo-100
                    text-indigo-400
                    cursor-default
                `;
            }
            else if (journal) {
                buttonClass = `
                    bg-emerald-50
                    hover:bg-emerald-100
                    cursor-pointer
                `;
            }
            else if (isToday) {
                buttonClass = `
                    bg-yellow-50
                    hover:bg-yellow-100
                    cursor-pointer
                `;
            }
            else {
                buttonClass = `
                    bg-slate-50
                    hover:bg-slate-100
                    cursor-pointer
                `;
            }
            // =================================================
            // ONCLICK
            // =================================================
            const onclick =
                !isSunday && journal
                    ? `onclick="Jurnal7KaihService.openDetailById('${journal.id}')"`
                    : "";
            // =================================================
            // RENDER
            // =================================================
            html += `
                <button
                    type="button"
                    ${onclick}
                    ${isSunday ? "disabled" : ""}
                    class="
                        aspect-square
                        rounded-xl
                        flex
                        flex-col
                        items-center
                        justify-center
                        text-xs
                        transition
                        ${buttonClass}
                    "
                >
                    <span
                        class="
                            font-semibold
                            ${isSunday
                                ? "text-indigo-400"
                                : "text-slate-700"
                            }
                        "
                    >
                        ${day}
                    </span>
                    <span
                        class="text-xs mt-1"
                    >
                        ${status}
                    </span>
                    ${
                        isSunday
                            ? `
                                <span
                                    class="
                                        text-[9px]
                                        text-indigo-400
                                        mt-0.5
                                    "
                                >
                                    Libur
                                </span>
                            `
                            : ""
                    }
                </button>
            `;
        }
        container.innerHTML =
            html;
        // =====================================================
        // UPDATE BUTTON NAVIGASI
        // =====================================================
        this.updateCalendarNavigation();
    },
    // =====================================================
    // BULAN BERIKUTNYA
    // =====================================================
    nextMonth() {
        const today =
            new Date();
        const currentMonth =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );
        const nextMonth =
            new Date(
                this.calendarDate.getFullYear(),
                this.calendarDate.getMonth() + 1,
                1
            );
        // Jangan boleh melewati bulan sekarang
        if (nextMonth > currentMonth) {
            return;
        }
        this.calendarDate =
            nextMonth;
        this.renderCalendar();
    },
    // =====================================================
    // BULAN SEBELUMNYA
    // =====================================================
    previousMonth() {
        this.calendarDate =
            new Date(
                this.calendarDate.getFullYear(),
                this.calendarDate.getMonth() - 1,
                1
            );
        this.renderCalendar();
    },
    // =====================================================
    // UPDATE BULAN
    // =====================================================
    updateCalendarNavigation() {
        const buttons =
            document.querySelectorAll(
                '[onclick="Jurnal7KaihService.previousMonth()"], ' +
                '[onclick="Jurnal7KaihService.nextMonth()"]'
            );
        if (buttons.length < 2) {
            return;
        }
        const previousButton =
            buttons[0];
        const nextButton =
            buttons[1];
        const today =
            new Date();
        const currentMonth =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );
        const calendarMonth =
            new Date(
                this.calendarDate.getFullYear(),
                this.calendarDate.getMonth(),
                1
            );
        // =====================================================
        // NEXT
        // =====================================================
        if (
            calendarMonth >=
            currentMonth
        ) {
            nextButton.disabled =
                true;
            nextButton.classList.add(
                "opacity-40",
                "cursor-not-allowed"
            );
            nextButton.classList.remove(
                "hover:bg-slate-200"
            );
        }
        else {
            nextButton.disabled =
                false;
            nextButton.classList.remove(
                "opacity-40",
                "cursor-not-allowed"
            );
            nextButton.classList.add(
                "hover:bg-slate-200"
            );
        }
    },
    // =====================================================
    // CALCULATE STREAK
    // =====================================================
    calculateStreak() {
        if (!this.journals.length) {
            return 0;
        }
        // =================================================
        // AMBIL TANGGAL JURNAL
        // =================================================
        const dates =
            new Set(
                this.journals
                    .map(
                        item =>
                            item.tanggal
                    )
            );
        // =================================================
        // MULAI DARI HARI INI
        // =================================================
        let current =
            new Date();
        current.setHours(
            0,
            0,
            0,
            0
        );
        let streak = 0;
        // =================================================
        // JIKA HARI INI MINGGU
        // =================================================
        if (current.getDay() === 0) {

            current.setDate(
                current.getDate() - 1
            );
        }
        // =================================================
        // JIKA HARI INI BELUM ADA JURNAL
        // =================================================
        const today =
            this.getLocalDate();
        const todayHasJournal =
            dates.has(today);
        if (
            !todayHasJournal &&
            current.getDay() !== 0
        ) {
            current.setDate(
                current.getDate() - 1
            );
        }
        // =================================================
        // HITUNG STREAK
        // =================================================
        while (true) {
            // -------------------------------------------------
            // MINGGU = LIBUR
            // Lewati tanpa menambah streak
            // -------------------------------------------------
            if (current.getDay() === 0) {
                current.setDate(
                    current.getDate() - 1
                );
                continue;
            }
            // -------------------------------------------------
            // FORMAT TANGGAL
            // -------------------------------------------------
            const expected =
                this.formatDateISO(
                    current
                );
            // -------------------------------------------------
            // CEK JURNAL
            // -------------------------------------------------
            if (!dates.has(expected)) {
                break;
            }
            // -------------------------------------------------
            // JURNAL ADA
            // -------------------------------------------------
            streak++;
            // -------------------------------------------------
            // MUNDUR 1 HARI
            // -------------------------------------------------
            current.setDate(
                current.getDate() - 1
            );
        }
        return streak;
    },
    // =====================================================
    // OPEN FORM
    // =====================================================
    async openForm() {
        const dashboard =
            document.getElementById(
                "jurnal-dashboard"
            );
        const formContainer =
            document.getElementById(
                "jurnal-form-container"
            );
        if (!dashboard || !formContainer) {
            return;
        }
        this.setupTanggal();
        const tanggalEl =
            document.getElementById(
                "jurnal-tanggal"
            );
        if (tanggalEl) {
            tanggalEl.value =
                this.getLocalDate();
        }
        this.clearForm();
        dashboard.classList.add(
            "hidden"
        );
        formContainer.classList.remove(
            "hidden"
        );
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    },
    // =====================================================
    // CLOSE FORM
    // =====================================================
    async closeForm() {
        const dashboard =
            document.getElementById(
                "jurnal-dashboard"
            );
        const formContainer =
            document.getElementById(
                "jurnal-form-container"
            );
        if (!dashboard || !formContainer) {
            return;
        }
        formContainer.classList.add(
            "hidden"
        );
        dashboard.classList.remove(
            "hidden"
        );
        await this.loadDashboard();
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    },
    // =====================================================
    // CEK HARI MINGGU
    // =====================================================
    isSunday(tanggal) {
        if (!tanggal) {
            return false;
        }
        // Hindari masalah timezone
        const [year, month, day] =
            tanggal.split("-").map(Number);
        const date =
            new Date(
                year,
                month - 1,
                day
            );
        return date.getDay() === 0;
    },
    // =====================================================
    // REVIEW
    // =====================================================
    async review() {
        const user =
            AppState.currentUser;
        if (!user) {
            await Swal.fire({
                icon: "error",
                title:
                    "Data Siswa Tidak Ditemukan",
                text:
                    "Silakan login kembali.",
                confirmButtonText:
                    "OK",
                confirmButtonColor:
                    "#4f46e5"
            });
            return;
        }
        const tanggalEl =
            document.getElementById(
                "jurnal-tanggal"
            );
        const bangunEl =
            document.getElementById(
                "jurnal-bangun"
            );
        const ibadahEl =
            document.getElementById(
                "jurnal-ibadah"
            );
        const olahragaEl =
            document.getElementById(
                "jurnal-olahraga"
            );
        const makanEl =
            document.getElementById(
                "jurnal-makan"
            );
        const gemarEl =
            document.getElementById(
                "jurnal-gemar"
            );
        const bermasyarakatEl =
            document.getElementById(
                "jurnal-bermasyarakat"
            );
        const tidurEl =
            document.getElementById(
                "jurnal-tidur"
            );
        const tanggal =
            tanggalEl?.value || "";
        const bangun =
            bangunEl?.value || "";
        const ibadahRaw =
            String(
                ibadahEl?.value || ""
            ).trim();
        const olahragaRaw =
            String(
                olahragaEl?.value || ""
            ).trim();
        const ibadah =
            ibadahRaw === ""
                ? null
                : Number(ibadahRaw);
        const olahraga =
            olahragaRaw === ""
                ? null
                : Number(olahragaRaw);
        const makan =
            String(
                makanEl?.value || ""
            ).trim();
        const gemar =
            String(
                gemarEl?.value || ""
            ).trim();
        const bermasyarakat =
            String(
                bermasyarakatEl?.value || ""
            ).trim();
        const tidur =
            tidurEl?.value || "";
        // =================================================
        // VALIDASI TANGGAL
        // =================================================
        if (!this.isValidJournalDate(tanggal)) {
            await Swal.fire({
                icon: "warning",
                title: "Tanggal Jurnal Tidak Valid",
                html: `
                    <div class="text-sm text-slate-600 leading-relaxed">
                        Jurnal hanya dapat diisi mulai:
                        <div class="mt-3
                                    bg-indigo-50
                                    text-indigo-700
                                    rounded-xl
                                    px-4
                                    py-3
                                    font-semibold">
                            📅 24 Agustus 2026
                        </div>
                        <p class="mt-3">
                            Kamu tetap dapat mengisi jurnal
                            pada tanggal sebelumnya yang belum diisi.
                        </p>
                    </div>
                `,
                confirmButtonText:
                    "Pilih Tanggal",
                confirmButtonColor:
                    "#4f46e5",
                allowOutsideClick:
                    false,
                customClass: {
                    popup:
                        "rounded-2xl",
                    title:
                        "text-lg font-bold text-slate-800",
                    confirmButton:
                        "rounded-xl px-5 py-2.5 font-semibold"
                }
            });
            tanggalEl?.focus();
            return;
        }
        // =================================================
        // VALIDASI HARI MINGGU
        // =================================================
        if (this.isSunday(tanggal)) {
            await Swal.fire({
                icon: "info",
                title: "Jurnal Tidak Perlu Diisi",
                html: `
                    <div class="text-sm text-slate-600 leading-relaxed">
                        <p>
                            Tanggal yang kamu pilih adalah
                            <strong>hari Minggu</strong>.
                        </p>
                        <div
                            class="mt-4
                                bg-indigo-50
                                text-indigo-700
                                rounded-xl
                                px-4
                                py-3"
                        >
                            📅 Hari Minggu tidak perlu mengisi
                            Jurnal 7 KAIH.
                        </div>
                        <p class="mt-3">
                            Silakan pilih tanggal lain.
                        </p>
                    </div>
                `,
                confirmButtonText:
                    "Pilih Tanggal",
                confirmButtonColor:
                    "#4f46e5",
                allowOutsideClick:
                    false,
                allowEscapeKey:
                    true,
                customClass: {
                    popup:
                        "rounded-2xl",
                    title:
                        "text-lg font-bold text-slate-800",
                    confirmButton:
                        "rounded-xl px-5 py-2.5 font-semibold"
                },
                buttonsStyling: true
            });
            tanggalEl?.focus();
            // Scroll kembali ke tanggal
            setTimeout(() => {
                tanggalEl?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }, 100);
            return;
        }
        // =================================================
        // VALIDASI
        // =================================================
        if (!bangun) {
            await this.showValidationAlert(
                "Jam Bangun Belum Diisi",
                "Silakan masukkan jam berapa kamu bangun pagi.",
                bangunEl
            );
            return;
        }
        if (
            ibadah === null ||
            !Number.isInteger(ibadah) ||
            ibadah < 0
        ) {
            await this.showValidationAlert(
                "Data Ibadah Belum Valid",
                "Silakan masukkan jumlah ibadah dalam bentuk angka.",
                ibadahEl
            );
            return;
        }
        if (
            olahraga === null ||
            !Number.isInteger(olahraga) ||
            olahraga < 0
        ) {
            await this.showValidationAlert(
                "Data Olahraga Belum Valid",
                "Silakan masukkan durasi olahraga dalam satuan menit.",
                olahragaEl
            );
            return;
        }
        if (!makan) {
            await this.showValidationAlert(
                "Jurnal Makan Belum Diisi",
                "Tuliskan makanan dan minuman sehat yang kamu konsumsi.",
                makanEl
            );
            return;
        }
        if (!gemar) {
            await this.showValidationAlert(
                "Jurnal Gemar Belum Diisi",
                "Tuliskan pelajaran atau pengetahuan yang kamu pelajari.",
                gemarEl
            );
            return;
        }
        if (!bermasyarakat) {
            await this.showValidationAlert(
                "Jurnal Bermasyarakat Belum Diisi",
                'Tuliskan kegiatan bermasyarakat atau "Tidak Ada".',
                bermasyarakatEl
            );
            return;
        }
        if (!tidur) {
            await this.showValidationAlert(
                "Jam Tidur Belum Diisi",
                "Silakan masukkan jam berapa kamu tidur malam.",
                tidurEl
            );
            return;
        }
        // =================================================
        // CEK DUPLIKAT
        // =================================================
        try {
            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("jurnal_7_kaih")
                    .select("id")
                    .eq(
                        "username",
                        user.username
                    )
                    .eq(
                        "tanggal",
                        tanggal
                    )
                    .maybeSingle();
            if (error) {
                throw error;
            }
            if (data) {
                await Swal.fire({
                    icon: "info",
                    title:
                        "Jurnal Sudah Diisi",
                    text:
                        "Kamu sudah mengisi Jurnal 7 KAIH untuk tanggal tersebut. Jurnal tidak dapat diisi dua kali pada hari yang sama.",
                    confirmButtonText:
                        "OK",
                    confirmButtonColor:
                        "#4f46e5"
                });
                return;
            }
        }
        catch (error) {
            console.error(
                "Cek jurnal:",
                error
            );
            await Swal.fire({
                icon: "error",
                title:
                    "Gagal Memeriksa Jurnal",
                text:
                    error?.message ||
                    "Terjadi kesalahan.",
                confirmButtonText:
                    "Tutup",
                confirmButtonColor:
                    "#dc2626"
            });
            return;
        }
        // =================================================
        // ISI MODAL REVIEW
        // =================================================
        document.getElementById(
            "review-tanggal"
        ).textContent =
            this.formatDateLong(
                tanggal
            );
        document.getElementById(
            "review-bangun"
        ).textContent =
            bangun;
        document.getElementById(
            "review-ibadah"
        ).textContent =
            `${ibadah} kali`;
        document.getElementById(
            "review-olahraga"
        ).textContent =
            `${olahraga} menit`;
        document.getElementById(
            "review-makan"
        ).textContent =
            makan;
        document.getElementById(
            "review-gemar"
        ).textContent =
            gemar;
        document.getElementById(
            "review-bermasyarakat"
        ).textContent =
            bermasyarakat;
        document.getElementById(
            "review-tidur"
        ).textContent =
            tidur;
        // =================================================
        // SHOW MODAL
        // =================================================
        const modal =
            document.getElementById(
                "modal-review-jurnal"
            );
        if (!modal) {
            return;
        }
        modal.classList.remove(
            "hidden"
        );
        modal.classList.add(
            "flex"
        );
        document.body.classList.add(
            "overflow-hidden"
        );
    },
    // =====================================================
    // CLOSE REVIEW
    // =====================================================
    closeReview() {
        const modal =
            document.getElementById(
                "modal-review-jurnal"
            );
        if (!modal) {
            return;
        }
        modal.classList.add(
            "hidden"
        );
        modal.classList.remove(
            "flex"
        );
        document.body.classList.remove(
            "overflow-hidden"
        );
    },
    // =====================================================
    // SUBMIT
    // =====================================================
    async submit() {
        const user =
            AppState.currentUser;
        if (!user) {
            return;
        }
        const tanggal =
            document.getElementById(
                "jurnal-tanggal"
            )?.value;
        const payload = {
            username:
                user.username,
            nama_lengkap:
                user.nama_lengkap ||
                user.nama ||
                "",
            kategori:
                user.kategori ||
                "",
            tanggal,
            bangun:
                document.getElementById(
                    "jurnal-bangun"
                )?.value,
            ibadah:
                Number(
                    document.getElementById(
                        "jurnal-ibadah"
                    )?.value
                ),
            olahraga:
                Number(
                    document.getElementById(
                        "jurnal-olahraga"
                    )?.value
                ),
            makan:
                document.getElementById(
                    "jurnal-makan"
                )?.value.trim(),
            gemar:
                document.getElementById(
                    "jurnal-gemar"
                )?.value.trim(),
            bermasyarakat:
                document.getElementById(
                    "jurnal-bermasyarakat"
                )?.value.trim(),
            tidur:
                document.getElementById(
                    "jurnal-tidur"
                )?.value
        };
        const button =
            document.getElementById(
                "btn-simpan-review-jurnal"
            );
        const originalText =
            button?.innerHTML;
        if (button) {
            button.disabled = true;
            button.innerHTML = `
                <i class="fas fa-spinner fa-spin mr-2"></i>
                Menyimpan...
            `;
        }
        try {
            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("jurnal_7_kaih")
                    .insert(payload)
                    .select()
                    .single();
            if (error) {
                throw error;
            }
            console.log(
                "Jurnal berhasil disimpan:",
                data
            );
            // Tutup modal
            this.closeReview();
            // Reset form
            this.resetForm();
            // Kembali dashboard
            await this.closeForm();
            await Swal.fire({
                icon: "success",
                title:
                    "Jurnal Tersimpan 🎉",
                text:
                    "Jurnal 7 KAIH berhasil disimpan.",
                timer: 1800,
                showConfirmButton: false
            });
        }
        catch (error) {
            console.error(
                "Jurnal7KaihService.submit:",
                error
            );
            if (
                error?.code === "23505"
            ) {
                await Swal.fire({
                    icon: "info",
                    title:
                        "Jurnal Sudah Diisi",
                    text:
                        "Jurnal untuk tanggal tersebut sudah pernah disimpan.",
                    confirmButtonText:
                        "OK",
                    confirmButtonColor:
                        "#4f46e5"
                });
                this.closeReview();
                return;
            }
            await Swal.fire({
                icon: "error",
                title:
                    "Gagal Menyimpan",
                text:
                    error?.message ||
                    "Terjadi kesalahan saat menyimpan jurnal.",
                confirmButtonText:
                    "Tutup",
                confirmButtonColor:
                    "#dc2626"
            });
        }
        finally {
            if (button) {
                button.disabled = false;
                button.innerHTML =
                    originalText ||
                    `
                        <i class="fas fa-save mr-2"></i>
                        Simpan Jurnal
                    `;
            }
        }
    },
    // =====================================================
    // RESET FORM
    // =====================================================
    resetForm() {
        const form =
            document.getElementById(
                "form-jurnal-7-kaih"
            );
        if (form) {
            form.reset();
        }
        const tanggalEl =
            document.getElementById(
                "jurnal-tanggal"
            );
        if (tanggalEl) {
            tanggalEl.value =
                this.getLocalDate();
        }
    },
    // =====================================================
    // CLEAR FORM
    // =====================================================
    clearForm() {
        const ids = [
            "jurnal-bangun",
            "jurnal-ibadah",
            "jurnal-olahraga",
            "jurnal-makan",
            "jurnal-gemar",
            "jurnal-bermasyarakat",
            "jurnal-tidur"
        ];
        ids.forEach(
            id => {
                const el =
                    document.getElementById(id);
                if (el) {
                    el.value = "";
                }
            }
        );
    },
    // =====================================================
    // OPEN DETAIL JURNAL
    // =====================================================
    openDetailById(id) {
        const journal =
            this.journals.find(
                item =>
                    String(item.id) ===
                    String(id)
            );
        // =================================================
        // DATA TIDAK DITEMUKAN
        // =================================================
        if (!journal) {
            console.warn(
                "Jurnal tidak ditemukan:",
                id
            );
            return;
        }
        console.log(
            "Detail jurnal:",
            journal
        );
        // =================================================
        // HELPER SET TEXT
        // =================================================
        const setText = (
            elementId,
            value
        ) => {
            const element =
                document.getElementById(
                    elementId
                );
            if (!element) {
                console.warn(
                    `Element #${elementId} tidak ditemukan.`
                );
                return;
            }
            element.textContent =
                value ?? "-";
        };
        // =================================================
        // TANGGAL
        // =================================================
        setText(
            "detail-jurnal-tanggal",
            this.formatDateLong(
                journal.tanggal
            )
        );
        // =================================================
        // BANGUN
        // =================================================
        setText(
            "detail-jurnal-bangun",
            journal.bangun || "-"
        );
        // =================================================
        // IBADAH
        // =================================================
        setText(
            "detail-jurnal-ibadah",
            journal.ibadah !== null &&
            journal.ibadah !== undefined
                ? `${journal.ibadah} kali`
                : "-"
        );
        // =================================================
        // OLAHRAGA
        // =================================================
        setText(
            "detail-jurnal-olahraga",
            journal.olahraga !== null &&
            journal.olahraga !== undefined
                ? `${journal.olahraga} menit`
                : "-"
        );
        // =================================================
        // MAKAN
        // =================================================
        setText(
            "detail-jurnal-makan",
            journal.makan || "-"
        );
        // =================================================
        // GEMAR
        // =================================================
        setText(
            "detail-jurnal-gemar",
            journal.gemar || "-"
        );
        // =================================================
        // BERMASYARAKAT
        // =================================================
        setText(
            "detail-jurnal-bermasyarakat",
            journal.bermasyarakat || "-"
        );
        // =================================================
        // TIDUR
        // =================================================
        setText(
            "detail-jurnal-tidur",
            journal.tidur || "-"
        );
        // =================================================
        // MODAL
        // =================================================
        const modal =
            document.getElementById(
                "modal-detail-jurnal"
            );
        if (!modal) {
            console.error(
                "Modal #modal-detail-jurnal tidak ditemukan."
            );
            return;
        }
        // =================================================
        // TAMPILKAN MODAL
        // =================================================
        modal.classList.remove(
            "hidden"
        );
        modal.classList.add(
            "flex"
        );
        // Lock scroll halaman
        document.body.classList.add(
            "overflow-hidden"
        );
    },
    // =====================================================
    // CLOSE DETAIL
    // =====================================================
    closeDetail() {
        const modal =
            document.getElementById(
                "modal-detail-jurnal"
            );
        if (!modal) {
            return;
        }
        modal.classList.add("hidden");
        modal.classList.remove("flex");
        document.body.classList.remove(
            "overflow-hidden"
        );
    },
    // =====================================================
    // VALIDATION ALERT
    // =====================================================
    async showValidationAlert(
        title,
        text,
        element = null,
        buttonText = "Isi Sekarang"
    ) {
        await Swal.fire({
            icon: "warning",
            title,
            text,
            confirmButtonText:
                buttonText,
            confirmButtonColor:
                "#4f46e5",
            allowOutsideClick:
                false,
            allowEscapeKey:
                true,
            customClass: {
                popup:
                    "rounded-2xl",
                title:
                    "text-lg font-bold text-slate-800",
                htmlContainer:
                    "text-sm text-slate-600",
                confirmButton:
                    "rounded-xl px-5 py-2.5 font-semibold"
            },
            buttonsStyling:
                true
        });
        if (element) {
            setTimeout(
                () => {
                    element.focus();
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                },
                100
            );
        }
    },
    // =====================================================
    // VALID DATE
    // =====================================================
    isValidJournalDate(tanggal) {
        if (!tanggal) {
            return false;
        }
        const today =
            this.getLocalDate();
        // Tidak boleh sebelum jurnal resmi dimulai
        if (tanggal < JURNAL_START_DATE) {
            return false;
        }
        // Tidak boleh memilih tanggal masa depan
        if (tanggal > today) {
            return false;
        }
        return true;
    },
    // =====================================================
    // LOCAL DATE
    // =====================================================
    getLocalDate(
        offsetDays = 0
    ) {
        const date =
            new Date();
        date.setHours(
            0,
            0,
            0,
            0
        );
        date.setDate(
            date.getDate() +
            offsetDays
        );
        const year =
            date.getFullYear();
        const month =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            );
        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            );
        return `${year}-${month}-${day}`;
    },
    // =====================================================
    // FORMAT DATE ISO
    // =====================================================
    formatDateISO(
        date
    ) {
        const year =
            date.getFullYear();
        const month =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            );
        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            );
        return `${year}-${month}-${day}`;
    },
    // =====================================================
    // FORMAT DATE LONG
    // =====================================================
    formatDateLong(
        value
    ) {
        if (!value) {
            return "-";
        }
        const [
            year,
            month,
            day
        ] =
            value.split("-");
        const date =
            new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            );
        return date.toLocaleDateString(
            "id-ID",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    },
    showDetail(data) {
    console.log("Detail jurnal:", data);
    // Pastikan modal tersedia
    const modal =
        document.getElementById("modal-detail-jurnal");
    if (!modal) {
        console.error(
            "Modal detail jurnal tidak ditemukan."
        );
        return;
    }
    // =====================================================
    // HELPER
    // =====================================================
    const setText = (id, value) => {
        const element =
            document.getElementById(id);
        if (!element) {
            console.warn(
                `Element #${id} tidak ditemukan`
            );
            return;
        }
        element.textContent =
            value ?? "-";
    };
    // =====================================================
    // TANGGAL
    // =====================================================
    setText(
        "detail-jurnal-tanggal",
        this.formatDateLong(data.tanggal)
    );
    // =====================================================
    // BANGUN
    // =====================================================
    setText(
        "detail-jurnal-bangun",
        data.bangun || "-"
    );
    // =====================================================
    // IBADAH
    // =====================================================
    setText(
        "detail-jurnal-ibadah",
        data.ibadah !== null &&
        data.ibadah !== undefined
            ? `${data.ibadah} kali`
            : "-"
    );
    // =====================================================
    // OLAHRAGA
    // =====================================================
    setText(
        "detail-jurnal-olahraga",
        data.olahraga !== null &&
        data.olahraga !== undefined
            ? `${data.olahraga} menit`
            : "-"
    );
    // =====================================================
    // MAKAN
    // =====================================================
    setText(
        "detail-jurnal-makan",
        data.makan || "-"
    );
    // =====================================================
    // GEMAR
    // =====================================================
    setText(
        "detail-jurnal-gemar",
        data.gemar || "-"
    );
    // =====================================================
    // BERMASYARAKAT
    // =====================================================
    setText(
        "detail-jurnal-bermasyarakat",
        data.bermasyarakat || "-"
    );
    // =====================================================
    // TIDUR
    // =====================================================
    setText(
        "detail-jurnal-tidur",
        data.tidur || "-"
    );
    // =====================================================
    // TAMPILKAN MODAL
    // =====================================================
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add(
        "overflow-hidden"
    );
},
// =====================================================
// CEK KEWAJIBAN JURNAL
// =====================================================
isJurnal7KaihRequired() {
    const user =
        AppState.currentUser;
    if (!user) {
        return false;
    }
    const kategori =
        String(
            user.kategori || ""
        )
        .trim()
        .toUpperCase();
    // Hanya kelas X
    return kategori.startsWith("X ");
},
// =====================================================
// TANGGAL JURNAL SEBELUMNYA
// MINGGU DILEWATI
// =====================================================
getPreviousJournalDate(dateString) {
    const date =
        new Date(
            dateString + "T00:00:00"
        );
    // Mundur satu hari
    date.setDate(
        date.getDate() - 1
    );
    // Minggu tidak perlu jurnal
    // 0 = Minggu
    while (
        date.getDay() === 0
    ) {

        date.setDate(
            date.getDate() - 1
        );
    }
    const year =
        date.getFullYear();
    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );
    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );
    return `${year}-${month}-${day}`;
},
// =====================================================
// CEK JURNAL SEBELUM ABSENSI
// =====================================================
async checkJournalBeforeAttendance() {
    const user =
        AppState.currentUser;
    // ================================================
    // USER TIDAK ADA
    // ================================================
    if (!user) {
        return {
            allowed: false,
            reason: "USER_NOT_FOUND"
        };
    }
    // ================================================
    // CEK APAKAH WAJIB JURNAL
    // ================================================
    if (!this.isJurnal7KaihRequired()) {
        console.log(
            "Jurnal 7 KAIH tidak wajib untuk:",
            user.kategori
        );
        return {
            allowed: true
        };
    }
    // ================================================
    // TANGGAL HARI INI
    // ================================================
    const today =
        this.getLocalDate();

    console.log(
        "Tanggal hari ini:",
        today
    );
    console.log(
        "Tanggal mulai jurnal:",
        JURNAL_START_DATE
    );
    // ================================================
    // CEK MASA GRACE PERIOD
    // ================================================
    const startDate =
        new Date(
            JURNAL_START_DATE + "T00:00:00"
        );
    const todayDate =
        new Date(
            today + "T00:00:00"
        );
    // Selisih hari dari tanggal mulai
    const diffTime =
        todayDate.getTime() -
        startDate.getTime();
    const diffDays =
        Math.floor(
            diffTime /
            (1000 * 60 * 60 * 24)
        );
    console.log(
        "Selisih hari sejak jurnal dimulai:",
        diffDays
    );
    // ================================================
    // GRACE PERIOD
    // ================================================
    // 0 = tanggal mulai
    // 1 = satu hari setelah mulai
    //
    // Pada dua hari pertama,
    // jurnal belum menjadi syarat absensi.
    if (
        diffDays <= 1
    ) {

        console.log(
            "Masih dalam grace period jurnal."
        );

        return {
            allowed: true
        };

    }
    // ================================================
    // CARI TANGGAL JURNAL SEBELUMNYA
    // MINGGU DILEWATI
    // ================================================
    const journalDate =
        this.getPreviousJournalDate(
            today
        );
    console.log(
        "Tanggal absensi:",
        today
    );
    console.log(
        "Jurnal yang wajib diperiksa:",
        journalDate
    );
    // ================================================
    // PASTIKAN TANGGAL JURNAL
    // TIDAK SEBELUM START DATE
    // ================================================
    if (
        journalDate <
        JURNAL_START_DATE
    ) {
        console.log(
            "Tanggal jurnal berada sebelum tanggal mulai jurnal."
        );
        return {
            allowed: true
        };
    }
    // ================================================
    // CEK DATABASE
    // ================================================
    const {
        data,
        error
    } =
        await window.supabaseClient
            .from("jurnal_7_kaih")
            .select(`
                id,
                tanggal
            `)
            .eq(
                "username",
                user.username
            )
            .eq(
                "tanggal",
                journalDate
            )
            .maybeSingle();
    // ================================================
    // ERROR DATABASE
    // ================================================
    if (error) {

        console.error(
            "Check jurnal error:",
            error
        );
        return {
            allowed: false,
            reason:
                "DATABASE_ERROR",
            message:
                "Gagal memeriksa jurnal 7 KAIH."
        };
    }
    // ================================================
    // JURNAL BELUM ADA
    // ================================================
    if (!data) {
        return {
            allowed: false,
            reason:
                "JOURNAL_NOT_FOUND",
            journalDate,
            message:
                `Jurnal 7 KAIH tanggal ${this.formatDateLong(journalDate)} belum diisi.`
        };
    }
    // ================================================
    // JURNAL ADA
    // ================================================
    return {
        allowed: true,
        journalDate
    };
}
};

