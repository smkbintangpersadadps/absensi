// ===============================
// HISTORY + DASHBOARD STATS
// ===============================
async function loadHistory(resetFilter = false) {
    showLoader("Memuat riwayat...");
    try {
        const user = AppState.currentUser;
        if (!user) return;
        const role =
            String(user.role || "")
                .trim()
                .toLowerCase();
        // ===============================
        // RESET FILTER
        // ===============================
        if (resetFilter) {
            initStudentHistoryFilter();
        }
        const monthEl =
            document.getElementById(
                "student-history-month"
            );
        const yearEl =
            document.getElementById(
                "student-history-year"
            );
        const bulan =
            Number(monthEl?.value);
        const tahun =
            Number(yearEl?.value);
        // ===============================
        // RANGE TANGGAL
        // ===============================
        const lastDay = new Date(
            tahun,
            bulan,
            0
        ).getDate();
        const startDate =
            `${tahun}-${String(bulan).padStart(2,"0")}-01`;
        const endDate =
            `${tahun}-${String(bulan).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;
        // ===============================
        // RIWAYAT ABSENSI
        // ===============================
        let query =
            window.supabaseClient
                .from("absensi")
                .select("*")
                .gte("waktu", startDate)
                .lte("waktu", endDate)
                .order("waktu", {
                    ascending: false
                });
        // siswa hanya lihat miliknya
        if (
            role === "siswa" ||
            role === "peserta"
        ) {
            query =
                query.eq(
                    "username",
                    user.username
                );
        }
        const {
            data: absensi,
            error: absenError
        } = await query;
        if (absenError) {
            throw absenError;
        }
        // ===============================
        // FORMAT AGAR COCOK
        // DENGAN UI LAMA
        // ===============================
        AppState.riwayat =
            (absensi || []).map(row => {
                const dt =
                    new Date(row.waktu);
                return {
                    id:
                        row.id,
                    nama:
                        row.nama_lengkap,
                    kategori:
                        row.kategori,
                    tipe:
                        row.tipe,
                    timestamp:
                        dt.toLocaleDateString(
                            "id-ID"
                        ) +
                        " " +
                        dt.toLocaleTimeString(
                            "id-ID",
                            {
                                hour12: false
                            }
                        ),
                    fotoUrl:
                        row.foto_url,
                    namaIndustri:
                        row.nama_industri,
                    maps:
                        row.maps_url,
                    lat:
                        row.latitude,
                    lng:
                        row.longitude,
                    jarak:
                        Number(
                            row.jarak || 0
                        )
                };
            });
        // ===============================
        // KHUSUS SISWA
        // AMBIL STATUS HARIAN
        // ===============================
        if (
            role === "siswa" ||
            role === "peserta"
        ) {
            const {
                data: statusData,
                error: statusError
            } = await window.supabaseClient
                .from("status_harian")
                .select("*")
                .eq(
                    "username",
                    user.username
                )
                .gte(
                    "tanggal",
                    startDate
                )
                .lte(
                    "tanggal",
                    endDate
                )
                .order(
                    "tanggal",
                    {
                        ascending: false
                    }
                );
            if (statusError) {
                throw statusError;
            }
            const formattedStatus =
                (statusData || []).map(
                    row => ({
                        id:
                            row.id,
                        tanggal:
                            new Date(
                                row.tanggal
                            )
                            .toLocaleDateString(
                                "id-ID"
                            ),
                        status:
                            row.status,
                        approval:
                            row.approval,
                        keterangan:
                            row.keterangan
                    })
                );
            renderStudentHistoryCards(
                AppState.riwayat,
                formattedStatus
            );
        }
        else {
            renderHistoryTable(
                AppState.riwayat
            );
        }
    }
    catch (error) {
        console.error(
            "Load history error:",
            error
        );
        showToast(
            "Gagal memuat riwayat",
            true
        );
    }
    finally {
        hideLoader();
    }
}
function renderHistoryTable(data) {
    const tbody = document.getElementById("table-history-body");
    if (!tbody) return;
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center p-4">
                    Belum ada data absensi
                </td>
            </tr>
        `;
        return;
    }
    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${item.timestamp}</td>
            <td>${item.nama}</td>
            <td>${item.kategori || '-'}</td>
            <td>${item.tipe}</td>
            <td>${item.jarak ? Number(item.jarak).toFixed(2) : "-"} m </td>
            <td>
                ${
                    item.fotoUrl && item.fotoUrl !== "Tidak ada foto"
                        ? `<a href="${item.fotoUrl}" target="_blank">Lihat</a>`
                        : "-"
                }
            </td>
        </tr>
    `).join("");
}
// ===============================
// ADMIN DASHBOARD
// ===============================
async function loadAdminDashboardStats() {
    try {
        const users = await ApiService.call({
            action: "get_users"
        });
        const riwayat = await ApiService.call({
            action: "get_riwayat",
            role: "admin",
            username: ""
        });
        document.getElementById("stat-total-peserta").innerText =
            users.length;
        document.getElementById("stat-total-riwayat").innerText =
            riwayat.length;
        const today = new Date().toLocaleDateString("id-ID");
        const todayCount = riwayat.filter(item =>
            item.timestamp.includes(today)
        ).length;
        document.getElementById("stat-absen-today").innerText =
            todayCount;
    } catch (error) {
        console.error(error);
    }
}
//Riwayat Wali
async function getWaliHistoryPerHari(mode, user) {
    let siswa = [];
    // =================================
    // AMBIL SISWA
    // =================================
    if (mode === "wali") {
        const { data, error } =
            await window.supabaseClient
                .from("users")
                .select(`
                    username,
                    nama_lengkap,
                    kategori,
                    lokasi_id
                `)
                .eq("role", "siswa")
                .eq(
                    "kategori",
                    user.kategori
                );
        if (error) throw error;
        siswa = data || [];
    } else {
        const { data, error } =
            await window.supabaseClient
                .from("users")
                .select(`
                    username,
                    nama_lengkap,
                    kategori,
                    lokasi_id
                `)
                .eq("role", "siswa")
                .eq(
                    "p_id",
                    user.pId
                );
        if (error) throw error;
        siswa = data || [];
    }
    const usernames =
        siswa.map(s => s.username);
    if (!usernames.length) {
        return [];
    }
    // =================================
    // LOKASI
    // =================================
    const lokasiIds =
        [...new Set(
            siswa
                .map(s => s.lokasi_id)
                .filter(Boolean)
        )];
    let lokasiMap = {};
    if (lokasiIds.length) {
        const {
            data: lokasiData
        } = await window.supabaseClient
            .from("lokasi")
            .select("*")
            .in(
                "lokasi_id",
                lokasiIds
            );
        lokasiMap =
            Object.fromEntries(
                (lokasiData || [])
                .map(l => [
                    l.lokasi_id,
                    l
                ])
            );
    }
    // =================================
    // TANGGAL HARI INI (LOCAL)
    // =================================
    const today =
        new Date()
            .toLocaleDateString("sv-SE");
    // =================================
    // ABSENSI
    // =================================
    const {
        data: absensiData,
        error: absensiError
    } = await window.supabaseClient
        .from("absensi")
        .select("*")
        .in(
            "username",
            usernames
        );
    if (absensiError) {
        throw absensiError;
    }
    // Filter hari ini di JS
    const absensiHariIni =
        (absensiData || []).filter(a => {
            const tanggal =
                new Date(a.waktu)
                .toLocaleDateString("sv-SE");
            return tanggal === today;
        });
    console.log(
        "ABSENSI HARI INI",
        absensiHariIni
    );
    // =================================
    // STATUS HARIAN
    // =================================
    const {
        data: statusData,
        error: statusError
    } = await window.supabaseClient
        .from("status_harian")
        .select("*")
        .in(
            "username",
            usernames
        )
        .eq(
            "tanggal",
            today
        );
    if (statusError) {
        throw statusError;
    }
    const statusMap =
        Object.fromEntries(
            (statusData || [])
            .map(s => [
                s.username,
                s
            ])
        );
    // =================================
    // MAP ABSENSI
    // =================================
    const absensiMap = {};
    absensiHariIni.forEach(a => {
        if (!absensiMap[a.username]) {
            absensiMap[a.username] = [];
        }
        absensiMap[a.username].push(a);
    });
    // =================================
    // MERGE DATA
    // =================================
    return siswa.map(s => {
        const lokasi =
            lokasiMap[s.lokasi_id] || {};
        const absensi =
            absensiMap[s.username] || [];
        const status =
            statusMap[s.username];     
        const masuk =
            absensi.find(a => {
                const tipe =
                    String(a.tipe || "")
                    .trim()
                    .toLowerCase();
                return tipe.includes("masuk");
            });
        const pulang =
            absensi.find(a => {
                const tipe =
                    String(a.tipe || "")
                    .trim()
                    .toLowerCase();
                return (
                    tipe.includes("pulang") ||
                    tipe.includes("keluar") ||
                    tipe.includes("check out")
                );
            });
        let keterangan =
            "Belum Ada Keterangan";
        if (masuk && pulang) {
            keterangan =
                "Hadir Lengkap";
        } else if (masuk) {
            keterangan =
                "Sudah Masuk";
        } else if (pulang) {
            keterangan =
                "Pulang Saja";
        } else if (status) {
            const approval =
                String(status.approval || "")
                .trim()
                .toLowerCase();
            if (approval === "pending") {
                keterangan =
                    `Pending ${status.status}`;
            } else if (approval === "approved") {
                keterangan =
                    status.status;
            }
        }
        return {
            nama:
                s.nama_lengkap,
            kategori:
                s.kategori,
            industri:
                lokasi.nama_industri || "-",
            jamMasuk:
                masuk
                    ? formatJamOnly(
                        masuk.waktu
                    )
                    : "-",
            jamPulang:
                pulang
                    ? formatJamOnly(
                        pulang.waktu
                    )
                    : "-",
            keterangan
        };
    });
}

// RIWAYAT WALI
async function loadWaliHistory(useLoader = false) {
    try {
        const user = AppState.currentUser;
        if (!user) return;

        if (!AppState.historyMode) {
            AppState.historyMode = "wali";
        }
        if (useLoader) {
            showLoader("Memuat riwayat absensi...");
        }
        const siswa =
            await getWaliHistoryPerHari(
                AppState.historyMode,
                user
            );
        const emptyBox = document.getElementById("wali-history-empty");
        const tableWrapper = document.getElementById("wali-history-table-wrapper");
        const tbody = document.getElementById("wali-riwayat-body");
        if (!tbody) return;
        if ($.fn.DataTable.isDataTable("#wali-table")) {
            $("#wali-table").DataTable().destroy();
        }
        if (emptyBox) {
            emptyBox.classList.add("hidden");
            emptyBox.innerHTML = "";
        }
        if (tableWrapper) {
            tableWrapper.classList.remove("hidden");
        }
        if (AppState.historyMode === "wali" && siswa.length === 0) {
            if (tableWrapper) {
                tableWrapper.classList.add("hidden");
            }
            if (emptyBox) {
                emptyBox.classList.remove("hidden");
                emptyBox.innerHTML = `
                    <p>
                        Tidak memiliki siswa yang sedang PKL sebagai <b>Wali Kelas</b>.
                    </p>
                    <button onclick="setHistoryMode('pembimbing')"
                        class="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">
                        Buka Pembimbing PKL
                    </button>
                `;
            }
            return;
        }
        if (AppState.historyMode === "pembimbing" && siswa.length === 0) {
            if (tableWrapper) {
                tableWrapper.classList.add("hidden");
            }
            if (emptyBox) {
                emptyBox.classList.remove("hidden");
                emptyBox.innerHTML = `
                    <p>
                        Anda tidak sedang menjadi <b>Pembimbing PKL</b>.
                    </p>
                    <button onclick="setHistoryMode('wali')"
                        class="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">
                        Buka Wali Kelas
                    </button>
                `;
            }
            return;
        }
        if (!siswa.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="p-4 text-center text-gray-500">
                        Belum ada riwayat absensi
                    </td>
                </tr>
            `;
            return;
        } else {
            console.log("DATA SISWA HISTORY", siswa);
            tbody.innerHTML =
                siswa.map(s => `
                    <tr>
                        <td>
                            ${s.nama}
                        </td>
                        <td>
                            ${s.kategori}
                        </td>
                        <td>
                            ${s.industri}
                        </td>
                        <td>
                            ${s.jamMasuk}
                        </td>
                        <td>
                            ${s.jamPulang}
                        </td>
                        <td>
                            ${s.keterangan}
                        </td>
                    </tr>
                `).join("");
        }
        $("#wali-table").DataTable({
            pageLength: 10,
            lengthMenu: [10, 25, 50, 100],
            ordering: true,
            searching: true,
            scrollX: true,
            autoWidth: false,
            destroy: true,
            language: {
                search: "Cari:",
                lengthMenu: "Tampilkan _MENU_ data",
                info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
                paginate: {
                    next: "›",
                    previous: "‹"
                },
                zeroRecords: "Data tidak ditemukan",
                infoEmpty: "Tidak ada data",
                infoFiltered: "(difilter dari _MAX_ total data)"
            }
        });
    } catch (error) {
        console.error("Wali history error:", error);
        showToast("Gagal memuat riwayat wali", true);
    } finally {
        if (useLoader) {
            hideLoader();
        }
    }
}

