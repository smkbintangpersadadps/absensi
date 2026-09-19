// ==============================
// SERVICE PELANGGARAN OSIS
// ==============================
const OSISPelanggaranService = {
    siswa: [],
    jenisPelanggaran: [],
    eventsReady: false,
    async init() {
        try {
            this.setTanggalHariIni();
            await Promise.all([
                this.loadSiswa(),
                this.loadJenisPelanggaran()
            ]);
            hideLoader();
            this.setupEvents();
        } catch (error) {
            console.error("OSISPelanggaranService.init:", error);
            showToast("Gagal menyiapkan form pelanggaran", true);
        }
    },
    setTanggalHariIni() {
        const tanggal = document.getElementById("pelanggaran-tanggal");
        if (!tanggal) return;
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        tanggal.value = `${year}-${month}-${day}`;
    },
    async loadSiswa() {
        const { data, error } =
            await window.supabaseClient
                .from("users")
                .select(`
                    username,
                    nama_lengkap,
                    kategori
                `)
                .eq("role", "siswa")
                .order("kategori", {
                    ascending: true
                })
                .order("nama_lengkap", {
                    ascending: true
                });
        if (error) throw error;
        this.siswa = data || [];
        const select =
            document.getElementById(
                "pelanggaran-siswa"
            );
        if (!select) return;
        // ===============================
        // DESTROY TOMSELECT LAMA
        // ===============================
        if (window.osisSiswaSelect) {
            window.osisSiswaSelect.destroy();
            window.osisSiswaSelect = null;
        }
        // ===============================
        // OPTION
        // ===============================
        select.innerHTML = `
            <option value="">
                Pilih siswa
            </option>
            ${this.siswa.map(siswa => `
                <option
                    value="${this.escapeAttribute(siswa.username)}">
                    ${this.escapeHtml(
                        siswa.nama_lengkap ||
                        siswa.username
                    )}
                    ${
                        siswa.kategori
                            ? ` - ${this.escapeHtml(siswa.kategori)}`
                            : ""
                    }
                </option>
            `).join("")}
        `;
        // ===============================
        // TOM SELECT
        // ===============================
        if (typeof TomSelect !== "undefined") {
            window.osisSiswaSelect =
                new TomSelect(
                    "#pelanggaran-siswa",
                    {
                        create: false,
                        allowEmptyOption: false,
                        placeholder:
                            "Cari nama siswa...",
                        searchField: [
                            "text"
                        ]
                    }
                );
        }
    },
    async loadJenisPelanggaran() {
        const { data, error } = await window.supabaseClient
            .from("jenis_pelanggaran")
            .select(`
                id,
                kode,
                nama,
                poin,
                perlu_penanganan,
                status
            `)
            .eq("status", true)
            .order("id", {
                ascending: true
            });
        if (error) throw error;
        this.jenisPelanggaran = data || [];
        const select = document.getElementById("pelanggaran-jenis");
        if (!select) return;
        select.innerHTML = `
            <option value="">Pilih jenis pelanggaran</option>
            ${this.jenisPelanggaran.map(item => `
                <option value="${this.escapeAttribute(item.id)}">
                    ${this.escapeHtml(item.nama)}
                </option>
            `).join("")}
        `;
    },
    setupEvents() {
        if (this.eventsReady) return;
        this.eventsReady = true;
        const jenis = document.getElementById("pelanggaran-jenis");
        if (jenis) {
            jenis.addEventListener("change", () => {
                this.updateInfo(jenis.value);
            });
        }
        const form = document.getElementById("form-pelanggaran-osis");
        if (form) {
            form.addEventListener("submit", event => {
                event.preventDefault();
                this.submit();
            });
        }
    },
    updateInfo(id) {
        const info =
            document.getElementById(
                "pelanggaran-info"
            );
        const poinEl =
            document.getElementById(
                "pelanggaran-poin"
            );
        const penangananEl =
            document.getElementById(
                "pelanggaran-penanganan"
            );
        const warning =
            document.getElementById(
                "pelanggaran-warning"
            );
        const warningText =
            document.getElementById(
                "pelanggaran-warning-text"
            );
        // ===============================
        // PREVIEW JENIS
        // ===============================
        const preview =
            document.getElementById(
                "pelanggaran-jenis-preview"
            );
        const namaEl =
            document.getElementById(
                "pelanggaran-jenis-nama"
            );
        const kodeEl =
            document.getElementById(
                "pelanggaran-jenis-kode"
            );
        const previewPoinEl =
            document.getElementById(
                "pelanggaran-jenis-poin"
            );
        const previewStatusEl =
            document.getElementById(
                "pelanggaran-jenis-status"
            );
        // ===============================
        // JIKA BELUM PILIH
        // ===============================
        if (!id) {
            info?.classList.add("hidden");
            warning?.classList.add("hidden");
            penangananEl?.classList.add("hidden");
            preview?.classList.add("hidden");
            previewStatusEl?.classList.add("hidden");
            return;
        }
        // ===============================
        // CARI DATA
        // ===============================
        const jenis =
            this.jenisPelanggaran.find(
                item =>
                    String(item.id) ===
                    String(id)
            );
        if (!jenis) return;
        // ===============================
        // INFO POIN LAMA
        // ===============================
        info?.classList.remove("hidden");
        if (poinEl) {
            poinEl.textContent =
                jenis.poin || 0;
        }
        // ===============================
        // PREVIEW
        // ===============================
        preview?.classList.remove("hidden");
        if (namaEl) {
            namaEl.textContent =
                jenis.nama || "-";
        }
        if (kodeEl) {
            kodeEl.textContent =
                jenis.kode
                    ? `Kode: ${jenis.kode}`
                    : "Kode: -";
        }
        if (previewPoinEl) {
            previewPoinEl.textContent =
                `+${Number(jenis.poin || 0)} Poin`;
        }
        // ===============================
        // PERLU PENANGANAN
        // ===============================
        if (jenis.perlu_penanganan) {
            penangananEl?.classList.remove(
                "hidden"
            );
            warning?.classList.remove(
                "hidden"
            );
            previewStatusEl?.classList.remove(
                "hidden"
            );
            if (warningText) {
                warningText.textContent =
                    "Pelanggaran ini memerlukan penanganan lebih lanjut oleh pihak sekolah.";
            }
        } else {
            penangananEl?.classList.add(
                "hidden"
            );
            warning?.classList.add(
                "hidden"
            );
            previewStatusEl?.classList.add(
                "hidden"
            );
        }
    },
    async submit() {
        try {
            const btn = document.getElementById("btn-simpan-pelanggaran");
            const tanggal = document.getElementById("pelanggaran-tanggal")?.value;
            const username = document.getElementById("pelanggaran-siswa")?.value;
            const jenisId = document.getElementById("pelanggaran-jenis")?.value;
            const keterangan = document.getElementById("pelanggaran-keterangan")?.value?.trim() || null;
            if (!tanggal) {
                showToast("Tanggal belum dipilih", true);
                return;
            }
            if (!username) {
                showToast("Silakan pilih siswa", true);
                return;
            }
            if (!jenisId) {
                showToast("Silakan pilih jenis pelanggaran", true);
                return;
            }
            const siswa = this.siswa.find(item =>
                String(item.username) === String(username)
            );
            if (!siswa) {
                showToast("Data siswa tidak ditemukan", true);
                return;
            }
            const jenis = this.jenisPelanggaran.find(item =>
                String(item.id) === String(jenisId)
            );
            if (!jenis) {
                showToast("Jenis pelanggaran tidak ditemukan", true);
                return;
            }
            const user = AppState.currentUser;
            if (!user) {
                showToast("Data pengguna belum tersedia", true);
                return;
            }
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin mr-1"></i>
                    Menyimpan...
                `;
            }
            const payload = {
    tanggal: tanggal,

    username: siswa.username,

    nama_lengkap:
        siswa.nama_lengkap || null,

    kategori:
        siswa.kategori || null,

    jenis_pelanggaran:
        jenis.kode,

    poin:
        Number(jenis.poin || 0),

    keterangan:
        keterangan,

    status_penanganan:
        jenis.perlu_penanganan
            ? "Perlu Penanganan"
            : "Dicatat",

    dicatat_oleh:
        user.username || null
};
            console.log("Payload pelanggaran:", payload);
            const { error } = await window.supabaseClient
                .from("pelanggaran_siswa")
                .insert(payload);
            if (error) throw error;
            showToast("Pelanggaran berhasil dicatat");
            this.resetForm();
            this.closeForm();
            if (typeof OSISDashboardService !== "undefined") {
                await OSISDashboardService.load?.();
            }
        } catch (error) {
            console.error("OSISPelanggaranService.submit:", error);
            showToast(
                error.message || "Gagal menyimpan pelanggaran",
                true
            );
        } finally {
            const btn = document.getElementById("btn-simpan-pelanggaran");
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `
                    <i class="fa-solid fa-save mr-1"></i>
                    Simpan
                `;
            }
        }
    },
    async openForm() {
        const modal = document.getElementById("modal-pelanggaran-osis");
        if (!modal) return;
        modal.classList.remove("hidden");
        this.setTanggalHariIni();
        if (!this.siswa.length || !this.jenisPelanggaran.length) {
            await this.init();
            hideLoader
        } else {
            this.setupEvents();
        }
    },
    closeForm() {
        const modal = document.getElementById("modal-pelanggaran-osis");
        if (!modal) return;
        
        modal.classList.add("hidden");
        
    },
    resetForm() {
        const form = document.getElementById("form-pelanggaran-osis");
        form?.reset();
        if (window.osisSiswaSelect) {
            window.osisSiswaSelect.clear();
        }
        this.updateInfo("");
        this.setTanggalHariIni();
    },
    escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },
    escapeAttribute(value) {
        return this.escapeHtml(value);
    }
};

// ==============================
// SERVICE DASHBOARD OSIS
// ==============================
const OSISDashboardService = {
    data: [],
    async init() {
        console.log("OSISDashboardService.init()");
        
        this.setTanggal();
        this.setNamaUser();
        await this.load();
    },
    setTanggal() {
        const el = document.getElementById("osis-dashboard-tanggal");
        if (!el) return;
        const today = new Date();
        el.textContent = today.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    },
    setNamaUser() {
        const el = document.getElementById("osis-dashboard-nama");
        if (!el) return;
        const user = AppState.currentUser;
        el.textContent = user?.nama_lengkap || user?.nama || "OSIS";
    },
    async load() {
        const loading = document.getElementById("osis-dashboard-loading");
        const empty = document.getElementById("osis-dashboard-empty");
        const list = document.getElementById("osis-dashboard-list");
        try {
            console.log("1. load dashboard");
            if (loading) loading.classList.remove("hidden");
            if (empty) empty.classList.add("hidden");
            if (list) list.innerHTML = "";
            const tanggal = this.getToday();
            console.log("Dashboard OSIS tanggal:", tanggal);
            if (!window.supabaseClient) {
                throw new Error("Supabase client belum tersedia");
            }
            const { data, error } = await window.supabaseClient
                .from("pelanggaran_siswa")
                .select(`
                    id,
                    tanggal,
                    waktu,
                    username,
                    kategori,
                    jenis_pelanggaran,
                    poin,
                    keterangan,
                    status_penanganan,
                    dicatat_oleh,
                    created_at,
                    nama_lengkap
                `)
                .eq("tanggal", tanggal)
                .order("waktu", { ascending: false });
            console.log("2. Supabase response:", { data, error });
            if (error) throw error;
            this.data = data || [];
            console.log("3. Data pelanggaran hari ini:", this.data);
            this.renderStatistics();
            this.renderList();
        } catch (error) {
            console.error("OSISDashboardService.load:", error);
            this.data = [];
            this.renderStatistics();
            if (empty) empty.classList.add("hidden");
            if (list) {
                list.innerHTML = `
                    <div class="p-6 text-center">
                        <div class="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                            <i class="fa-solid fa-circle-exclamation text-xl"></i>
                        </div>
                        <p class="text-sm text-red-600 mt-3">Gagal memuat data pelanggaran.</p>
                        <p class="text-xs text-gray-400 mt-1">${this.escapeHtml(error.message || "")}</p>
                    </div>
                `;
            }
        } finally {
            console.log("4. FINALLY");
            hideLoader();
            if (loading) loading.classList.add("hidden");
        }
    },
    renderStatistics() {
        const data = this.data || [];
        const total = data.length;
        const totalPoin = data.reduce((sum, item) => sum + Number(item.poin || 0), 0);
        const terlambat = data.filter(item =>
            String(item.jenis_pelanggaran || "").toLowerCase().includes("terlambat")
        ).length;
        const perluPenanganan = data.filter(item =>
            String(item.status_penanganan || "").toLowerCase() === "perlu penanganan"
        ).length;
        this.setText("osis-total-pelanggaran", total);
        this.setText("osis-total-poin", totalPoin);
        this.setText("osis-total-terlambat", terlambat);
        this.setText("osis-total-penanganan", perluPenanganan);
    },
    renderList() {
        const list = document.getElementById("osis-dashboard-list");
        const empty = document.getElementById("osis-dashboard-empty");
        if (!list) return;
        if (!this.data || this.data.length === 0) {
            list.innerHTML = "";
            if (empty) empty.classList.remove("hidden");
            return;
        }
        if (empty) empty.classList.add("hidden");
        list.innerHTML = this.data.map(item => this.renderItem(item)).join("");
    },
    renderItem(item) {
        const nama = item.nama_lengkap || item.username || "-";
        const kategori = item.kategori || "";
        const jenis = item.jenis_pelanggaran || "-";
        const poin = Number(item.poin || 0);
        const waktu = item.waktu ? String(item.waktu).substring(0, 5) : "-";
        const status = item.status_penanganan || "Selesai";
        const perluPenanganan = String(status).toLowerCase() === "perlu penanganan";
        return `
            <div class="p-4 flex items-center justify-between gap-4">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl ${perluPenanganan ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"} flex-shrink-0 flex items-center justify-center">
                        <i class="fa-solid ${perluPenanganan ? "fa-triangle-exclamation" : "fa-clipboard-list"}"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="font-semibold text-gray-800 truncate">${this.escapeHtml(nama)}</div>
                        <div class="text-xs text-gray-500 mt-1">
                            ${this.escapeHtml(kategori)}
                            ${kategori ? " • " : ""}
                            ${this.escapeHtml(jenis)}
                            • ${this.escapeHtml(waktu)}
                        </div>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-1 flex-shrink-0">
                    <div class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-bold">+${poin}</div>
                    ${perluPenanganan ? `
                        <span class="text-[10px] text-red-600 font-medium">Perlu Penanganan</span>
                    ` : ""}
                </div>
            </div>
        `;
    },
    getToday() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    },
    setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },
    escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};

// ==============================
// SERVICE RIWAYAT OSIS
// ==============================
const OSISRiwayatPelanggaranService = {
    data: [],
    async init() {
        console.log("OSISRiwayatPelanggaranService.init()");
        try {
            this.setupTanggal();
            this.setupEvents();
            await this.loadKelas();
            await this.load();
        } catch (error) {
            console.error("OSISRiwayatPelanggaranService.init:", error);
            showToast("Gagal memuat riwayat pelanggaran", true);
        }
    },
    setupTanggal() {
        const tanggal = document.getElementById("riwayat-pelanggaran-tanggal");
        if (!tanggal) return;
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        tanggal.value = `${year}-${month}-${day}`;
    },
    setupEvents() {
        const tanggal = document.getElementById("riwayat-pelanggaran-tanggal");
        const search = document.getElementById("riwayat-pelanggaran-search");
        const kategori = document.getElementById("riwayat-pelanggaran-kategori");
        const status = document.getElementById("riwayat-pelanggaran-status");
        tanggal?.addEventListener("change", () => this.load());
        kategori?.addEventListener("change", () => this.load());
        status?.addEventListener("change", () => this.load());
        search?.addEventListener("input", () => this.filterLocal());
        const list = document.getElementById("osis-riwayat-list");
        list?.addEventListener("click", (event) => {
            const item = event.target.closest("[data-pelanggaran-id]");
            if (!item) return;
            const id = item.dataset.pelanggaranId;
            this.openDetail(id);
        });
        document.getElementById("btn-close-detail-pelanggaran")?.addEventListener("click", () => this.closeDetail());
        document.getElementById("btn-close-detail-pelanggaran-bottom")?.addEventListener("click", () => this.closeDetail());
        document.getElementById("modal-detail-pelanggaran-backdrop")?.addEventListener("click", () => this.closeDetail());
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") this.closeDetail();
        });
    },
    async load() {
        const list = document.getElementById("osis-riwayat-list");
        const empty = document.getElementById("osis-riwayat-empty");
        if (!list) return;
        list.innerHTML = `
            <div class="p-8 text-center">
                <i class="fa-solid fa-spinner fa-spin text-blue-600 text-xl"></i>
                <p class="text-sm text-gray-500 mt-2">Memuat riwayat pelanggaran...</p>
            </div>
        `;
        empty?.classList.add("hidden");
        try {
            const tanggal = document.getElementById("riwayat-pelanggaran-tanggal")?.value;
            const kategori = document.getElementById("riwayat-pelanggaran-kategori")?.value;
            const status = document.getElementById("riwayat-pelanggaran-status")?.value;
            let query = window.supabaseClient
                .from("pelanggaran_siswa")
                .select(`
                    id,
                    tanggal,
                    waktu,
                    username,
                    nama_lengkap,
                    kategori,
                    jenis_pelanggaran,
                    poin,
                    keterangan,
                    status_penanganan,
                    dicatat_oleh,
                    created_at
                `)
                .order("tanggal", { ascending: false })
                .order("waktu", { ascending: false });
            if (tanggal) query = query.eq("tanggal", tanggal);
            if (kategori) query = query.eq("kategori", kategori);
            if (status) query = query.eq("status_penanganan", status);
            const { data, error } = await query;
            if (error) throw error;
            this.data = data || [];
            this.filterLocal();
        } catch (error) {
            console.error("OSISRiwayatPelanggaranService.load:", error);
            list.innerHTML = `
                <div class="p-8 text-center">
                    <div class="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                        <i class="fa-solid fa-circle-exclamation text-xl"></i>
                    </div>
                    <p class="text-sm text-red-600 mt-3">Gagal memuat riwayat pelanggaran.</p>
                    <p class="text-xs text-gray-400 mt-1">${this.escapeHtml(error.message || "")}</p>
                </div>
            `;
        }
    },
    async loadKelas() {
        const select = document.getElementById("riwayat-pelanggaran-kategori");
        if (!select) return;
        try {
            const { data, error } = await window.supabaseClient
                .from("users")
                .select("kategori")
                .eq("role", "siswa")
                .not("kategori", "is", null)
                .order("kategori", { ascending: true });
            if (error) throw error;
            const kelas = [...new Set(
                (data || [])
                    .map(item => String(item.kategori || "").trim())
                    .filter(Boolean)
            )];
            select.innerHTML = `
                <option value="">Semua Kelas</option>
                ${kelas.map(kelas => `
                    <option value="${this.escapeHtml(kelas)}">${this.escapeHtml(kelas)}</option>
                `).join("")}
            `;
        } catch (error) {
            console.error("OSISRiwayatPelanggaranService.loadKelas:", error);
            select.innerHTML = `<option value="">Gagal memuat kelas</option>`;
        }
    },
    filterLocal() {
        const search = String(document.getElementById("riwayat-pelanggaran-search")?.value || "").trim().toLowerCase();
        let data = this.data || [];
        if (search) {
            data = data.filter(item => {
                const nama = String(item.nama_lengkap || "").toLowerCase();
                const username = String(item.username || "").toLowerCase();
                const kategori = String(item.kategori || "").toLowerCase();
                const jenis = String(item.jenis_pelanggaran || "").toLowerCase();
                return nama.includes(search) || username.includes(search) || kategori.includes(search) || jenis.includes(search);
            });
        }
        this.render(data);
    },
    render(data) {
        const list = document.getElementById("osis-riwayat-list");
        const empty = document.getElementById("osis-riwayat-empty");
        const count = document.getElementById("osis-riwayat-count");
        if (!list) return;
        if (count) count.textContent = data.length;
        if (!data.length) {
            list.innerHTML = "";
            empty?.classList.remove("hidden");
            return;
        }
        empty?.classList.add("hidden");
        list.innerHTML = data.map(item => this.renderItem(item)).join("");
    },
    renderItem(item) {
        const nama = item.nama_lengkap || item.username || "-";
        const kategori = item.kategori || "-";
        const jenis = item.jenis_pelanggaran || "-";
        const poin = Number(item.poin || 0);
        const waktu = this.formatWaktu(item.waktu);
        const tanggal = this.formatTanggal(item.tanggal);
        const status = item.status_penanganan || "Dicatat";
        const perluPenanganan = String(status).toLowerCase() === "perlu penanganan";
        return `
            <div data-pelanggaran-id="${this.escapeHtml(item.id)}" class="p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer">
                <div class="flex items-start justify-between gap-4">
                    <div class="flex items-start gap-3 min-w-0">
                        <div class="w-10 h-10 rounded-xl ${perluPenanganan ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"} flex-shrink-0 flex items-center justify-center">
                            <i class="fa-solid ${perluPenanganan ? "fa-triangle-exclamation" : "fa-clipboard-list"}"></i>
                        </div>
                        <div class="min-w-0">
                            <div class="font-semibold text-gray-800 truncate">${this.escapeHtml(nama)}</div>
                            <div class="text-xs text-gray-500 mt-1">${this.escapeHtml(kategori)} • ${this.escapeHtml(tanggal)} • ${this.escapeHtml(waktu)}</div>
                            <div class="text-sm text-gray-700 mt-2">${this.escapeHtml(jenis)}</div>
                            ${item.keterangan ? `<div class="text-xs text-gray-500 mt-1 line-clamp-2">${this.escapeHtml(item.keterangan)}</div>` : ""}
                            <div class="text-[11px] text-gray-400 mt-2">Dicatat oleh: ${this.escapeHtml(item.dicatat_oleh || "-")}</div>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-1 flex-shrink-0">
                        <div class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-bold">+${poin}</div>
                        <span class="px-2 py-1 rounded-full ${perluPenanganan ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"} text-[10px] font-semibold">${this.escapeHtml(status)}</span>
                    </div>
                </div>
                <div class="flex justify-end mt-3">
                    <span class="text-[11px] text-blue-600 font-medium">
                        Lihat detail <i class="fa-solid fa-chevron-right ml-1"></i>
                    </span>
                </div>
            </div>
        `;
    },
    openDetail(id) {
        const item = (this.data || []).find(row => String(row.id) === String(id));
        if (!item) {
            showToast("Data pelanggaran tidak ditemukan", true);
            return;
        }
        const modal = document.getElementById("modal-detail-pelanggaran");
        const content = document.getElementById("modal-detail-pelanggaran-content");
        if (!modal || !content) return;
        const nama = item.nama_lengkap || item.username || "-";
        const status = item.status_penanganan || "Dicatat";
        const perluPenanganan = String(status).toLowerCase() === "perlu penanganan";
        const poin = Number(item.poin || 0);
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center gap-3 p-4 rounded-2xl ${perluPenanganan ? "bg-red-50" : "bg-blue-50"}">
                    <div class="w-12 h-12 rounded-xl ${perluPenanganan ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"} flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid ${perluPenanganan ? "fa-triangle-exclamation" : "fa-clipboard-list"} text-xl"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="font-bold text-gray-800">${this.escapeHtml(nama)}</div>
                        <div class="text-xs text-gray-500 mt-1">${this.escapeHtml(item.kategori || "-")} • ${this.escapeHtml(item.username || "-")}</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div class="p-3 rounded-xl bg-gray-50">
                        <div class="text-[11px] text-gray-400 uppercase">Tanggal</div>
                        <div class="text-sm font-semibold text-gray-700 mt-1">${this.escapeHtml(this.formatTanggal(item.tanggal))}</div>
                    </div>
                    <div class="p-3 rounded-xl bg-gray-50">
                        <div class="text-[11px] text-gray-400 uppercase">Waktu</div>
                        <div class="text-sm font-semibold text-gray-700 mt-1">${this.escapeHtml(this.formatWaktu(item.waktu))}</div>
                    </div>
                </div>
                <div class="p-4 rounded-xl border border-gray-100">
                    <div class="text-[11px] text-gray-400 uppercase">Jenis Pelanggaran</div>
                    <div class="text-sm font-semibold text-gray-800 mt-1">${this.escapeHtml(item.jenis_pelanggaran || "-")}</div>
                </div>
                <div class="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100">
                    <div>
                        <div class="text-[11px] text-red-500 uppercase">Poin Pelanggaran</div>
                        <div class="text-2xl font-bold text-red-600 mt-1">+${poin}</div>
                    </div>
                    <i class="fa-solid fa-star text-red-300 text-2xl"></i>
                </div>
                <div class="p-4 rounded-xl border border-gray-100">
                    <div class="text-[11px] text-gray-400 uppercase">Keterangan</div>
                    <div class="text-sm text-gray-700 mt-1 whitespace-pre-line">${this.escapeHtml(item.keterangan || "Tidak ada keterangan.")}</div>
                </div>
                <div class="p-4 rounded-xl ${perluPenanganan ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}">
                    <div class="flex items-start gap-3">
                        <i class="fa-solid ${perluPenanganan ? "fa-triangle-exclamation text-red-500" : "fa-circle-check text-green-500"} mt-0.5"></i>
                        <div class="flex-1">
                            <div class="text-xs font-semibold ${perluPenanganan ? "text-red-700" : "text-green-700"}">Status Penanganan</div>
                            <div class="text-sm font-bold ${perluPenanganan ? "text-red-800" : "text-green-800"} mt-1">${this.escapeHtml(status)}</div>
                            ${perluPenanganan ? `
                                <div class="text-xs text-red-600 mt-2">Pelanggaran ini membutuhkan tindak lanjut dari pihak yang berwenang.</div>
                                <div class="mt-3 flex items-center gap-2 text-xs text-red-500">
                                    <i class="fa-solid fa-user-shield"></i>
                                    <span>Penanganan dilakukan oleh BK / Wali Kelas</span>
                                </div>
                            ` : `
                                <div class="text-xs text-green-600 mt-2">Belum ada tindak lanjut khusus yang diperlukan.</div>
                            `}
                        </div>
                    </div>
                </div>
                <div class="p-3 rounded-xl bg-gray-50">
                    <div class="text-[11px] text-gray-400 uppercase">Dicatat Oleh</div>
                    <div class="text-sm font-medium text-gray-700 mt-1">${this.escapeHtml(item.dicatat_oleh || "-")}</div>
                    <div class="text-[11px] text-gray-400 mt-2">Dibuat: ${this.escapeHtml(this.formatDateTime(item.created_at))}</div>
                </div>
                ${perluPenanganan ? `
                    <div class="pt-1">
                        <button type="button" class="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition" disabled title="Fitur penanganan akan tersedia pada Monitoring BK">
                            <i class="fa-solid fa-user-shield mr-2"></i>
                            Menunggu Tindak Lanjut BK / Wali
                        </button>
                    </div>
                ` : ""}
            </div>
        `;
        modal.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");
    },
    closeDetail() {
        const modal = document.getElementById("modal-detail-pelanggaran");
        if (!modal) return;
        modal.classList.add("hidden");
        document.body.classList.remove("overflow-hidden");
    },
    formatDateTime(value) {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    },
    formatTanggal(value) {
        if (!value) return "-";
        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    },
    formatWaktu(value) {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit"
        });
    },
    escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};

