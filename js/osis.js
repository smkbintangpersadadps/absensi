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
        el.textContent = user?.nama_lengkap || user?.username || "OSIS";
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