// MODE WALI / PEMBIMBING
function setHistoryMode(mode) {
    AppState.historyMode =
        mode;
    const btnWali =
        document.getElementById(
            "btn-history-mode-wali"
        );
    const btnPembimbing =
        document.getElementById(
            "btn-history-mode-pembimbing"
        );
    btnWali?.classList.remove(
        "bg-indigo-600",
        "text-white"
    );
    btnPembimbing?.classList.remove(
        "bg-indigo-600",
        "text-white"
    );
    btnWali?.classList.add(
        "bg-slate-100",
        "text-slate-700"
    );
    btnPembimbing?.classList.add(
        "bg-slate-100",
        "text-slate-700"
    );
    if (mode === "wali") {
        btnWali?.classList.remove(
            "bg-slate-100",
            "text-slate-700"
        );
        btnWali?.classList.add(
            "bg-indigo-600",
            "text-white"
        );
    } else {
        btnPembimbing?.classList.remove(
            "bg-slate-100",
            "text-slate-700"
        );
        btnPembimbing?.classList.add(
            "bg-indigo-600",
            "text-white"
        );
    }
    HistoryService.load(true);
}

// RIWAYAT STATUS APPROVE SISWA
async function loadStatusHistory(useLoader = false) {
    try {
        const user = AppState.currentUser;
        if (!user) return;
        if (useLoader) {
            showLoader("Memuat riwayat status...");
        }
        // =========================
        // AMBIL DATA STATUS HARIAN
        // =========================
        const {
            data,
            error
        } = await window.supabaseClient
            .from("status_harian")
            .select("*")
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
        const list =
            document.getElementById(
                "status-history-list"
            );
        if (!list) return;
        if (!data || !data.length) {
            list.innerHTML = `
                <div class="bg-white rounded-2xl p-4 shadow text-center text-slate-500">
                    Belum ada riwayat pengajuan status.
                </div>
            `;
            return;
        }
        list.innerHTML = await Promise.all(
            data.map(async item => {
                // =========================
                // NAMA APPROVER
                // =========================
                let approvedByNama = "";
                if (item.approved_by) {
                    const {
                        data: approver
                    } = await window.supabaseClient
                        .from("users")
                        .select("nama_lengkap")
                        .eq(
                            "username",
                            item.approved_by
                        )
                        .maybeSingle();
                    approvedByNama =
                        approver?.nama_lengkap || "";
                }
                const createdAt =
                    item.created_at
                        ? new Date(
                            item.created_at
                          ).toLocaleString("id-ID")
                        : "-";
                const approvedAt =
                    item.approved_at
                        ? new Date(
                            item.approved_at
                          ).toLocaleString("id-ID")
                        : "-";
                return `
                <div class="bg-white rounded-2xl p-4 shadow border border-slate-100">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <div class="font-bold text-slate-800">
                                ${item.tanggal || "-"}
                            </div>
                            <div class="text-xs text-slate-500 mt-1">
                                Diajukan: ${createdAt}
                            </div>
                        </div>
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(item.status)}">
                            ${item.status || "-"}
                        </span>
                    </div>
                    ${
                        item.keterangan
                        ? `
                            <div class="mt-3 text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
                                ${item.keterangan}
                            </div>
                        `
                        : `
                            <div
                                class="mt-3 flex items-center gap-2
                                    px-3 py-2 rounded-xl
                                    bg-slate-50 border border-slate-200
                                    text-slate-500 text-sm">
                                <i class="fa-regular fa-comment-dots"></i>
                                <span>Tidak ada keterangan tambahan</span>
                            </div>
                        `
                    }
                    ${
                        item.foto_bukti
                        ? `
                            <button
                                onclick="previewApprovalBukti('${item.foto_bukti}')"
                                class="mt-3 w-full flex items-center justify-center gap-2
                                    py-2 rounded-xl
                                    bg-indigo-50 text-indigo-700
                                    border border-indigo-100
                                    hover:bg-indigo-100
                                    text-sm font-medium">
                                <i class="fa-solid fa-camera"></i>
                                Lihat Bukti Pengajuan
                            </button>
                        `
                        : `
                            <div
                                class="mt-3 flex items-center gap-3
                                    p-3 rounded-xl
                                    bg-slate-50 border border-slate-200">
                                <div
                                    class="w-10 h-10 rounded-full
                                        bg-slate-100
                                        flex items-center justify-center">
                                    <i class="fa-solid fa-file-circle-xmark text-slate-400"></i>
                                </div>
                                <div>
                                    <div class="text-sm font-medium text-slate-700">
                                        Tanpa Lampiran
                                    </div>
                                    <div class="text-xs text-slate-500">
                                        Pengajuan ini tidak menyertakan bukti pendukung.
                                    </div>
                                </div>
                            </div>
                        `
                    }
                    <div class="mt-3 flex items-center justify-between">
                        <span class="text-xs text-slate-500">
                            Status Approval
                        </span>
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${getApprovalBadgeClass(item.approval)}">
                            ${item.approval || "Pending"}
                        </span>
                    </div>
                    ${
                        item.approval === "Pending"
                        ? `
                            <button
                                onclick="cancelStatusRequest('${item.id}')"
                                class="mt-3 w-full px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium">
                                <i class="fa-solid fa-xmark mr-1"></i>
                                Batalkan Pengajuan
                            </button>
                          `
                        : ""
                    }
                    ${
                        approvedByNama
                        ? `
                            <div class="mt-2 text-[11px] flex items-center justify-between">
                                <span class="font-medium text-slate-600">
                                    Diproses oleh : ${approvedByNama}
                                </span>
                                <span class="font-medium text-slate-600">
                                    Waktu Proses : ${createdAt}
                                </span>
                            </div>
                          `
                        : ""
                    }
                </div>
                `;
            })
        ).then(html =>
            html.join("")
        );
    }
    catch (error) {
        console.error(
            "Status history error:",
            error
        );
        showToast(
            "Gagal memuat riwayat status",
            true
        );
    }
    finally {
        hideLoader();
    }
}

