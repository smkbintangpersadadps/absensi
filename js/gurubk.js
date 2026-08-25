const BKMonitoringPelanggaranService = {
    data: [],
    guruMap: {},
    eventsReady: false,
    async init() {
        console.log("BKMonitoringPelanggaranService.init()");
        try {
            this.setupEvents();
            await Promise.all([
                this.loadKelas(),
                this.loadGuru()
            ]);
            await this.load();
        } catch (error) {
            console.error(
                "BKMonitoringPelanggaranService.init:",
                error
            );
            showToast(
                "Gagal memuat monitoring pelanggaran",
                true
            );
        }
    },
    setupEvents() {
        if (this.eventsReady) return;
        this.eventsReady = true;
        const tanggal = document.getElementById("bk-monitoring-tanggal");
        const kategori = document.getElementById("bk-monitoring-kategori");
        const status = document.getElementById("bk-monitoring-status");
        const search = document.getElementById("bk-monitoring-search");
        const refresh = document.getElementById("btn-bk-monitoring-refresh");
        tanggal?.addEventListener("change", () => this.load());
        kategori?.addEventListener("change", () => this.load());
        status?.addEventListener("change", () => this.load());
        search?.addEventListener("input", () => this.filterLocal());
        refresh?.addEventListener("click", () => this.load());
        const list = document.getElementById("bk-monitoring-list");
        list?.addEventListener("click", event => {
            const item = event.target.closest("[data-bk-pelanggaran-id]");
            if (!item) return;
            this.openDetail(item.dataset.bkPelanggaranId);
        });
        document.getElementById("btn-close-bk-detail")?.addEventListener("click", () => this.closeDetail());
        document.getElementById("modal-bk-detail-backdrop")?.addEventListener("click", () => this.closeDetail());
        document.addEventListener("keydown", event => {
            if (event.key === "Escape") this.closeDetail();
        });
    },
    async loadGuru() {
        try {
            const { data, error } = await window.supabaseClient
                .from("users")
                .select("username, nama_lengkap")
                .in("role", ["konseling", "wali", "bk"]);
            if (error) throw error;
            this.guruMap = {};
            (data || []).forEach(user => {
                if (user.username) {
                    this.guruMap[String(user.username)] =
                        user.nama_lengkap || user.username;
                }
            });
        } catch (error) {
            console.error(
                "BKMonitoringPelanggaranService.loadGuru:",
                error
            );
            this.guruMap = {};
        }
    },
    async load() {
        const list = document.getElementById("bk-monitoring-list");
        const empty = document.getElementById("bk-monitoring-empty");
        if (!list) return;
        list.innerHTML = `
            <div class="p-8 text-center">
                <i class="fa-solid fa-spinner fa-spin text-blue-600 text-xl"></i>
                <p class="text-sm text-gray-500 mt-2">
                    Memuat data pelanggaran...
                </p>
            </div>
        `;
        empty?.classList.add("hidden");
        try {
            const tanggal = document.getElementById("bk-monitoring-tanggal")?.value;
            const kategori = document.getElementById("bk-monitoring-kategori")?.value;
            const status = document.getElementById("bk-monitoring-status")?.value;
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
                    created_at,
                    ditangani_oleh,
                    ditangani_at,
                    tindakan_penanganan,
                    catatan_penanganan,
                    selesai_at
                `)
                .order("tanggal", { ascending: false })
                .order("waktu", { ascending: false });
            if (tanggal) {
                query = query.eq("tanggal", tanggal);
            }
            if (kategori) {
                query = query.eq("kategori", kategori);
            }
            if (status) {
                query = query.eq("status_penanganan", status);
            }
            const { data, error } = await query;
            if (error) throw error;
            this.data = data || [];
            this.updateSummary();
            this.filterLocal();
        } catch (error) {
            console.error("BKMonitoringPelanggaranService.load:", error);
            list.innerHTML = `
                <div class="p-8 text-center">
                    <div class="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                        <i class="fa-solid fa-circle-exclamation text-xl"></i>
                    </div>
                    <p class="text-sm text-red-600 mt-3">
                        Gagal memuat data pelanggaran.
                    </p>
                    <p class="text-xs text-gray-400 mt-1">
                        ${this.escapeHtml(error.message || "")}
                    </p>
                </div>
            `;
        }
    },
    async loadKelas() {
        const select = document.getElementById("bk-monitoring-kategori");
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
                ${kelas.map(item => `
                    <option value="${this.escapeAttribute(item)}">
                        ${this.escapeHtml(item)}
                    </option>
                `).join("")}
            `;
        } catch (error) {
            console.error("BKMonitoringPelanggaranService.loadKelas:", error);
        }
    },
    updateSummary() {
        const data = this.data || [];
        const perlu = data.filter(item => item.status_penanganan === "Perlu Penanganan").length;
        const proses = data.filter(item => item.status_penanganan === "Dalam Penanganan").length;
        const selesai = data.filter(item => item.status_penanganan === "Selesai").length;
        const perluEl = document.getElementById("bk-monitoring-count-perlu");
        const prosesEl = document.getElementById("bk-monitoring-count-proses");
        const selesaiEl = document.getElementById("bk-monitoring-count-selesai");
        if (perluEl) perluEl.textContent = perlu;
        if (prosesEl) prosesEl.textContent = proses;
        if (selesaiEl) selesaiEl.textContent = selesai;
    },
    filterLocal() {
        const search = String(
            document.getElementById("bk-monitoring-search")?.value || ""
        ).trim().toLowerCase();
        let data = this.data || [];
        if (search) {
            data = data.filter(item => {
                const nama = String(item.nama_lengkap || "").toLowerCase();
                const username = String(item.username || "").toLowerCase();
                const kategori = String(item.kategori || "").toLowerCase();
                const jenis = String(item.jenis_pelanggaran || "").toLowerCase();
                return (
                    nama.includes(search) ||
                    username.includes(search) ||
                    kategori.includes(search) ||
                    jenis.includes(search)
                );
            });
        }
        this.render(data);
    },
    render(data) {
        const list = document.getElementById("bk-monitoring-list");
        const empty = document.getElementById("bk-monitoring-empty");
        const count = document.getElementById("bk-monitoring-count-list");
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
        const status = item.status_penanganan || "Dicatat";
        const perlu = status === "Perlu Penanganan";
        const proses = status === "Dalam Penanganan";
        const selesai = status === "Selesai";
        const statusClass = perlu
            ? "bg-red-100 text-red-700"
            : proses
                ? "bg-yellow-100 text-yellow-700"
                : selesai
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700";
        const iconClass = perlu
            ? "fa-triangle-exclamation"
            : proses
                ? "fa-user-shield"
                : selesai
                    ? "fa-circle-check"
                    : "fa-clipboard-list";
        const iconBg = perlu
            ? "bg-red-100 text-red-600"
            : proses
                ? "bg-yellow-100 text-yellow-600"
                : selesai
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600";
        return `
            <div
                data-bk-pelanggaran-id="${this.escapeAttribute(item.id)}"
                class="p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition"
            >
                <div class="flex items-start justify-between gap-4">
                    <div class="flex items-start gap-3 min-w-0">
                        <div class="w-10 h-10 rounded-xl ${iconBg} flex-shrink-0 flex items-center justify-center">
                            <i class="fa-solid ${iconClass}"></i>
                        </div>
                        <div class="min-w-0">
                            <div class="font-semibold text-gray-800 truncate">
                                ${this.escapeHtml(nama)}
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                                ${this.escapeHtml(kategori)}
                                •
                                ${this.escapeHtml(this.formatTanggal(item.tanggal))}
                                •
                                ${this.escapeHtml(this.formatWaktu(item.waktu))}
                            </div>
                            <div class="text-sm text-gray-700 mt-2">
                                ${this.escapeHtml(jenis)}
                            </div>
                            <div class="text-[11px] text-gray-400 mt-2">
                                Dicatat oleh:
                                ${this.escapeHtml(item.dicatat_oleh || "-")}
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-1 flex-shrink-0">
                        <div class="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-bold">
                            +${poin}
                        </div>
                        <span class="px-2 py-1 rounded-full ${statusClass} text-[10px] font-semibold">
                            ${this.escapeHtml(status)}
                        </span>
                    </div>
                </div>
                <div class="flex justify-end mt-3">
                    <span class="text-[11px] text-blue-600 font-medium">
                        Lihat detail
                        <i class="fa-solid fa-chevron-right ml-1"></i>
                    </span>
                </div>
            </div>
        `;
    },
    openDetail(id) {
        const item = (this.data || []).find(
            row => String(row.id) === String(id)
        );
        if (!item) {
            showToast("Data pelanggaran tidak ditemukan", true);
            return;
        }
        const modal = document.getElementById("modal-bk-detail-pelanggaran");
        const content = document.getElementById("modal-bk-detail-content");
        if (!modal || !content) return;
        const status = item.status_penanganan || "Dicatat";
        const perlu = status === "Perlu Penanganan";
        const proses = status === "Dalam Penanganan";
        const selesai = status === "Selesai";
        const statusClass = perlu
            ? "bg-red-50 border-red-200 text-red-700"
            : proses
                ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                : selesai
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-blue-50 border-blue-200 text-blue-700";
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center gap-3 p-4 rounded-2xl ${perlu ? "bg-red-50" : proses ? "bg-yellow-50" : "bg-green-50"}">
                    <div class="w-12 h-12 rounded-xl ${perlu ? "bg-red-100 text-red-600" : proses ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"} flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid ${perlu ? "fa-triangle-exclamation" : proses ? "fa-user-shield" : "fa-circle-check"} text-xl"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="font-bold text-gray-800 truncate">
                            ${this.escapeHtml(item.nama_lengkap || item.username)}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                            ${this.escapeHtml(item.kategori || "-")}
                            •
                            ${this.escapeHtml(item.username || "-")}
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div class="p-3 rounded-xl bg-gray-50">
                        <div class="text-[11px] text-gray-400 uppercase">
                            Tanggal
                        </div>
                        <div class="text-sm font-semibold text-gray-700 mt-1">
                            ${this.escapeHtml(this.formatTanggal(item.tanggal))}
                        </div>
                    </div>
                    <div class="p-3 rounded-xl bg-gray-50">
                        <div class="text-[11px] text-gray-400 uppercase">
                            Waktu
                        </div>
                        <div class="text-sm font-semibold text-gray-700 mt-1">
                            ${this.escapeHtml(this.formatWaktu(item.waktu))}
                        </div>
                    </div>
                </div>
                <div class="p-4 rounded-xl border border-gray-100">
                    <div class="text-[11px] text-gray-400 uppercase">
                        Jenis Pelanggaran
                    </div>
                    <div class="text-sm font-semibold text-gray-800 mt-1">
                        ${this.escapeHtml(item.jenis_pelanggaran || "-")}
                    </div>
                </div>
                <div class="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100">
                    <div>
                        <div class="text-[11px] text-red-500 uppercase">
                            Poin Pelanggaran
                        </div>
                        <div class="text-2xl font-bold text-red-600 mt-1">
                            +${Number(item.poin || 0)}
                        </div>
                    </div>
                    <i class="fa-solid fa-star text-red-300 text-2xl"></i>
                </div>
                <div class="p-4 rounded-xl border border-gray-100">
                    <div class="text-[11px] text-gray-400 uppercase">
                        Keterangan OSIS
                    </div>
                    <div class="text-sm text-gray-700 mt-1 whitespace-pre-line">
                        ${this.escapeHtml(item.keterangan || "Tidak ada keterangan.")}
                    </div>
                </div>
                <div class="p-4 rounded-xl ${statusClass} border">
                    <div class="text-[11px] uppercase font-semibold">
                        Status Penanganan
                    </div>
                    <div class="text-base font-bold mt-1">
                        ${this.escapeHtml(status)}
                    </div>
                    ${item.ditangani_oleh ? `
                        <div class="text-xs mt-2">
                            Ditangani oleh:
                            <strong>
                                ${this.escapeHtml(
                                    this.guruMap[String(item.ditangani_oleh)] ||
                                    item.ditangani_oleh
                                )}
                            </strong>
                        </div>
                    ` : ""}
                    ${item.ditangani_at ? `
                        <div class="text-xs mt-1">
                            Mulai:
                            ${this.escapeHtml(this.formatDateTime(item.ditangani_at))}
                        </div>
                    ` : ""}
                    ${item.selesai_at ? `
                        <div class="text-xs mt-1">
                            Selesai:
                            ${this.escapeHtml(this.formatDateTime(item.selesai_at))}
                        </div>
                    ` : ""}
                </div>
                ${item.tindakan_penanganan || item.catatan_penanganan ? `
                    <div class="p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div class="text-[11px] text-gray-400 uppercase">
                            Hasil Penanganan
                        </div>
                        ${item.tindakan_penanganan ? `
                            <div class="mt-2">
                                <div class="text-xs text-gray-400">
                                    Tindakan
                                </div>
                                <div class="text-sm font-semibold text-gray-700 mt-1">
                                    ${this.escapeHtml(item.tindakan_penanganan)}
                                </div>
                            </div>
                        ` : ""}
                        ${item.catatan_penanganan ? `
                            <div class="mt-3">
                                <div class="text-xs text-gray-400">
                                    Catatan
                                </div>
                                <div class="text-sm text-gray-700 mt-1 whitespace-pre-line">
                                    ${this.escapeHtml(item.catatan_penanganan)}
                                </div>
                            </div>
                        ` : ""}
                    </div>
                ` : ""}
                <div class="mt-5">
                    <div class="flex items-center gap-2 mb-3">
                        <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <i class="fa-solid fa-clock-rotate-left text-sm"></i>
                        </div>
                        <div>
                            <h3 class="text-sm font-semibold text-gray-800">
                                Riwayat Penanganan
                            </h3>
                            <p class="text-[11px] text-gray-400">
                                Rekam proses penanganan kasus
                            </p>
                        </div>
                    </div>
                    <div
                        id="bk-riwayat-penanganan"
                        class="rounded-xl border border-gray-100 bg-white p-3"
                    >
                        <div class="py-6 text-center text-xs text-gray-400">
                            Riwayat belum dimuat.
                        </div>
                    </div>
                </div>
                ${perlu ? `
                    <button
                        type="button"
                        onclick="BKMonitoringPelanggaranService.mulaiPenanganan(${Number(item.id)})"
                        class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition"
                    >
                        <i class="fa-solid fa-user-shield mr-2"></i>
                        Mulai Penanganan
                    </button>
                ` : ""}
                ${proses ? `
                    <div class="space-y-3 pt-1">
                        <div>
                            <label class="block text-xs font-medium text-gray-600 mb-1">
                                Tindakan Penanganan
                            </label>
                            <select
                                id="bk-tindakan-penanganan"
                                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Pilih tindakan</option>
                                <option value="Teguran">Teguran</option>
                                <option value="Pembinaan">Pembinaan</option>
                                <option value="Pemanggilan Siswa">Pemanggilan Siswa</option>
                                <option value="Pemanggilan Orang Tua">Pemanggilan Orang Tua</option>
                                <option value="Konseling">Konseling</option>
                                <option value="Surat Peringatan">Surat Peringatan</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-xs font-medium text-gray-600 mb-1">
                                Catatan Penanganan
                            </label>
                            <textarea
                                id="bk-catatan-penanganan"
                                rows="4"
                                placeholder="Tuliskan hasil atau catatan penanganan..."
                                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >${this.escapeHtml(item.catatan_penanganan || "")}</textarea>
                        </div>
                        <button
                            type="button"
                            onclick="BKMonitoringPelanggaranService.selesaikanPenanganan(${Number(item.id)})"
                            class="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition"
                        >
                            <i class="fa-solid fa-circle-check mr-2"></i>
                            Selesaikan Penanganan
                        </button>
                        <button
                            type="button"
                            onclick="BKMonitoringPelanggaranService.batalkanPenanganan(${Number(item.id)})"
                            class="w-full py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium text-sm transition"
                        >
                            <i class="fa-solid fa-rotate-left mr-2"></i>
                            Batalkan Penanganan
                        </button>
                    </div>
                ` : ""}
                ${selesai ? `
                    <div class="space-y-3 pt-1">
                        <button
                            type="button"
                            onclick="BKMonitoringPelanggaranService.ubahPenanganan(${Number(item.id)})"
                            class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition"
                        >
                            <i class="fa-solid fa-pen-to-square mr-2"></i>
                            Ubah Penanganan
                        </button>
                    </div>
                ` : ""}
            </div>
        `;
        modal.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");
        this.loadRiwayatPenanganan(id);
    },
    async mulaiPenanganan(id) {
        try {
            const user = AppState.currentUser;
            if (!user) {
                showToast("Data pengguna belum tersedia", true);
                return;
            }
            const item = (this.data || []).find(
                row => String(row.id) === String(id)
            );
            if (!item) {
                showToast("Data pelanggaran tidak ditemukan", true);
                return;
            }
            const konfirmasi = await Swal.fire({
                title: "Mulai Penanganan?",
                text: "Kasus ini akan ditandai sedang dalam proses penanganan.",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Ya, Mulai",
                cancelButtonText: "Batal",
                confirmButtonColor: "#2563eb"
            });
            if (!konfirmasi.isConfirmed) return;
            const now = new Date().toISOString();
            const username = user.username || null;
            const { error: updateError } = await window.supabaseClient
                .from("pelanggaran_siswa")
                .update({
                    status_penanganan: "Dalam Penanganan",
                    ditangani_oleh: username,
                    ditangani_at: now
                })
                .eq("id", id);
            if (updateError) throw updateError;
            const { error: historyError } = await window.supabaseClient
                .from("pelanggaran_penanganan")
                .insert({
                    pelanggaran_id: id,
                    status_dari: item.status_penanganan,
                    status_ke: "Dalam Penanganan",
                    dilakukan_oleh: username,
                    dilakukan_at: now
                });
            if (historyError) throw historyError;
            showToast("Penanganan berhasil dimulai");
            this.closeDetail();
            await this.load();
        } catch (error) {
            console.error(
                "BKMonitoringPelanggaranService.mulaiPenanganan:",
                error
            );
            showToast(
                error.message || "Gagal memulai penanganan",
                true
            );
        }
    },
    async selesaikanPenanganan(id) {
        try {
            const user = AppState.currentUser;
            if (!user) {
                showToast("Data pengguna belum tersedia", true);
                return;
            }
            const tindakan =
                document.getElementById(
                    "bk-tindakan-penanganan"
                )?.value || "";
            const catatan =
                document.getElementById(
                    "bk-catatan-penanganan"
                )?.value?.trim() || "";
            if (!tindakan) {
                showToast(
                    "Silakan pilih tindakan penanganan",
                    true
                );
                return;
            }
            if (!catatan) {
                showToast(
                    "Silakan isi catatan penanganan",
                    true
                );
                return;
            }
            const item = (this.data || []).find(
                row => String(row.id) === String(id)
            );
            if (!item) {
                showToast(
                    "Data pelanggaran tidak ditemukan",
                    true
                );
                return;
            }
            const konfirmasi = await Swal.fire({
                title: "Selesaikan Penanganan?",
                text: "Pastikan tindakan dan catatan penanganan sudah benar.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Ya, Selesaikan",
                cancelButtonText: "Batal",
                confirmButtonColor: "#16a34a"
            });
            if (!konfirmasi.isConfirmed) return;
            const now = new Date().toISOString();
            const username =
                user.username || null;
            const {
                error: updateError
            } = await window.supabaseClient
                .from("pelanggaran_siswa")
                .update({
                    status_penanganan: "Selesai",
                    ditangani_oleh: username,
                    ditangani_at: item.ditangani_at || now,
                    tindakan_penanganan: tindakan,
                    catatan_penanganan: catatan,
                    selesai_at: now
                })
                .eq("id", id);
            if (updateError) {
                throw updateError;
            }
            const {
                error: historyError
            } = await window.supabaseClient
                .from("pelanggaran_penanganan")
                .insert({
                    pelanggaran_id: id,
                    status_dari:
                        item.status_penanganan ||
                        "Dalam Penanganan",
                    status_ke: "Selesai",
                    dilakukan_oleh: username,
                    dilakukan_at: now,
                    tindakan: tindakan,
                    catatan: catatan
                });
            if (historyError) {
                throw historyError;
            }
            showToast(
                "Penanganan berhasil diselesaikan"
            );
            this.closeDetail();
            await this.load();
        } catch (error) {
            console.error(
                "BKMonitoringPelanggaranService.selesaikanPenanganan:",
                error
            );
            showToast(
                error.message ||
                "Gagal menyelesaikan penanganan",
                true
            );
        }
    },
    async batalkanPenanganan(id) {
        try {
            const user = AppState.currentUser;
            if (!user) {
                showToast(
                    "Data pengguna belum tersedia",
                    true
                );
                return;
            }
            const item = (this.data || []).find(
                row => String(row.id) === String(id)
            );
            if (!item) {
                showToast(
                    "Data pelanggaran tidak ditemukan",
                    true
                );
                return;
            }
            const konfirmasi = await Swal.fire({
                title: "Batalkan Penanganan?",
                text: "Kasus akan dikembalikan ke status Perlu Penanganan.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Ya, Batalkan",
                cancelButtonText: "Kembali",
                confirmButtonColor: "#dc2626"
            });
            if (!konfirmasi.isConfirmed) return;
            const now = new Date().toISOString();
            const username =
                user.username || null;
            const {
                error: updateError
            } = await window.supabaseClient
                .from("pelanggaran_siswa")
                .update({
                    status_penanganan:
                        "Perlu Penanganan",
                    ditangani_oleh: null,
                    ditangani_at: null,
                    tindakan_penanganan: null,
                    catatan_penanganan: null,
                    selesai_at: null
                })
                .eq("id", id);
            if (updateError) {
                throw updateError;
            }
            const {
                error: historyError
            } = await window.supabaseClient
                .from("pelanggaran_penanganan")
                .insert({
                    pelanggaran_id: id,
                    status_dari:
                        item.status_penanganan ||
                        "Dalam Penanganan",
                    status_ke:
                        "Perlu Penanganan",
                    dilakukan_oleh: username,
                    dilakukan_at: now,
                    tindakan: null,
                    catatan: null
                });
            if (historyError) {
                throw historyError;
            }
            showToast(
                "Penanganan berhasil dibatalkan"
            );
            this.closeDetail();
            await this.load();
        } catch (error) {
            console.error(
                "BKMonitoringPelanggaranService.batalkanPenanganan:",
                error
            );
            showToast(
                error.message ||
                "Gagal membatalkan penanganan",
                true
            );
        }
    },
    async ubahPenanganan(id) {
        try {
            const user = AppState.currentUser;
            if (!user) {
                showToast("Data pengguna belum tersedia", true);
                return;
            }
            const item = (this.data || []).find(
                row => String(row.id) === String(id)
            );
            if (!item) {
                showToast("Data pelanggaran tidak ditemukan", true);
                return;
            }
            const konfirmasi = await Swal.fire({
                title: "Ubah Penanganan?",
                text: "Kasus akan dikembalikan ke status Dalam Penanganan agar dapat diperbarui.",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Ya, Ubah",
                cancelButtonText: "Batal",
                confirmButtonColor: "#2563eb"
            });
            if (!konfirmasi.isConfirmed) return;
            const now = new Date().toISOString();
            const username = user.username || null;
            const { error: updateError } =
                await window.supabaseClient
                    .from("pelanggaran_siswa")
                    .update({
                        status_penanganan: "Dalam Penanganan",
                        ditangani_oleh: username,
                        ditangani_at: now,
                        selesai_at: null
                    })
                    .eq("id", id);
            if (updateError) throw updateError;
            const { error: historyError } =
                await window.supabaseClient
                    .from("pelanggaran_penanganan")
                    .insert({
                        pelanggaran_id: id,
                        status_dari: item.status_penanganan || "Selesai",
                        status_ke: "Dalam Penanganan",
                        dilakukan_oleh: username,
                        dilakukan_at: now,
                        tindakan: null,
                        catatan: "Penanganan dibuka kembali untuk dilakukan perubahan."
                    });
            if (historyError) throw historyError;
            showToast("Penanganan kembali ke proses");
            this.closeDetail();
            await this.load();
        } catch (error) {
            console.error(
                "BKMonitoringPelanggaranService.ubahPenanganan:",
                error
            );
            showToast(
                error.message || "Gagal mengubah penanganan",
                true
            );
        }
    },
    async loadRiwayatPenanganan(id) {
        const container = document.getElementById(
            "bk-riwayat-penanganan"
        );
        if (!container) return;
        container.innerHTML = `
            <div class="py-6 text-center">
                <i class="fa-solid fa-spinner fa-spin text-blue-600 text-lg"></i>
                <p class="text-xs text-gray-500 mt-2">
                    Memuat riwayat penanganan...
                </p>
            </div>
        `;
        try {
            const { data, error } =
                await window.supabaseClient
                    .from("pelanggaran_penanganan")
                    .select(`
                        id,
                        pelanggaran_id,
                        status_dari,
                        status_ke,
                        dilakukan_oleh,
                        dilakukan_at,
                        tindakan,
                        catatan
                    `)
                    .eq("pelanggaran_id", id)
                    .order("dilakukan_at", {
                        ascending: false
                    });
            if (error) throw error;
            const riwayat = data || [];
            if (!riwayat.length) {
                container.innerHTML = `
                    <div class="py-6 text-center">
                        <div class="w-10 h-10 mx-auto rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                            <i class="fa-solid fa-clock-rotate-left"></i>
                        </div>
                        <p class="text-sm text-gray-500 mt-2">
                            Belum ada riwayat penanganan.
                        </p>
                        <p class="text-xs text-gray-400 mt-1">
                            Riwayat akan muncul setelah proses penanganan dilakukan.
                        </p>
                    </div>
                `;
                return;
            }
            const usernames = [
                ...new Set(
                    riwayat
                        .map(item => item.dilakukan_oleh)
                        .filter(Boolean)
                )
            ];
            let guruMap = {};
            if (usernames.length) {
                const { data: users, error: userError } =
                    await window.supabaseClient
                        .from("users")
                        .select("username, nama_lengkap")
                        .in("username", usernames);
                if (userError) throw userError;
                (users || []).forEach(user => {
                    guruMap[String(user.username)] =
                        user.nama_lengkap ||
                        user.username;
                });
            }
            container.innerHTML = riwayat
                .map((item, index) =>
                    this.renderRiwayatItem(
                        item,
                        guruMap,
                        index,
                        riwayat.length
                    )
                )
                .join("");
        } catch (error) {
            console.error(
                "BKMonitoringPelanggaranService.loadRiwayatPenanganan:",
                error
            );
            container.innerHTML = `
                <div class="py-6 text-center">
                    <div class="w-10 h-10 mx-auto rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                        <i class="fa-solid fa-circle-exclamation"></i>
                    </div>
                    <p class="text-sm text-red-600 mt-2">
                        Gagal memuat riwayat penanganan.
                    </p>
                    <p class="text-xs text-gray-400 mt-1">
                        ${this.escapeHtml(
                            error.message || ""
                        )}
                    </p>
                </div>
            `;
        }
    },
    renderRiwayatItem(
        item,
        guruMap,
        index,
        total
    ) {
        const status =
            item.status_ke || "-";
        const username =
            item.dilakukan_oleh || "-";
        const namaGuru =
            guruMap[String(username)] ||
            username;
        const tanggal =
            this.formatTanggalWaktu(
                item.dilakukan_at
            );
        const statusLower =
            status.toLowerCase();
        let icon =
            "fa-clock";
        let iconBg =
            "bg-gray-100 text-gray-500";
        if (
            statusLower ===
            "dalam penanganan"
        ) {
            icon =
                "fa-hand-holding-medical";
            iconBg =
                "bg-blue-100 text-blue-600";
        } else if (
            statusLower === "selesai"
        ) {
            icon =
                "fa-circle-check";
            iconBg =
                "bg-green-100 text-green-600";
        } else if (
            statusLower ===
            "perlu penanganan"
        ) {
            icon =
                "fa-triangle-exclamation";
            iconBg =
                "bg-red-100 text-red-600";
        }
        const isLast =
            index === total - 1;
        return `
            <div class="relative flex gap-3">
                <div class="flex flex-col items-center flex-shrink-0">
                    <div class="w-9 h-9 rounded-full ${iconBg} flex items-center justify-center">
                        <i class="fa-solid ${icon} text-sm"></i>
                    </div>
                    ${!isLast ? `
                        <div class="w-px flex-1 bg-gray-200 my-1"></div>
                    ` : ""}
                </div>
                <div class="flex-1 min-w-0 pb-5">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <div class="font-semibold text-gray-800 text-sm">
                                ${this.escapeHtml(status)}
                            </div>
                            <div class="text-[11px] text-gray-400 mt-0.5">
                                ${this.escapeHtml(tanggal)}
                            </div>
                        </div>
                    </div>
                    <div class="text-xs text-gray-600 mt-2">
                        <i class="fa-solid fa-user mr-1 text-gray-400"></i>
                        ${this.escapeHtml(namaGuru)}
                    </div>
                    ${item.tindakan ? `
                        <div class="mt-2 p-2.5 rounded-lg bg-blue-50">
                            <div class="text-[11px] font-semibold text-blue-700">
                                Tindakan
                            </div>
                            <div class="text-xs text-blue-900 mt-0.5">
                                ${this.escapeHtml(item.tindakan)}
                            </div>
                        </div>
                    ` : ""}
                    ${item.catatan ? `
                        <div class="mt-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                            <div class="text-[11px] font-semibold text-gray-600">
                                Catatan
                            </div>
                            <div class="text-xs text-gray-700 mt-0.5 whitespace-pre-line">
                                ${this.escapeHtml(item.catatan)}
                            </div>
                        </div>
                    ` : ""}
                </div>
            </div>
        `;
    },
    closeDetail() {
        const modal = document.getElementById("modal-bk-detail-pelanggaran");
        if (!modal) return;
        modal.classList.add("hidden");
        document.body.classList.remove("overflow-hidden");
    },
    formatTanggalWaktu(value) {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "-";
        }
        return date.toLocaleString(
            "id-ID",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
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

const BKRiwayatPenangananService = {
    data: [],
    guruMap: {},
    eventsReady: false,
    async init() {
        try {
            await this.loadGuru();
            await this.load();
            this.setupEvents();
        } catch (error) {
            console.error(
                "BKRiwayatPenangananService.init:",
                error
            );
            showToast(
                "Gagal memuat riwayat penanganan",
                true
            );
        }
    },
    setupEvents() {
        if (this.eventsReady) return;
        this.eventsReady = true;
        const search =
            document.getElementById(
                "bk-riwayat-search"
            );
        const kelas =
            document.getElementById(
                "bk-riwayat-kelas"
            );
        const guru =
            document.getElementById(
                "bk-riwayat-guru"
            );
        const status =
            document.getElementById(
                "bk-riwayat-status"
            );
        search?.addEventListener(
            "input",
            () => this.filterLocal()
        );
        kelas?.addEventListener(
            "change",
            () => this.filterLocal()
        );
        guru?.addEventListener(
            "change",
            () => this.filterLocal()
        );
        status?.addEventListener(
            "change",
            () => this.filterLocal()
        );
    },
    async loadGuru() {
        const { data, error } =
            await window.supabaseClient
                .from("users")
                .select(
                    "username,nama_lengkap"
                )
                .eq("role", "konseling")
                .order(
                    "nama_lengkap",
                    {
                        ascending: true
                    }
                );
        if (error) throw error;
        this.guruMap = {};
        (data || []).forEach(guru => {
            this.guruMap[
                String(guru.username)
            ] =
                guru.nama_lengkap ||
                guru.username;
        });
        const select =
            document.getElementById(
                "bk-riwayat-guru"
            );
        if (!select) return;
        select.innerHTML = `
            <option value="">
                Semua Guru
            </option>
            ${(data || []).map(guru => `
                <option value="${this.escapeAttribute(guru.username)}">
                    ${this.escapeHtml(
                        guru.nama_lengkap ||
                        guru.username
                    )}
                </option>
            `).join("")}
        `;
    },
    async load() {
        const list =
            document.getElementById(
                "bk-riwayat-list"
            );
        if (!list) return;
        list.innerHTML = `
            <div class="p-8 text-center">
                <i class="fa-solid fa-spinner fa-spin text-indigo-600 text-xl"></i>
                <p class="text-sm text-gray-500 mt-2">
                    Memuat riwayat penanganan...
                </p>
            </div>
        `;
        try {
            const { data, error } =
                await window.supabaseClient
                    .from(
                        "pelanggaran_penanganan"
                    )
                    .select(`
                        id,
                        pelanggaran_id,
                        status_dari,
                        status_ke,
                        dilakukan_oleh,
                        dilakukan_at,
                        tindakan,
                        catatan
                    `)
                    .order(
                        "dilakukan_at",
                        {
                            ascending: false
                        }
                    );
            if (error) throw error;
            this.data = data || [];
            await this.loadPelanggaran();
        } catch (error) {
            console.error(
                "BKRiwayatPenangananService.load:",
                error
            );
            list.innerHTML = `
                <div class="p-8 text-center">
                    <div class="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                        <i class="fa-solid fa-circle-exclamation"></i>
                    </div>
                    <p class="text-sm text-red-600 mt-3">
                        Gagal memuat riwayat penanganan.
                    </p>
                    <p class="text-xs text-gray-400 mt-1">
                        ${this.escapeHtml(
                            error.message || ""
                        )}
                    </p>
                </div>
            `;
        }
    },
    async loadPelanggaran() {
        const ids = [
            ...new Set(
                (this.data || [])
                    .map(item =>
                        item.pelanggaran_id
                    )
                    .filter(Boolean)
            )
        ];
        if (!ids.length) {
            this.data = [];
            this.filterLocal();
            return;
        }
        const { data, error } =
            await window.supabaseClient
                .from("pelanggaran_siswa")
                .select(`
                    id,
                    tanggal,
                    waktu,
                    username,
                    nama_lengkap,
                    kategori,
                    jenis_pelanggaran,
                    poin
                `)
                .in("id", ids);
        if (error) throw error;
        const map = {};
        (data || []).forEach(item => {
            map[String(item.id)] = item;
        });
        this.data = this.data.map(
            item => ({
                ...item,
                pelanggaran:
                    map[
                        String(
                            item.pelanggaran_id
                        )
                    ] || null
            })
        );
        this.loadKelas();
        this.filterLocal();
    },
    loadKelas() {
        const select =
            document.getElementById(
                "bk-riwayat-kelas"
            );
        if (!select) return;
        const kelas = [
            ...new Set(
                (this.data || [])
                    .map(item =>
                        String(
                            item.pelanggaran?.kategori ||
                            ""
                        ).trim()
                    )
                    .filter(Boolean)
            )
        ].sort();
        select.innerHTML = `
            <option value="">
                Semua Kelas
            </option>
            ${kelas.map(kelas => `
                <option value="${this.escapeAttribute(kelas)}">
                    ${this.escapeHtml(kelas)}
                </option>
            `).join("")}
        `;
    },
    filterLocal() {
        const search =
            String(
                document.getElementById(
                    "bk-riwayat-search"
                )?.value || ""
            )
                .trim()
                .toLowerCase();
        const kelas =
            document.getElementById(
                "bk-riwayat-kelas"
            )?.value || "";
        const guru =
            document.getElementById(
                "bk-riwayat-guru"
            )?.value || "";
        const status =
            document.getElementById(
                "bk-riwayat-status"
            )?.value || "";
        let data =
            this.data || [];
        if (search) {
            data = data.filter(item => {
                const pel =
                    item.pelanggaran || {};
                return (
                    String(
                        pel.nama_lengkap || ""
                    )
                        .toLowerCase()
                        .includes(search) ||
                    String(
                        pel.username || ""
                    )
                        .toLowerCase()
                        .includes(search) ||
                    String(
                        pel.jenis_pelanggaran || ""
                    )
                        .toLowerCase()
                        .includes(search)
                );
            });
        }
        if (kelas) {
            data = data.filter(
                item =>
                    String(
                        item.pelanggaran?.kategori ||
                        ""
                    ) === String(kelas)
            );
        }
        if (guru) {
            data = data.filter(
                item =>
                    String(
                        item.dilakukan_oleh || ""
                    ) === String(guru)
            );
        }
        if (status) {
            data = data.filter(
                item =>
                    String(
                        item.status_ke || ""
                    ) === String(status)
            );
        }
        this.render(data);
    },
    render(data) {
        const list =
            document.getElementById(
                "bk-riwayat-list"
            );
        const empty =
            document.getElementById(
                "bk-riwayat-empty"
            );
        const count =
            document.getElementById(
                "bk-riwayat-count"
            );
        if (!list) return;
        if (count) {
            count.textContent =
                data.length;
        }
        if (!data.length) {
            list.innerHTML = "";
            empty?.classList.remove(
                "hidden"
            );
            return;
        }
        empty?.classList.add(
            "hidden"
        );
        list.innerHTML =
            data
                .map(item =>
                    this.renderItem(item)
                )
                .join("");
    },
    renderItem(item) {
        const pel =
            item.pelanggaran || {};
        const nama =
            pel.nama_lengkap ||
            pel.username ||
            "-";
        const guru =
            this.guruMap[
                String(
                    item.dilakukan_oleh || ""
                )
            ] ||
            item.dilakukan_oleh ||
            "-";
        const status =
            item.status_ke ||
            "-";
        let statusClass =
            "bg-gray-100 text-gray-600";
        if (
            status ===
            "Perlu Penanganan"
        ) {
            statusClass =
                "bg-red-100 text-red-700";
        } else if (
            status ===
            "Dalam Penanganan"
        ) {
            statusClass =
                "bg-blue-100 text-blue-700";
        } else if (
            status ===
            "Selesai"
        ) {
            statusClass =
                "bg-green-100 text-green-700";
        }
        return `
            <button
                type="button"
                onclick="BKRiwayatPenangananService.openDetail(${Number(item.pelanggaran_id)})"
                class="w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <div class="font-semibold text-gray-800 truncate">
                            ${this.escapeHtml(nama)}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                            ${this.escapeHtml(
                                pel.kategori || "-"
                            )}
                            •
                            ${this.escapeHtml(
                                pel.jenis_pelanggaran || "-"
                            )}
                        </div>
                        <div class="text-xs text-gray-400 mt-2">
                            ${this.escapeHtml(
                                this.formatTanggalWaktu(
                                    item.dilakukan_at
                                )
                            )}
                        </div>
                        <div class="text-xs text-gray-500 mt-2">
                            Ditangani oleh:
                            <strong class="text-gray-700">
                                ${this.escapeHtml(guru)}
                            </strong>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-2 flex-shrink-0">
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusClass}">
                            ${this.escapeHtml(status)}
                        </span>
                        <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                    </div>
                </div>
            </button>
        `;
    },
    openDetail(id) {
        if (
            typeof BKMonitoringPelanggaranService !==
            "undefined"
        ) {
            BKMonitoringPelanggaranService
                .openDetail(id);
        }
    },
    formatTanggalWaktu(value) {
        if (!value) return "-";
        const date =
            new Date(value);
        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "-";
        }
        return date.toLocaleString(
            "id-ID",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    },
    escapeHtml(value) {
        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    },
    escapeAttribute(value) {
        return this.escapeHtml(
            value
        );
    }
};