// ==============================
// SERVICE REKAP OSIS
// ==============================
const BKRekapPelanggaranService = {
    data: [],
    filteredData: [],
    jenisPelanggaran: [],
    jenisMap: {},
    pagination: {
        kelas: {
            page: 1,
            perPage: 20
        },
        jenis: {
            page: 1,
            perPage: 20
        },
        siswa: {
            page: 1,
            perPage: 20
        }
    },
    initialized: false,
    async init() {
        try {
            this.setTanggalDefault();
            await this.loadJenisPelanggaran();
            await this.loadKelas();
            this.setupEvents();
            await this.load();
            this.initialized = true;
        } catch (error) {
            console.error("BKRekapPelanggaranService.init:", error);
            showToast(error.message || "Gagal memuat rekap pelanggaran", true);
        }
    },
    setTanggalDefault() {
        const mulai = document.getElementById("bk-rekap-tanggal-mulai");
        const selesai = document.getElementById("bk-rekap-tanggal-selesai");
        if (!mulai || !selesai) return;
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const today = `${year}-${month}-${day}`;
        // mulai.value = `${year}-01-01`;
        mulai.value = today;
        selesai.value = today;
    },
    async loadJenisPelanggaran() {
        const { data, error } = await window.supabaseClient
            .from("jenis_pelanggaran")
            .select("id,kode,nama,poin,perlu_penanganan,status")
            .order("nama", { ascending: true });
        if (error) throw error;
        this.jenisPelanggaran = data || [];
        const urutanKode = [
            "terlambat",
            "atribut",
            "rokok",
            "korek",
            "sajam",
            "barang"
        ];
        this.jenisPelanggaran.sort((a, b) => {
            const kodeA = String(a.kode || "").toLowerCase();
            const kodeB = String(b.kode || "").toLowerCase();
            const indexA = urutanKode.indexOf(kodeA);
            const indexB = urutanKode.indexOf(kodeB);
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return String(a.nama || "").localeCompare(
                String(b.nama || ""),
                "id"
            );
        });
        this.jenisMap = {};
        this.jenisPelanggaran.forEach(item => {
            this.jenisMap[String(item.kode).toLowerCase()] = item;
        });
        this.renderJenisFilter();
    },
    renderJenisFilter() {
        const select = document.getElementById("bk-rekap-jenis");
        if (!select) return;
        select.innerHTML = `
            <option value="">Semua Jenis</option>
            ${this.jenisPelanggaran.map(item => `
                <option value="${this.escapeAttribute(item.kode)}">
                    ${this.escapeHtml(item.nama)}
                </option>
            `).join("")}
        `;
    },
    async loadKelas() {
        const select = document.getElementById("bk-rekap-kelas");
        if (!select) return;
        const { data, error } = await window.supabaseClient
            .from("users")
            .select("kategori")
            .eq("role", "siswa")
            .not("kategori", "is", null)
            .order("kategori", { ascending: true });
        if (error) throw error;
        const kelasSet = new Set();
        (data || []).forEach(item => {
            if (item.kategori) {
                kelasSet.add(item.kategori);
            }
        });
        select.innerHTML = `
            <option value="">Semua Kelas</option>
            ${Array.from(kelasSet).map(kelas => `
                <option value="${this.escapeAttribute(kelas)}">
                    ${this.escapeHtml(kelas)}
                </option>
            `).join("")}
        `;
    },
    setupEvents() {
        const filterIds = [
            "bk-rekap-tanggal-mulai",
            "bk-rekap-tanggal-selesai",
            "bk-rekap-kelas",
            "bk-rekap-jenis",
            "bk-rekap-status"
        ];
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (!element) return;
            element.addEventListener("change", () => {
                this.resetPagination();
                this.load();
            });
        });
        const search = document.getElementById("bk-rekap-search");
        if (search) {
            search.addEventListener("input", () => {
                clearTimeout(this.searchTimer);
                this.searchTimer = setTimeout(() => {
                    this.resetPagination();
                    this.applySearch();
                }, 300);
            });
        }
        const reset = document.getElementById("btn-bk-rekap-reset");
        if (reset) {
            reset.addEventListener("click", () => {
                this.resetFilter();
            });
        }
        const download = document.getElementById("btn-bk-rekap-download-pdf");
        if (download) {
            download.addEventListener("click", () => {
                this.downloadPDF();
            });
        }
        this.setupPaginationEvents("kelas");
        this.setupPaginationEvents("jenis");
        this.setupPaginationEvents("siswa");
    },
    setupPaginationEvents(type) {
        const prev = document.getElementById(`bk-rekap-${type}-prev`);
        const next = document.getElementById(`bk-rekap-${type}-next`);
        const perPage = document.getElementById(`bk-rekap-${type}-per-page`);
        if (prev) {
            prev.addEventListener("click", () => {
                if (this.pagination[type].page > 1) {
                    this.pagination[type].page--;
                    this.render();
                }
            });
        }
        if (next) {
            next.addEventListener("click", () => {
                const data = this.getGroupedData(type);
                const totalPages = Math.max(
                    1,
                    Math.ceil(
                        data.length / this.pagination[type].perPage
                    )
                );
                if (this.pagination[type].page < totalPages) {
                    this.pagination[type].page++;
                    this.render();
                }
            });
        }
        if (perPage) {
            perPage.addEventListener("change", () => {
                this.pagination[type].perPage = Number(perPage.value);
                this.pagination[type].page = 1;
                this.render();
            });
        }
    },
    async load() {
        try {
            this.showLoading();
            const tanggalMulai =
                document.getElementById("bk-rekap-tanggal-mulai")?.value;
            const tanggalSelesai =
                document.getElementById("bk-rekap-tanggal-selesai")?.value;
            const kelas =
                document.getElementById("bk-rekap-kelas")?.value;
            const jenis =
                document.getElementById("bk-rekap-jenis")?.value;
            const status =
                document.getElementById("bk-rekap-status")?.value;
            let query = window.supabaseClient
                .from("pelanggaran_siswa")
                .select(`
                    id,
                    tanggal,
                    waktu,
                    username,
                    nama_lengkap,
                    kategori,
                    jenis_pelanggaran,
                    poin,
                    keterangan,
                    status_penanganan
                `)
                .order("tanggal", { ascending: false })
                .order("waktu", { ascending: false });
            if (tanggalMulai) {
                query = query.gte("tanggal", tanggalMulai);
            }
            if (tanggalSelesai) {
                query = query.lte("tanggal", tanggalSelesai);
            }
            if (kelas) {
                query = query.eq("kategori", kelas);
            }
            if (jenis) {
                query = query.eq("jenis_pelanggaran", jenis);
            }
            if (status) {
                query = query.eq("status_penanganan", status);
            }
            const { data, error } = await query;
            if (error) throw error;
            this.data = data || [];
            this.applySearch();
        } catch (error) {
            console.error("BKRekapPelanggaranService.load:", error);
            showToast(error.message || "Gagal memuat data rekap", true);
            this.data = [];
            this.filteredData = [];
            this.render();
        }
    },
    applySearch() {
        const keyword = (
            document.getElementById("bk-rekap-search")?.value || ""
        )
            .trim()
            .toLowerCase();
        if (!keyword) {
            this.filteredData = [...this.data];
        } else {
            this.filteredData = this.data.filter(item => {
                const jenis = this.getJenis(item.jenis_pelanggaran);
                const text = [
                    item.nama_lengkap,
                    item.username,
                    item.kategori,
                    item.jenis_pelanggaran,
                    jenis?.nama,
                    item.keterangan,
                    item.status_penanganan
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                return text.includes(keyword);
            });
        }
        this.render();
    },
    render() {
        this.renderSummary();
        this.renderKelas();
        this.renderJenis();
        this.renderSiswa();
    },
    renderSummary() {
        const data = this.filteredData || [];
        const totalPelanggaran = data.length;
        const totalPoin = data.reduce(
            (total, item) => total + Number(item.poin || 0),
            0
        );
        const perlu = data.filter(
            item => item.status_penanganan === "Perlu Penanganan"
        ).length;
        const selesai = data.filter(
            item => item.status_penanganan === "Selesai"
        ).length;
        const totalEl =
            document.getElementById("bk-rekap-total-pelanggaran");
        const poinEl =
            document.getElementById("bk-rekap-total-poin");
        const perluEl =
            document.getElementById("bk-rekap-perlu-penanganan");
        const selesaiEl =
            document.getElementById("bk-rekap-selesai");
        if (totalEl) totalEl.textContent = this.formatNumber(totalPelanggaran);
        if (poinEl) poinEl.textContent = this.formatNumber(totalPoin);
        if (perluEl) perluEl.textContent = this.formatNumber(perlu);
        if (selesaiEl) selesaiEl.textContent = this.formatNumber(selesai);
    },
    getKelasData(data) {
        const map = {};
        data.forEach(item => {
            const kelas = item.kategori || "Tidak Ada Kelas";
            if (!map[kelas]) {
                map[kelas] = {
                    kelas,
                    siswa: new Set(),
                    pelanggaran: 0,
                    poin: 0,
                    perlu: 0,
                    dalam: 0,
                    selesai: 0
                };
            }
            const row = map[kelas];
            row.siswa.add(item.username);
            row.pelanggaran++;
            row.poin += Number(item.poin || 0);
            if (item.status_penanganan === "Perlu Penanganan") {
                row.perlu++;
            } else if (item.status_penanganan === "Dalam Penanganan") {
                row.dalam++;
            } else if (item.status_penanganan === "Selesai") {
                row.selesai++;
            }
        });
        return Object.values(map).sort((a, b) =>
            a.kelas.localeCompare(b.kelas, "id")
        );
    },
    getJenisData(data) {
        const map = {};
        this.jenisPelanggaran.forEach(item => {
            map[item.kode] = {
                kode: item.kode,
                nama: item.nama,
                poin: Number(item.poin || 0),
                jumlah: 0,
                totalPoin: 0,
                perlu: 0,
                dalam: 0,
                selesai: 0
            };
        });
        data.forEach(item => {
            const kode = item.jenis_pelanggaran || "lainnya";
            if (!map[kode]) {
                const jenis = this.getJenis(kode);
                map[kode] = {
                    kode,
                    nama: jenis?.nama || kode,
                    poin: Number(jenis?.poin || item.poin || 0),
                    jumlah: 0,
                    totalPoin: 0,
                    perlu: 0,
                    dalam: 0,
                    selesai: 0
                };
            }
            const row = map[kode];
            row.jumlah++;
            row.totalPoin += Number(item.poin || 0);
            if (item.status_penanganan === "Perlu Penanganan") {
                row.perlu++;
            } else if (item.status_penanganan === "Dalam Penanganan") {
                row.dalam++;
            } else if (item.status_penanganan === "Selesai") {
                row.selesai++;
            }
        });
        return Object.values(map).filter(item => {
            return item.jumlah > 0;
        });
    },
    getSiswaData(data) {
        const map = {};
        data.forEach(item => {
            const username = item.username || item.nama_lengkap || "unknown";
            if (!map[username]) {
                const pelanggaran = {};
                this.jenisPelanggaran.forEach(jenis => {
                    pelanggaran[jenis.kode] = 0;
                });
                map[username] = {
                    username,
                    nama_lengkap: item.nama_lengkap || username,
                    kategori: item.kategori || "-",
                    pelanggaran,
                    totalPelanggaran: 0,
                    totalPoin: 0,
                    perlu: 0,
                    dalam: 0,
                    selesai: 0
                };
            }
            const row = map[username];
            const kode = item.jenis_pelanggaran || "lainnya";
            if (typeof row.pelanggaran[kode] !== "number") {
                row.pelanggaran[kode] = 0;
            }
            row.pelanggaran[kode]++;
            row.totalPelanggaran++;
            row.totalPoin += Number(item.poin || 0);
            if (item.status_penanganan === "Perlu Penanganan") {
                row.perlu++;
            } else if (item.status_penanganan === "Dalam Penanganan") {
                row.dalam++;
            } else if (item.status_penanganan === "Selesai") {
                row.selesai++;
            }
        });
        return Object.values(map).sort((a, b) => {
            const kelasCompare = String(a.kategori).localeCompare(
                String(b.kategori),
                "id"
            );
            if (kelasCompare !== 0) return kelasCompare;
            return String(a.nama_lengkap).localeCompare(
                String(b.nama_lengkap),
                "id"
            );
        });
    },
    renderKelas() {
        const container = document.getElementById("bk-rekap-kelas-list");
        if (!container) return;
        const data = this.getKelasData(this.filteredData);
        const pagination = this.getPagination(
            data,
            this.pagination.kelas
        );
        if (!data.length) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-slate-400">
                        Tidak ada data.
                    </td>
                </tr>
            `;
            this.renderPagination("kelas", 0);
            return;
        }
        container.innerHTML = pagination.items.map((item, index) => {
            const no =
                (this.pagination.kelas.page - 1) *
                    this.pagination.kelas.perPage +
                index +
                1;
            return `
                <tr class="border-t border-slate-100 hover:bg-slate-50">
                    <td class="px-3 py-3 text-slate-500">${no}</td>
                    <td class="px-3 py-3 font-semibold text-slate-700">
                        ${this.escapeHtml(item.kelas)}
                    </td>
                    <td class="px-3 py-3 text-center">${this.formatNumber(item.siswa.size)}</td>
                    <td class="px-3 py-3 text-center font-semibold">${this.formatNumber(item.pelanggaran)}</td>
                    <td class="px-3 py-3 text-center font-semibold">${this.formatNumber(item.poin)}</td>
                    <td class="px-3 py-3 text-center text-yellow-600 font-semibold">${this.formatNumber(item.perlu)}</td>
                    <td class="px-3 py-3 text-center text-blue-600 font-semibold">${this.formatNumber(item.dalam)}</td>
                    <td class="px-3 py-3 text-center text-green-600 font-semibold">${this.formatNumber(item.selesai)}</td>
                </tr>
            `;
        }).join("");
        this.renderPagination("kelas", data.length);
    },
    renderJenis() {
        const container = document.getElementById("bk-rekap-jenis-list");
        if (!container) return;
        const data = this.getJenisData(this.filteredData);
        const pagination = this.getPagination(
            data,
            this.pagination.jenis
        );
        if (!data.length) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-slate-400">
                        Tidak ada data.
                    </td>
                </tr>
            `;
            this.renderPagination("jenis", 0);
            return;
        }
        container.innerHTML = pagination.items.map((item, index) => {
            const no =
                (this.pagination.jenis.page - 1) *
                    this.pagination.jenis.perPage +
                index +
                1;
            return `
                <tr class="border-t border-slate-100 hover:bg-slate-50">
                    <td class="px-3 py-3 text-slate-500">${no}</td>
                    <td class="px-3 py-3 font-semibold text-slate-700">
                        ${this.escapeHtml(item.nama)}
                    </td>
                    <td class="px-3 py-3 text-center">
                        <span class="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                            ${this.escapeHtml(item.kode)}
                        </span>
                    </td>
                    <td class="px-3 py-3 text-center">
                        ${this.formatNumber(item.poin)}
                    </td>
                    <td class="px-3 py-3 text-center font-semibold">
                        ${this.formatNumber(item.jumlah)}
                    </td>
                    <td class="px-3 py-3 text-center text-yellow-600 font-semibold">
                        ${this.formatNumber(item.perlu)}
                    </td>
                    <td class="px-3 py-3 text-center text-blue-600 font-semibold">
                        ${this.formatNumber(item.dalam)}
                    </td>
                    <td class="px-3 py-3 text-center text-green-600 font-semibold">
                        ${this.formatNumber(item.selesai)}
                    </td>
                </tr>
            `;
        }).join("");
        this.renderPagination("jenis", data.length);
    },
    renderSiswaHeader() {
        const head = document.getElementById("bk-rekap-siswa-head");
        if (!head) return;
        head.innerHTML = `
            <th class="px-3 py-3 text-center font-semibold text-slate-600">No</th>
            <th class="px-3 py-3 text-left font-semibold text-slate-600">Nama Siswa</th>
            <th class="px-3 py-3 text-center font-semibold text-slate-600">Kelas</th>
            ${this.jenisPelanggaran.map(jenis => `
                <th class="px-3 py-3 text-center font-semibold text-indigo-600">
                    ${this.escapeHtml(String(jenis.kode || "").toLowerCase().replace(/^./, huruf => huruf.toUpperCase()))}
                </th>
            `).join("")}
            <th class="px-3 py-3 text-center font-semibold text-slate-700">Total</th>
            <th class="px-3 py-3 text-center font-semibold text-orange-600">Poin</th>
            <th class="px-3 py-3 text-center font-semibold text-yellow-600">Perlu</th>
            <th class="px-3 py-3 text-center font-semibold text-blue-600">Dalam Penanganan</th>
            <th class="px-3 py-3 text-center font-semibold text-green-600">Selesai</th>
        `;
    },
    renderSiswa() {
        const container = document.getElementById("bk-rekap-siswa-list");
        if (!container) return;
        this.renderSiswaHeader();
        const data = this.getSiswaData(this.filteredData);
        const pagination = this.getPagination(
            data,
            this.pagination.siswa
        );
        const totalColumns =
            3 +
            this.jenisPelanggaran.length +
            5;
        if (!data.length) {
            container.innerHTML = `
                <tr>
                    <td colspan="${totalColumns}" class="text-center py-8 text-slate-400">
                        Tidak ada data.
                    </td>
                </tr>
            `;
            this.renderPagination("siswa", 0);
            return;
        }
        container.innerHTML = pagination.items.map((item, index) => {
            const no =
                (this.pagination.siswa.page - 1) *
                    this.pagination.siswa.perPage +
                index +
                1;
            const jenisCells = this.jenisPelanggaran.map(jenis => {
                const jumlah =
                    Number(item.pelanggaran[jenis.kode] || 0);
                return `
                    <td class="px-3 py-3 text-center">
                        <span class="${jumlah > 0 ? "font-bold text-slate-700" : "text-slate-300"}">
                            ${jumlah}
                        </span>
                    </td>
                `;
            }).join("");
            return `
                <tr class="border-t border-slate-100 hover:bg-slate-50">
                    <td class="px-3 py-3 text-center text-slate-500">${no}</td>
                    <td class="px-3 py-3 font-semibold text-slate-700">
                        ${this.escapeHtml(item.nama_lengkap)}
                    </td>
                    <td class="px-3 py-3 text-slate-600">
                        ${this.escapeHtml(item.kategori)}
                    </td>
                    ${jenisCells}
                    <td class="px-3 py-3 text-center font-bold text-slate-800">
                        ${this.formatNumber(item.totalPelanggaran)}
                    </td>
                    <td class="px-3 py-3 text-center font-bold text-orange-600">
                        ${this.formatNumber(item.totalPoin)}
                    </td>
                    <td class="px-3 py-3 text-center font-semibold text-yellow-600">
                        ${this.formatNumber(item.perlu)}
                    </td>
                    <td class="px-3 py-3 text-center font-semibold text-blue-600">
                        ${this.formatNumber(item.dalam)}
                    </td>
                    <td class="px-3 py-3 text-center font-semibold text-green-600">
                        ${this.formatNumber(item.selesai)}
                    </td>
                </tr>
            `;
        }).join("");
        this.renderPagination("siswa", data.length);
    },
    getPagination(data, state) {
        const total = data.length;
        const totalPages = Math.max(
            1,
            Math.ceil(total / state.perPage)
        );
        if (state.page > totalPages) {
            state.page = totalPages;
        }
        const start =
            (state.page - 1) * state.perPage;
        const end = start + state.perPage;
        return {
            items: data.slice(start, end),
            total,
            totalPages,
            start: total ? start + 1 : 0,
            end: Math.min(end, total)
        };
    },
    getGroupedData(type) {
        if (type === "kelas") {
            return this.getKelasData(this.filteredData);
        }
        if (type === "jenis") {
            return this.getJenisData(this.filteredData);
        }
        return this.getSiswaData(this.filteredData);
    },
    renderPagination(type, total) {
        const state = this.pagination[type];
        const totalPages = Math.max(
            1,
            Math.ceil(total / state.perPage)
        );
        if (state.page > totalPages) {
            state.page = totalPages;
        }
        const start =
            total === 0
                ? 0
                : (state.page - 1) * state.perPage + 1;
        const end =
            total === 0
                ? 0
                : Math.min(
                      state.page * state.perPage,
                      total
                  );
        const info =
            document.getElementById(`bk-rekap-${type}-info`);
        const pages =
            document.getElementById(`bk-rekap-${type}-pages`);
        const prev =
            document.getElementById(`bk-rekap-${type}-prev`);
        const next =
            document.getElementById(`bk-rekap-${type}-next`);
        if (info) {
            info.textContent =
                total === 0
                    ? "Tidak ada data"
                    : `Menampilkan ${this.formatNumber(start)}-${this.formatNumber(end)} dari ${this.formatNumber(total)} data`;
        }
        if (prev) {
            prev.disabled = state.page <= 1;
            prev.classList.toggle(
                "opacity-40",
                state.page <= 1
            );
        }
        if (next) {
            next.disabled = state.page >= totalPages;
            next.classList.toggle(
                "opacity-40",
                state.page >= totalPages
            );
        }
        if (pages) {
            pages.innerHTML = this.createPageButtons(
                type,
                totalPages
            );
            pages.querySelectorAll("button[data-page]").forEach(
                button => {
                    button.addEventListener("click", () => {
                        state.page = Number(
                            button.dataset.page
                        );
                        this.render();
                    });
                }
            );
        }
    },
    createPageButtons(type, totalPages) {
        const state = this.pagination[type];
        if (totalPages <= 1) return "";
        const current = state.page;
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (current > 3) pages.push("...");
            const start = Math.max(2, current - 1);
            const end = Math.min(
                totalPages - 1,
                current + 1
            );
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            if (current < totalPages - 2) {
                pages.push("...");
            }
            pages.push(totalPages);
        }
        return pages.map(page => {
            if (page === "...") {
                return `
                    <span class="px-2 py-1 text-xs text-slate-400">
                        ...
                    </span>
                `;
            }
            const active =
                page === current
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50";
            return `
                <button
                    type="button"
                    data-page="${page}"
                    class="min-w-[32px] px-2 py-1.5 rounded-lg border text-xs font-semibold ${active}">
                    ${page}
                </button>
            `;
        }).join("");
    },
    resetPagination() {
        this.pagination.kelas.page = 1;
        this.pagination.jenis.page = 1;
        this.pagination.siswa.page = 1;
    },
    resetFilter() {
        this.setTanggalDefault();
        const kelas = document.getElementById("bk-rekap-kelas");
        const jenis = document.getElementById("bk-rekap-jenis");
        const status = document.getElementById("bk-rekap-status");
        const search = document.getElementById("bk-rekap-search");
        if (kelas) kelas.value = "";
        if (jenis) jenis.value = "";
        if (status) status.value = "";
        if (search) search.value = "";
        this.resetPagination();
        this.load();
    },
    async downloadPDF() {
    try {
        if (
            !window.jspdf ||
            !window.jspdf.jsPDF
        ) {
            showToast(
                "Library PDF belum tersedia",
                true
            );
            return;
        }
        if (!this.filteredData.length) {
            showToast(
                "Tidak ada data untuk dibuat PDF",
                true
            );
            return;
        }
        const { jsPDF } = window.jspdf;
        const format =
            this.jenisPelanggaran.length > 8
                ? "a3"
                : "a4";
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format
        });
        // =========================================================
        // UKURAN HALAMAN DAN AREA TABEL
        // =========================================================
        const pageWidth =
            doc.internal.pageSize.getWidth();
        const pageHeight =
            doc.internal.pageSize.getHeight();
        const tableMargin = 14;
        const tableWidth =
            pageWidth -
            (tableMargin * 2);
        const bottomMargin = 15;
        // =========================================================
        // FILTER
        // =========================================================
        const tanggalMulai =
            document.getElementById(
                "bk-rekap-tanggal-mulai"
            )?.value || "-";
        const tanggalSelesai =
            document.getElementById(
                "bk-rekap-tanggal-selesai"
            )?.value || "-";
        const kelas =
            document.getElementById(
                "bk-rekap-kelas"
            )?.value || "Semua Kelas";
        const jenis =
            document.getElementById(
                "bk-rekap-jenis"
            )?.value || "Semua Jenis";
        const status =
            document.getElementById(
                "bk-rekap-status"
            )?.value || "Semua Status";
        // =========================================================
        // HEADER PDF
        // =========================================================
        doc.setFontSize(14);
        doc.setFont(
            "helvetica",
            "bold"
        );
        doc.text(
            "SMK BINTANG PERSADA DENPASAR",
            pageWidth / 2,
            12,
            {
                align: "center"
            }
        );
        doc.setFontSize(12);
        doc.text(
            "REKAP PELANGGARAN SISWA",
            pageWidth / 2,
            19,
            {
                align: "center"
            }
        );
        doc.setFontSize(8);
        doc.setFont(
            "helvetica",
            "normal"
        );
        doc.text(
            `Periode: ${this.formatTanggal(tanggalMulai)} s/d ${this.formatTanggal(tanggalSelesai)}`,
            14,
            27
        );
        doc.text(
            `Kelas: ${kelas}`,
            14,
            32
        );
        doc.text(
            `Jenis: ${jenis}`,
            14,
            37
        );
        doc.text(
            `Status: ${status}`,
            14,
            42
        );
        // =========================================================
        // RINGKASAN
        // =========================================================
        const totalPelanggaran =
            this.filteredData.length;
        const totalPoin =
            this.filteredData.reduce(
                (sum, item) =>
                    sum +
                    Number(item.poin || 0),
                0
            );
        const perlu =
            this.filteredData.filter(
                item =>
                    item.status_penanganan ===
                    "Perlu Penanganan"
            ).length;
        const selesai =
            this.filteredData.filter(
                item =>
                    item.status_penanganan ===
                    "Selesai"
            ).length;
        doc.setFont(
            "helvetica",
            "bold"
        );
        doc.text(
            `Total Pelanggaran: ${totalPelanggaran}`,
            100,
            27
        );
        doc.text(
            `Total Poin: ${totalPoin}`,
            100,
            32
        );
        doc.text(
            `Perlu Penanganan: ${perlu}`,
            100,
            37
        );
        doc.text(
            `Selesai: ${selesai}`,
            100,
            42
        );
        doc.setFont(
            "helvetica",
            "normal"
        );
        // =========================================================
        // POSISI AWAL TABEL
        // =========================================================
        let currentY = 48;
        // =========================================================
        // HELPER CEK HALAMAN UNTUK SETIAP SECTION
        // =========================================================
        const checkSectionPage = (
            rowCount = 0
        ) => {
            const sectionTitleHeight = 5;
            const headerHeight = 8;
            const estimatedRowHeight = 6;
            const estimatedTableHeight =
                headerHeight +
                Math.min(
                    rowCount,
                    5
                ) *
                    estimatedRowHeight;
            const requiredHeight =
                sectionTitleHeight +
                estimatedTableHeight +
                5;
            if (
                currentY +
                    requiredHeight >
                pageHeight -
                    bottomMargin
            ) {
                doc.addPage();
                currentY = 15;
            }
        };
        // =========================================================
        // REKAP PER KELAS
        // =========================================================
        const kelasData =
            this.getKelasData(
                this.filteredData
            );
        checkSectionPage(
            kelasData.length
        );
        doc.setFontSize(10);
        doc.setFont(
            "helvetica",
            "bold"
        );
        doc.text(
            "REKAP PER KELAS",
            tableMargin,
            currentY
        );
        currentY += 3;
        doc.autoTable({
            startY: currentY,
            tableWidth: tableWidth,
            margin: {
                left: tableMargin,
                right: tableMargin
            },
            head: [[
                "No",
                "Kelas",
                "Siswa",
                "Pelanggaran",
                "Poin",
                "Perlu",
                "Dalam Penanganan",
                "Selesai"
            ]],
            body: kelasData.map(
                (item, index) => [
                    index + 1,
                    item.kelas,
                    item.siswa.size,
                    item.pelanggaran,
                    item.poin,
                    item.perlu,
                    item.dalam,
                    item.selesai
                ]
            ),
            theme: "grid",
            styles: {
                fontSize: 7,
                cellPadding: 1.5,
                valign: "middle"
            },
            headStyles: {
                fontStyle: "bold",
                halign: "center",
                valign: "middle"
            },
            columnStyles: {
                0: {
                    halign: "center"
                },
                1: {
                    halign: "left"
                },
                2: {
                    halign: "center"
                },
                3: {
                    halign: "center"
                },
                4: {
                    halign: "center"
                },
                5: {
                    halign: "center"
                },
                6: {
                    halign: "center"
                },
                7: {
                    halign: "center"
                }
            },
            didParseCell: function(data) {
                if (
                    data.section === "head" &&
                    data.column.index === 1
                ) {
                    data.cell.styles.halign = "left";
                }
                if (
                    data.section === "body" &&
                    data.row.index % 2 === 1
                ) {
                    data.cell.styles.fillColor = [239, 246, 255];
                }
            }
        });
        currentY =
            doc.lastAutoTable.finalY + 8;
        // =========================================================
        // REKAP PER JENIS PELANGGARAN
        // =========================================================
        const jenisData =
            this.getJenisData(
                this.filteredData
            );
        checkSectionPage(
            jenisData.length
        );
        doc.setFontSize(10);
        doc.setFont(
            "helvetica",
            "bold"
        );
        doc.text(
            "REKAP PER JENIS PELANGGARAN",
            tableMargin,
            currentY
        );
        currentY += 3;
        doc.autoTable({
            startY: currentY,
            tableWidth: tableWidth,
            margin: {
                left: tableMargin,
                right: tableMargin
            },
            head: [[
                "No",
                "Jenis",
                "Kode",
                "Poin",
                "Jumlah",
                "Perlu",
                "Dalam Penanganan",
                "Selesai"
            ]],
            body: jenisData.map(
                (item, index) => [
                    index + 1,
                    item.nama,
                    String(item.kode || "")
                        .toLowerCase()
                        .replace(
                            /^./,
                            huruf =>
                                huruf.toUpperCase()
                        ),
                    item.poin,
                    item.jumlah,
                    item.perlu,
                    item.dalam,
                    item.selesai
                ]
            ),
            theme: "grid",
            styles: {
                fontSize: 7,
                cellPadding: 1.5,
                valign: "middle"
            },
            headStyles: {
                fontStyle: "bold",
                halign: "center",
                valign: "middle"
            },
            columnStyles: {
                0: {
                    halign: "center"
                },
                1: {
                    halign: "left"
                },
                2: {
                    halign: "left"
                },
                3: {
                    halign: "center"
                },
                4: {
                    halign: "center"
                },
                5: {
                    halign: "center"
                },
                6: {
                    halign: "center"
                },
                7: {
                    halign: "center"
                }
            },
            didParseCell: function(data) {
                if (
                    data.section === "head" &&
                    data.column.index === 1
                ) {
                    data.cell.styles.halign = "left";
                }
                if (
                    data.section === "body" &&
                    data.row.index % 2 === 1
                ) {
                    data.cell.styles.fillColor = [239, 246, 255];
                }
            }
        });
        currentY =
            doc.lastAutoTable.finalY + 8;
        // =========================================================
        // DATA SISWA
        // =========================================================
        const siswaData =
            this.getSiswaData(
                this.filteredData
            );
        // =========================================================
        // CEK HALAMAN SEBELUM REKAP SISWA
        // =========================================================
        checkSectionPage(
            siswaData.length
        );
        // =========================================================
        // JUDUL REKAP PELANGGARAN SISWA
        // =========================================================
        doc.setFontSize(10);
        doc.setFont(
            "helvetica",
            "bold"
        );
        doc.text(
            "REKAP PELANGGARAN SISWA",
            tableMargin,
            currentY
        );
        currentY += 3;
        // =========================================================
        // HEADER TABEL SISWA
        // =========================================================
        const siswaHead = [
            "No",
            "Nama Siswa",
            "Kelas",
            ...this.jenisPelanggaran.map(
                item =>
                    String(
                        item.kode || ""
                    )
                        .toLowerCase()
                        .replace(
                            /^./,
                            huruf =>
                                huruf.toUpperCase()
                        )
            ),
            "Total",
            "Poin",
            "Perlu",
            "Dalam Penanganan",
            "Selesai"
        ];
        // =========================================================
        // BODY TABEL SISWA
        // =========================================================
        const siswaBody =
            siswaData.map(
                (item, index) => [
                    index + 1,
                    item.nama_lengkap,
                    item.kategori,
                    ...this.jenisPelanggaran.map(
                        jenis =>
                            Number(
                                item.pelanggaran[
                                    jenis.kode
                                ] || 0
                            )
                    ),
                    item.totalPelanggaran,
                    item.totalPoin,
                    item.perlu,
                    item.dalam,
                    item.selesai
                ]
            );
        // =========================================================
        // PERHITUNGAN LEBAR KOLOM SISWA
        // =========================================================
        const totalJenis =
            this.jenisPelanggaran.length;
        const noWidth = 8;
        const namaWidth = 42;
        const kelasWidth = 20;
        const totalStaticWidth =
            14 +
            14 +
            16 +
            20 +
            16;
        const usedFixedWidth =
            noWidth +
            namaWidth +
            kelasWidth +
            totalStaticWidth;
        const remainingWidth =
            tableWidth -
            usedFixedWidth;
        const jenisWidth =
            totalJenis > 0
                ? remainingWidth /
                    totalJenis
                : 0;
        const dynamicColumnStyles = {};
        // =========================================================
        // KOLOM NO
        // =========================================================
        dynamicColumnStyles[0] = {
            cellWidth: noWidth,
            halign: "center"
        };
        // =========================================================
        // KOLOM NAMA
        // =========================================================
        dynamicColumnStyles[1] = {
            cellWidth: namaWidth,
            halign: "left"
        };
        // =========================================================
        // KOLOM KELAS
        // =========================================================
        dynamicColumnStyles[2] = {
            cellWidth: kelasWidth,
            halign: "left"
        };
        // =========================================================
        // KOLOM JENIS PELANGGARAN DINAMIS
        // =========================================================
        this.jenisPelanggaran.forEach(
            (jenis, index) => {
                dynamicColumnStyles[
                    index + 3
                ] = {
                    cellWidth: jenisWidth,
                    halign: "center"
                };
            }
        );
        // =========================================================
        // KOLOM STATIS SETELAH JENIS
        // =========================================================
        const staticStart =
            3 + totalJenis;
        dynamicColumnStyles[
            staticStart
        ] = {
            cellWidth: 14,
            halign: "center"
        };
        dynamicColumnStyles[
            staticStart + 1
        ] = {
            cellWidth: 14,
            halign: "center"
        };
        dynamicColumnStyles[
            staticStart + 2
        ] = {
            cellWidth: 16,
            halign: "center"
        };
        dynamicColumnStyles[
            staticStart + 3
        ] = {
            cellWidth: 20,
            halign: "center"
        };
        dynamicColumnStyles[
            staticStart + 4
        ] = {
            cellWidth: 16,
            halign: "center"
        };
        // =========================================================
        // REKAP PELANGGARAN SISWA
        // =========================================================
        doc.autoTable({
            startY: currentY,
            tableWidth: tableWidth,
            margin: {
                left: tableMargin,
                right: tableMargin
            },
            head: [
                siswaHead
            ],
            body: siswaBody,
            theme: "grid",
            styles: {
                fontSize:
                    totalJenis > 8
                        ? 5
                        : 6,
                cellPadding: 1,
                overflow: "linebreak",
                valign: "middle"
            },
            headStyles: {
                fontStyle: "bold",
                fontSize:
                    totalJenis > 8
                        ? 5
                        : 6,
                halign: "center",
                valign: "middle"
            },
            columnStyles:
                dynamicColumnStyles,
            didParseCell: function(data) {
                if (
                    data.section === "head" &&
                    data.column.index === 1
                ) {
                    data.cell.styles.halign = "left";
                }
                if (
                    data.section === "body" &&
                    data.row.index % 2 === 1
                ) {
                    data.cell.styles.fillColor = [239, 246, 255];
                }
                if (
                    data.section === "body" &&
                    data.column.index >= 3 &&
                    data.column.index < 3 + totalJenis
                ) {
                    data.cell.text = [
                        data.cell.text?.[0] || "0"
                    ];
                }
            }
        });
        // =========================================================
        // FOOTER SEMUA HALAMAN
        // =========================================================
        const totalPages =
            doc.internal.getNumberOfPages();
        for (
            let i = 1;
            i <= totalPages;
            i++
        ) {
            doc.setPage(i);
            const currentPageHeight =
                doc.internal.pageSize.height;
            const currentPageWidth =
                doc.internal.pageSize.width;
            doc.setFontSize(7);
            doc.setFont(
                "helvetica",
                "normal"
            );
            doc.text(
                `Dicetak: ${new Date().toLocaleString("id-ID")}`,
                14,
                currentPageHeight - 8
            );
            doc.text(
                `Halaman ${i} dari ${totalPages}`,
                currentPageWidth - 14,
                currentPageHeight - 8,
                {
                    align: "right"
                }
            );
        }
        // =========================================================
        // SIMPAN PDF
        // =========================================================
        const fileName =
            `Rekap-Pelanggaran-Siswa-${tanggalMulai}-${tanggalSelesai}.pdf`;
        doc.save(fileName);
        showToast(
            "PDF berhasil dibuat"
        );
    } catch (error) {
        console.error(
            "BKRekapPelanggaranService.downloadPDF:",
            error
        );
        showToast(
            error.message ||
                "Gagal membuat PDF",
            true
        );
    }
    },
    showLoading() {
        const containers = [
            {
                id: "bk-rekap-kelas-list",
                colspan: 8
            },
            {
                id: "bk-rekap-jenis-list",
                colspan: 8
            },
            {
                id: "bk-rekap-siswa-list",
                colspan:
                    3 +
                    this.jenisPelanggaran.length +
                    5
            }
        ];
        containers.forEach(item => {
            const element =
                document.getElementById(item.id);
            if (!element) return;
            element.innerHTML = `
                <tr>
                    <td colspan="${item.colspan}" class="text-center py-8 text-slate-400">
                        <i class="fas fa-spinner fa-spin mr-2"></i>
                        Memuat data...
                    </td>
                </tr>
            `;
        });
    },
    getJenis(kode) {
        if (!kode) return null;
        return (
            this.jenisMap[
                String(kode).toLowerCase()
            ] || null
        );
    },
    getJenisNama(kode) {
        const jenis = this.getJenis(kode);
        return jenis?.nama || kode || "-";
    },
    formatTanggal(tanggal) {
        if (!tanggal) return "-";
        const parts =
            String(tanggal).split("-");
        if (parts.length !== 3) {
            return tanggal;
        }
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    },
    formatNumber(number) {
        return Number(number || 0).toLocaleString(
            "id-ID"
        );
    },
    escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },
    escapeAttribute(value) {
        return this.escapeHtml(value);
    }
};