//Preview Riwayat Status
function previewStatusBukti(url) {
    if (!url) {
        Swal.fire({
            icon: "warning",
            title: "Bukti Tidak Tersedia",
            text: "File bukti tidak ditemukan."
        });
        return;
    }
    Swal.fire({
        title: "Bukti Pengajuan",
        width: 650,
        showCloseButton: true,
        showConfirmButton: false,
        html: `
            <div class="text-center">
                <img
                    src="${url}"
                    onerror="
                        this.style.display='none';
                        document.getElementById('status-bukti-expired').style.display='flex';
                    "
                    style="
                        max-width:100%;
                        max-height:450px;
                        border-radius:12px;
                        border:1px solid #e2e8f0;
                        box-shadow:0 8px 24px rgba(0,0,0,.15);
                    "
                >
                <div
                    id="status-bukti-expired"
                    style="
                        display:none;
                        flex-direction:column;
                        align-items:center;
                        justify-content:center;
                        padding:30px;
                        border:2px dashed #cbd5e1;
                        border-radius:12px;
                        background:#f8fafc;
                    ">
                    <i
                        class="fa-solid fa-image"
                        style="
                            font-size:48px;
                            color:#94a3b8;
                            margin-bottom:12px;
                        ">
                    </i>
                    <div
                        style="
                            font-size:15px;
                            font-weight:600;
                            color:#334155;
                            margin-bottom:6px;
                        ">
                        Bukti Tidak Tersedia
                    </div>
                    <div
                        style="
                            font-size:12px;
                            color:#64748b;
                            line-height:1.6;
                        ">
                        File bukti telah dihapus otomatis
                        oleh sistem penyimpanan.
                    </div>
                </div>
            </div>
        `
    });
}

//RIWAYAT SISWA
function renderStudentHistoryCards(riwayat, statusData = []) {
    const container = document.getElementById("student-history-list");
    if (!container) return;
    const monthEl = document.getElementById("student-history-month");
    const yearEl = document.getElementById("student-history-year");
    const selectedMonth = Number(monthEl?.value || (new Date().getMonth() + 1));
    const selectedYear = Number(yearEl?.value || new Date().getFullYear());
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    let jumlahHari = new Date(selectedYear, selectedMonth, 0).getDate();
    if (selectedMonth === currentMonth && selectedYear === currentYear) {
        jumlahHari = now.getDate();
    }
    // ===============================
    // GROUP ABSENSI
    // ===============================
    const grouped = {};
    (riwayat || []).forEach(r => {
        const tanggalText = r.timestamp?.split(" ")[0];
        if (!tanggalText) return;
        const [day, month, year] = tanggalText.split("/").map(Number);
        if (month !== selectedMonth || year !== selectedYear) return;
        if (!grouped[day]) {
            grouped[day] = {
                masuk: null,
                pulang: null
            };
        }
        if (r.tipe === "Masuk") grouped[day].masuk = r;
        if (r.tipe === "Pulang") grouped[day].pulang = r;
    });
    // ===============================
    // GROUP STATUS HARIAN
    // ===============================
    const statusMap = {};
    (statusData || []).forEach(s => {
        if (!s.tanggal) return;
        const [day, month, year] = s.tanggal.split("/").map(Number);
        if (month !== selectedMonth || year !== selectedYear) return;
        statusMap[day] = s;
    });
    let html = "";
    for (let day = jumlahHari; day >= 1; day--) {
        const masuk = grouped[day]?.masuk;
        const pulang = grouped[day]?.pulang;
        const statusHari = statusMap[day];
        const hasStatus =
            statusHari &&
            String(statusHari.approval || "").trim().toLowerCase() !== "rejected";
        html += `
            <div class="history-card">
                <div class="history-date">
                    <div class="history-weekday">
                        ${getDayName(day, selectedMonth, selectedYear)}
                    </div>
                    <div class="day">${day}</div>
                    <div class="month">
                        ${getMonthShort(selectedMonth)} ${selectedYear}
                    </div>
                </div>
                ${
                    hasStatus && !masuk && !pulang
                        ? renderStatusHistoryBlock(statusHari)
                        : renderNormalHistoryBlock(
                            masuk,
                            pulang,
                            statusHari
                        )
                }
            </div>
        `;
    }
    container.innerHTML = html;
}

//CONVERTER LINK FOTO
function convertDriveUrl(url) {
    if (!url) return "";
    // jika URL Supabase langsung return
    if (url.includes("supabase.co/storage")) {
        return url;
    }
    try {
        let match = url.match(/\/d\/([^\/]+)/);
        if (match && match[1]) {
            return `https://lh3.googleusercontent.com/d/${match[1]}`;
        }
        match = url.match(/[?&]id=([^&]+)/);
        if (match && match[1]) {
            return `https://lh3.googleusercontent.com/d/${match[1]}`;
        }
        return url;
    } catch (err) {
        console.error(err);
        return url;
    }
}

// PREVIEW FOTO
function previewFoto({
    url,
    tipe,
    nama,
    timestamp,
    namaIndustri,
    mapUrl,
    lat,
    lng,
    jarak,
    validLokasi
}) {
    if (!url) {
        Swal.fire({
            icon: "warning",
            title: "Foto Tidak Tersedia",
            text: "Foto absensi tidak ditemukan."
        });
        return;
    }
    const imageUrl =
        convertDriveUrl(url);
    const title =
        tipe === "pulang"
            ? "Foto Absensi Pulang"
            : "Foto Absensi Masuk";
    Swal.fire({
        title,
        width: 650,
        showCloseButton: true,
        showConfirmButton: false,
        html: `
            <div class="text-center">
                <div style="
                    font-size:18px;
                    font-weight:700;
                    color:#1e293b;
                    margin-bottom:5px;
                ">
                    ${nama || "-"}
                </div>
                <div style="
                    color:#64748b;
                    font-size:13px;
                    margin-bottom:15px;
                ">
                    ${timestamp || "-"}
                </div>
                <div style="
                    margin-bottom:10px;
                    font-size:14px;
                    font-weight:600;
                    color:#334155;
                ">
                    🏢 ${namaIndustri || "-"}
                </div>
                <div style="
                    display:flex;
                    justify-content:center;
                    gap:8px;
                    flex-wrap:wrap;
                    margin-bottom:15px;
                ">
                    <a
                        href="${mapUrl}"
                        target="_blank"
                        style="
                            background:#dbeafe;
                            color:#1d4ed8;
                            padding:8px 14px;
                            border-radius:999px;
                            text-decoration:none;
                            font-size:12px;
                            font-weight:600;
                        ">
                        📍 Google Maps
                    </a>
                    <a
                        href="https://waze.com/ul?ll=${lat},${lng}&navigate=yes"
                        target="_blank"
                        style="
                            background:#e0f2fe;
                            color:#0369a1;
                            padding:8px 14px;
                            border-radius:999px;
                            text-decoration:none;
                            font-size:12px;
                            font-weight:600;
                        ">
                        🧭 Waze
                    </a>
                    <span style="
                        background:#dcfce7;
                        color:#166534;
                        padding:8px 12px;
                        border-radius:999px;
                        font-size:12px;
                        font-weight:600;
                    ">
                        📏 ${Math.round(jarak || 0)} Meter
                    </span>
                    <span style="
                        background:${validLokasi ? '#dcfce7' : '#fee2e2'};
                        color:${validLokasi ? '#166534' : '#b91c1c'};
                        padding:8px 12px;
                        border-radius:999px;
                        font-size:12px;
                        font-weight:600;
                    ">
                        ${validLokasi
                            ? '✅ Lokasi Valid'
                            : '❌ Lokasi Tidak Valid/Diluar Radius'}
                    </span>
                </div>
                <div style="
                    display:flex;
                    justify-content:center;
                    align-items:center;
                    margin-top:10px;
                ">
                    <img
                        src="${imageUrl}"
                        onerror="
                            this.style.display='none';
                            document.getElementById('foto-expired').style.display='flex';
                        "
                        style="
                            width:auto;
                            max-width:320px;
                            max-height:280px;
                            object-fit:contain;
                            border-radius:12px;
                            border:1px solid #e2e8f0;
                            box-shadow:0 8px 24px rgba(0,0,0,.15);
                        "
                    >
                    <div
                        id="foto-expired"
                        style="
                            display:none;
                            flex-direction:column;
                            align-items:center;
                            justify-content:center;
                            padding:30px;
                            border:2px dashed #cbd5e1;
                            border-radius:12px;
                            background:#f8fafc;
                            max-width:320px;
                            margin:auto;
                        ">
                        <i
                            class="fa-solid fa-images"
                            style="
                                font-size:48px;
                                color:#94a3b8;
                                margin-bottom:12px;
                            ">
                        </i>
                        <div
                            style="
                                font-size:15px;
                                font-weight:600;
                                color:#334155;
                                margin-bottom:6px;
                            ">
                            Foto Tidak Tersedia
                        </div>
                        <div
                            style="
                                font-size:12px;
                                color:#64748b;
                                line-height:1.6;
                            ">
                            📦 Foto telah diarsipkan
                            Untuk menghemat penyimpanan,
                            foto absensi yang berusia lebih dari 30 hari
                            akan dihapus otomatis.
                            Data kehadiran tetap tersedia.
                        </div>
                    </div>
                </div>
            </div>
        `
    });
}

// RIWAYAT SISWA BLOCK
function renderNormalHistoryBlock(
    masuk,
    pulang,
    statusHari
) {
    return `
        <div class="history-action">
            ${
                masuk?.fotoUrl
                ? `
                    <button
                        onclick='previewFoto({
                            url:"${masuk.fotoUrl}",
                            tipe:"masuk",
                            nama:"${masuk.nama}",
                            timestamp:"${masuk.timestamp}",
                            namaIndustri:"${masuk.namaIndustri}",
                            mapUrl:"${masuk.maps}",
                            lat:"${masuk.lat}",
                            lng:"${masuk.lng}",
                            jarak:${masuk.jarak || 0},
                            validLokasi:${Number(masuk.jarak || 0) <= 200}
                        })'
                        class="history-badge in cursor-pointer hover:opacity-90">
                        <i class="fa-solid fa-camera mr-1"></i>
                        <br>
                        Scan In
                    </button>
                `
                : `
                    <div class="history-badge in">
                        Scan In
                    </div>
                `
            }
            <div class="history-time">
                ${
                    masuk
                    ? masuk.timestamp.split(" ")[1]
                    : "00:00:00"
                }
            </div>
            <div class="history-note">
                ${
                    masuk
                    ? `${Math.round(masuk.jarak || 0)} meter`
                    : "Belum absen"
                }
            </div>
        </div>
        <div class="history-action">
            ${
                pulang?.fotoUrl
                ? `
                    <button
                        onclick='previewFoto({
                            url:"${pulang.fotoUrl}",
                            tipe:"pulang",
                            nama:"${pulang.nama}",
                            timestamp:"${pulang.timestamp}",
                            namaIndustri:"${pulang.namaIndustri}",
                            mapUrl:"${pulang.maps}",
                            lat:"${pulang.lat}",
                            lng:"${pulang.lng}",
                            jarak:${pulang.jarak || 0},
                            validLokasi:${Number(pulang.jarak || 0) <= 200}
                        })'
                        class="history-badge out cursor-pointer hover:opacity-90">
                        <i class="fa-solid fa-camera mr-1"></i>
                        <br>
                        Scan Out
                    </button>
                `
                : `
                    <div class="history-badge out">
                        Scan Out
                    </div>
                `
            }
            ${
                pulang
                ? `
                    <div class="history-time">
                        ${pulang.timestamp.split(" ")[1]}
                    </div>
                    <div class="history-note">
                        ${Math.round(pulang.jarak || 0)} meter
                    </div>
                `
                : (
                    statusHari &&
                    String(statusHari.approval)
                        .toLowerCase() === "approved" &&
                    String(statusHari.status)
                        .toLowerCase() === "lupa absen"
                )
                ? `
                    <div class="history-time text-blue-600 font-semibold">
                        Lupa Absen
                    </div>
                    <div class="history-note">
                        ${statusHari.keterangan || ""}
                    </div>
                `
                : `
                    <div class="history-time">
                        00:00:00
                    </div>
                    <div class="history-note">
                        Belum absen
                    </div>
                `
            }
        </div>
    `;
}

// STATUS RIWAYAT BLOCK RENDER
function renderStatusHistoryBlock(statusHari) {
    const approval = String(statusHari.approval || "Pending").trim();
    return `
        <div class="history-status-special">
           <div class="flex items-center justify-center gap-2 flex-wrap">
                <span class="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-semibold ${getStatusBadgeClass(statusHari.status)}">
                    <i class="fa-solid fa-calendar-check"></i>
                        ${statusHari.status || "-"}
                </span>
                <span class="inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getApprovalBadgeClass(approval)}">
                    ${approval}
                </span>
            </div>
            ${
                statusHari.keterangan
                    ? `<div class="mt-2 text-xs text-slate-500 italic">
                        ${statusHari.keterangan}
                       </div>`
                    : ""
            }
        </div>
        <div class="history-action">
            <div class="history-badge out">Status</div>
            <div class="history-note">
                Tidak perlu absen
            </div>
        </div>
    `;
}

//CANCEL APPROVE
async function cancelStatusRequest(id) {
    const result = await Swal.fire({
        title: "Batalkan Pengajuan?",
        html: `
            <div class="text-sm text-slate-600">
                Pengajuan ini masih berstatus
                <b>Pending Approval</b>.
                <br><br>
                Apakah Anda yakin ingin membatalkannya?
            </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Batalkan",
        cancelButtonText: "Kembali",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b"
    });
    if (!result.isConfirmed) return;
    try {
        showLoader("Membatalkan pengajuan...");
        const user = AppState.currentUser;
        if (!user) {
            throw new Error("User tidak ditemukan");
        }
        // =========================
        // CEK DATA
        // =========================
        const {
            data: statusData,
            error: cekError
        } = await window.supabaseClient
            .from("status_harian")
            .select("id,approval,username")
            .eq("id", id)
            .single();
        if (cekError) {
            throw cekError;
        }
        if (!statusData) {
            throw new Error("Data tidak ditemukan");
        }
        if (statusData.username !== user.username) {
            throw new Error(
                "Anda tidak memiliki akses membatalkan data ini"
            );
        }
        if (statusData.approval !== "Pending") {
            Swal.fire({
                title: "Tidak Bisa Dibatalkan",
                text: "Pengajuan sudah diproses.",
                icon: "warning"
            });
            return;
        }
        // =========================
        // HAPUS FOTO JIKA ADA
        // =========================
        const {
            data: fotoData
        } = await window.supabaseClient
            .from("status_harian")
            .select("foto_bukti")
            .eq("id", id)
            .single();
        if (fotoData?.foto_bukti) {
            try {
                const url =
                    fotoData.foto_bukti;
                const filePath =
                    decodeURIComponent(
                        url.split("/status-bukti/")[1] || ""
                    );
                if (filePath) {
                    await window.supabaseClient
                        .storage
                        .from("status-bukti")
                        .remove([filePath]);
                }
            } catch (e) {
                console.warn(
                    "Gagal menghapus foto:",
                    e
                );
            }
        }
        // =========================
        // HAPUS DATA
        // =========================
        const {
            error: deleteError
        } = await window.supabaseClient
            .from("status_harian")
            .delete()
            .eq("id", id)
            .eq("username", user.username);
        if (deleteError) {
            throw deleteError;
        }
        await Swal.fire({
            title: "Berhasil",
            text: "Pengajuan berhasil dibatalkan.",
            icon: "success",
            timer: 1800,
            showConfirmButton: false
        });
        await loadStatusHistory();
    }
    catch (error) {
        console.error(
            "Cancel status error:",
            error
        );
        Swal.fire({
            title: "Gagal",
            text:
                error.message ||
                "Pengajuan tidak dapat dibatalkan.",
            icon: "error"
        });
    }
    finally {
        hideLoader();
    }
}

//Riwayat Wali
const HistoryService = {
    async init(useLoader = true) {
        const now = new Date();
        const today =
            `${now.getFullYear()}-${String(
                now.getMonth() + 1
            ).padStart(2, "0")}-${String(
                now.getDate()
            ).padStart(2, "0")}`;
        const dateEl =
            document.getElementById(
                "history-date"
            );
        if (
            dateEl &&
            !dateEl.value
        ) {
            dateEl.value =
                today;
        }
        if (
            !AppState.historyMode
        ) {
            AppState.historyMode =
                "wali";
        }
        await this.load(
            useLoader
        );
    },

    async load(useLoader = false) {
        try {
            const user =
                AppState.currentUser;
            if (!user) return;
            if (useLoader) {
                showLoader(
                    "Memuat riwayat absensi..."
                );
            }
            const data =
                await this.getData();
            this.render(
                data
            );
        }
        catch (error) {
            console.error(
                "HistoryService:",
                error
            );
            showToast(
                "Gagal memuat riwayat",
                true
            );
        }
        finally {
            hideLoader();
        }
    },
    async getData() {
        const user =
            AppState.currentUser;
        const selectedDate =
            document.getElementById(
                "history-date"
            )?.value;
        let siswa = [];
        // =====================
        // WALI
        // =====================
        if (
            AppState.historyMode ===
            "wali"
        ) {
            const {
                data,
                error
            } = await window.supabaseClient
                .from("users")
                .select(`
                    username,
                    nama_lengkap,
                    kategori,
                    lokasi_id
                `)
                .eq("role", "siswa")
                .eq(
                    "kategori",
                    user.kategori
                );
            if (error)
                throw error;
            siswa =
                data || [];
        }
        // =====================
        // PEMBIMBING
        // =====================
        else {
            const {
                data,
                error
            } = await window.supabaseClient
                .from("users")
                .select(`
                    username,
                    nama_lengkap,
                    kategori,
                    lokasi_id
                `)
                .eq("role", "siswa")
                .eq(
                    "p_id",
                    user.pId
                );
            if (error)
                throw error;
            siswa =
                data || [];
        }
        const usernames =
            siswa.map(
                s => s.username
            );
        if (!usernames.length) {
            return {
                siswa: []
            };
        }
        // =====================
        // ABSENSI
        // =====================
        const startDate =
            `${selectedDate}T00:00:00+08:00`;
        const endDate =
            `${selectedDate}T23:59:59.999+08:00`;
        const {
            data: absensiData,
            error: absensiError
        } = await window.supabaseClient
            .from("absensi")
            .select("*")
            .in(
                "username",
                usernames
            )
            .gte(
                "waktu",
                startDate
            )
            .lte(
                "waktu",
                endDate
            );
        if (absensiError) {
            throw absensiError;
        }
        // =====================
        // STATUS HARIAN
        // =====================
        const {
            data: statusData
        } = await window.supabaseClient
            .from("status_harian")
            .select("*")
            .in(
                "username",
                usernames
            )
            .eq(
                "tanggal",
                selectedDate
            );
        // =====================
        // LOKASI
        // =====================
        const lokasiIds =
            [
                ...new Set(
                    siswa
                    .map(
                        s => s.lokasi_id
                    )
                    .filter(Boolean)
                )
            ];
        let lokasiMap = {};
        if (
            lokasiIds.length
        ) {
            const {
                data: lokasiData
            } = await window.supabaseClient
                .from("lokasi")
                .select("*")
                .in(
                    "lokasi_id",
                    lokasiIds
                );
            lokasiMap =
                Object.fromEntries(
                    lokasiData.map(
                        l => [
                            l.lokasi_id,
                            l
                        ]
                    )
                );
        }
        // =====================
        // MAP ABSENSI
        // =====================
        const absensiMap = {};
        (absensiData || [])
            .forEach(a => {
                if (
                    !absensiMap[
                        a.username
                    ]
                ) {
                    absensiMap[
                        a.username
                    ] = [];
                }
                absensiMap[
                    a.username
                ].push(a);
            });
        // =====================
        // MAP STATUS
        // =====================
        const statusMap =
            Object.fromEntries(
                (statusData || [])
                .map(s => [
                    s.username,
                    s
                ])
            );
        // =====================
        // MERGE
        // =====================
        const hasil =
            siswa.map(s => {
                const absensi =
                    absensiMap[s.username] || [];
                const status =
                    statusMap[s.username];
                const lokasi =
                    lokasiMap[s.lokasi_id] || {};
                // =====================
                // ABSEN MASUK
                // =====================
                const masuk =
                    absensi.find(a => {
                        const tipe =
                            String(a.tipe || "")
                            .trim()
                            .toLowerCase();
                        return (
                            tipe.includes("masuk") ||
                            tipe.includes("check in") ||
                            tipe === "in"
                        );
                    });
                // =====================
                // ABSEN PULANG
                // =====================
                const pulang =
                    absensi.find(a => {
                        const tipe =
                            String(a.tipe || "")
                            .trim()
                            .toLowerCase();
                        return (
                            tipe.includes("pulang") ||
                            tipe.includes("keluar") ||
                            tipe.includes("check out") ||
                            tipe.includes("checkout") ||
                            tipe === "out"
                        );
                    });
                // =====================
                // KETERANGAN
                // =====================
                let keterangan =
                    "Belum Absen";
                if (status) {
                    const approval =
                        String(
                            status.approval || ""
                        )
                        .trim()
                        .toLowerCase();
                    if (
                        approval === "pending"
                    ) {
                        keterangan =
                            `Pending ${status.status || ""}`;
                    }
                    else if (
                        approval === "approved"
                    ) {
                        keterangan =
                            status.status ||
                            "Approved";
                    }
                }
                if (masuk && pulang) {
                    keterangan =
                        "Masuk & Pulang";
                }
                else if (masuk) {
                    keterangan =
                        "Sudah Masuk";
                }
                else if (pulang) {
                    keterangan =
                        "Sudah Pulang";
                }
                return {
                    username:
                        s.username,
                    nama:
                        s.nama_lengkap || "-",
                    kategori:
                        s.kategori || "-",
                    industri:
                        lokasi.nama_industri || "-",
                    jamMasuk:
                        masuk
                        ? formatJamOnly(
                            masuk.waktu
                        )
                        : "-",
                    jamPulang:
                        pulang
                        ? formatJamOnly(
                            pulang.waktu
                        )
                        : "-",
                    keterangan
                };
            });
        return {
            siswa: hasil
        };
    },
    render(data) {
        const siswa =
            data.siswa || [];
        const tbody =
            document.getElementById(
                "wali-riwayat-body"
            );
        if (!tbody) return;
        if (
            $.fn.DataTable.isDataTable(
                "#wali-table"
            )
        ) {
            $("#wali-table")
                .DataTable()
                .destroy();
        }
        if (!siswa.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6"
                        class="text-center p-4">
                        Tidak ada data siswa
                    </td>
                </tr>
            `;
            return;
        }
        tbody.innerHTML =
            siswa.map(s => `
                <tr>
                    <td>
                        ${s.nama}
                    </td>
                    <td>
                        ${s.kategori}
                    </td>
                    <td>
                        ${s.industri}
                    </td>
                    <td class="text-center">
                        ${s.jamMasuk}
                    </td>
                    <td class="text-center">
                        ${s.jamPulang}
                    </td>
                    <td>
                        ${s.keterangan}
                    </td>
                </tr>
            `).join("");
        $("#wali-table").DataTable({
            pageLength: 25,
            ordering: true,
            searching: true,
            scrollX: true,
            destroy: true,
            language: {
                search: "Cari:",
                lengthMenu:
                    "Tampilkan _MENU_ data",
                info:
                    "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
                paginate: {
                    next: "›",
                    previous: "‹"
                },
                zeroRecords:
                    "Data tidak ditemukan",
                infoEmpty:
                    "Tidak ada data"
            }
        });
    }
};

// FORMAT JAM
function formatJamOnly(value) {
    if (!value) return "-";
    const d = new Date(value);
    return d.toLocaleTimeString(
        "id-ID",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


