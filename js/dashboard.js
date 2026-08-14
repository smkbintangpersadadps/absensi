// ===============================
// KEPSEK DASHBOARD
// ===============================
// function getKepsekStatusBadge(status) {
//     switch (String(status || "").trim().toLowerCase()) {
//         case "hadir":
//             return "bg-green-100 text-green-700";

//         case "belum konfirmasi":
//             return "bg-red-100 text-red-700";

//         case "pending approval":
//             return "bg-orange-100 text-orange-700";

//         case "day off":
//         case "izin":
//         case "sakit":
//         case "libur industri":
//         case "lupa absen":
//             return "bg-amber-100 text-amber-700";

//         default:
//             return "bg-slate-100 text-slate-700";
//     }
// }

// function renderKepsekRekapIndustri(rekap, lokasiId) {
//     const box = document.getElementById("kepsek-rekap-industri");
//     if (!box) return;

//     const data = lokasiId === "ALL"
//         ? rekap
//         : rekap.filter(r => r.lokasiId === lokasiId);

//     if (!data.length) {
//         box.innerHTML = `
//             <div class="text-sm text-slate-500">
//                 Tidak ada data industri
//             </div>
//         `;
//         return;
//     }

//     box.innerHTML = data.map(r => `
//         <div class="border rounded-2xl p-4">
//             <div class="flex items-center justify-between gap-3">
//                 <div>
//                     <h4 class="font-semibold text-slate-800">
//                         ${r.namaIndustri}
//                     </h4>
//                     <p class="text-xs text-slate-500 mt-1">
//                         ${r.alamat || "-"}
//                     </p>
//                 </div>

//                 <span class="text-sm font-bold text-indigo-600">
//                     ${r.persentase}%
//                 </span>
//             </div>

//             <div class="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
//                 <div class="bg-slate-50 rounded-xl p-2">
//                     <div class="font-bold">${r.totalSiswa}</div>
//                     <div class="text-xs text-slate-500">Siswa</div>
//                 </div>

//                 <div class="bg-green-50 rounded-xl p-2">
//                     <div class="font-bold text-green-600">${r.hadir}</div>
//                     <div class="text-xs text-slate-500">Hadir</div>
//                 </div>

//                 <div class="bg-red-50 rounded-xl p-2">
//                     <div class="font-bold text-red-600">${r.belumHadir}</div>
//                     <div class="text-xs text-slate-500">Belum</div>
//                 </div>
//             </div>
//         </div>
//     `).join("");
// }

// function renderKepsekTable(siswa) {
//     const tbody = document.getElementById("kepsek-table-body");
//     if (!tbody) return;

//     if ($.fn.DataTable.isDataTable("#kepsek-table")) {
//         $("#kepsek-table").DataTable().clear().destroy();
//     }

//     if (!siswa.length) {
//         tbody.innerHTML = `
//             <tr>
//                 <td colspan="6" class="text-center p-4 text-slate-500">
//                     Tidak ada data siswa
//                 </td>
//             </tr>
//         `;
//         return;
//     }

//     tbody.innerHTML = siswa.map(s => `
//         <tr>
//             <td>${s.nama || "-"}</td>
//             <td>${s.kategori || "-"}</td>
//             <td>${s.namaIndustri || "-"}</td>
//             <td>${s.jamMasuk || "-"}</td>
//             <td>
//                 <span class="px-2 py-1 rounded-full text-xs font-semibold ${getKepsekStatusBadge(s.statusHadir)}">
//                     ${s.statusHadir}
//                 </span>
//             </td>
//             <td>
//                 ${
//                     s.maps
//                         ? `<a href="${s.maps}" target="_blank" class="text-indigo-600 font-medium">Maps</a>`
//                         : "-"
//                 }
//             </td>
//         </tr>
//     `).join("");

//     $("#kepsek-table").DataTable({
//         pageLength: 10,
//         ordering: true,
//         searching: true,
//         scrollX: true,
//         autoWidth: false,
//         destroy: true,
//         language: {
//             search: "Cari:",
//             lengthMenu: "Tampilkan _MENU_ data",
//             info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
//             paginate: {
//                 next: "›",
//                 previous: "‹"
//             },
//             zeroRecords: "Data tidak ditemukan"
//         }
//     });
// }

// function renderKepsekMap(rekap, lokasiId) {
//     const mapEl = document.getElementById("kepsek-map");
//     if (!mapEl || typeof L === "undefined") return;
//     const data = lokasiId === "ALL"
//         ? rekap
//         : rekap.filter(r => r.lokasiId === lokasiId);
//     if (!kepsekMap) {
//         kepsekMap = L.map("kepsek-map").setView([-8.65, 115.21], 10);
//         L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//             attribution: "© OpenStreetMap"
//         }).addTo(kepsekMap);
//     }
//     kepsekMarkers.forEach(m => kepsekMap.removeLayer(m));
//     kepsekMarkers = [];
//     const bounds = [];
//     data.forEach(r => {
//         const lat = parseFloat(r.lat);
//         const lng = parseFloat(r.lng);
//         if (isNaN(lat) || isNaN(lng)) return;
//         let color = "red";
//         if (r.totalSiswa > 0 && r.belumHadir === 0) color = "green";
//         else if (r.hadir > 0) color = "orange";
//         const marker = L.circleMarker([lat, lng], {
//             radius: 10,
//             color,
//             fillColor: color,
//             fillOpacity: 0.8
//         }).addTo(kepsekMap);
//         marker.bindPopup(`
//             <b>${r.namaIndustri}</b><br>
//             Total: ${r.totalSiswa}<br>
//             Hadir: ${r.hadir}<br>
//             Belum: ${r.belumHadir}
//         `);
//         kepsekMarkers.push(marker);
//         bounds.push([lat, lng]);
//     });
//     if (bounds.length) {
//         kepsekMap.fitBounds(bounds, {
//             padding: [30, 30]
//         });
//     }
//     setTimeout(() => {
//         kepsekMap.invalidateSize();
//     }, 300);
// }

//KEPSEK MASTER DATA SISWA

// async function loadMasterSiswa() {

//     try {

//         showLoader("Memuat data siswa...");

//         const data =
//             await ApiService.call({
//                 action: "get_master_siswa"
//             });

//         AppState.masterSiswa = data || [];

//         populateMasterFilters();

//         renderMasterSiswaTable(
//             AppState.masterSiswa
//         );

//     } catch(err) {

//         console.error(err);

//         showToast(
//             "Gagal memuat data siswa",
//             true
//         );

//     } finally {

//         hideLoader();

//     }

// }

let masterSiswaTable = null;
function renderMasterSiswaTable(data = []) {
    const tbody =
        document.querySelector(
            "#table-master-siswa tbody"
        );
    if (!tbody) return;
    if (
        $.fn.DataTable.isDataTable(
            "#table-master-siswa"
        )
    ) {
        $("#table-master-siswa")
            .DataTable()
            .destroy();
    }
    tbody.innerHTML = "";
    data.forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td>${item.username || ""}</td>
                <td>${item.nama || ""}</td>
                <td>${item.kategori || ""}</td>
                <td>${item.namaIndustri || "-"}</td>
                <td>${item.namaPembimbing || "-"}</td>
                <td>
                    <button
                        onclick="openEditSiswa('${item.username}')"
                        class="btn btn-warning btn-sm">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    masterSiswaTable =
        $("#table-master-siswa").DataTable({
            pageLength: 10,
            responsive: true,
            destroy: true,
            language: {
                search: "Cari:",
                lengthMenu:
                    "Tampilkan _MENU_ data",
                info:
                    "Menampilkan _START_ - _END_ dari _TOTAL_ data",
                infoEmpty:
                    "Tidak ada data",
                zeroRecords:
                    "Data tidak ditemukan",
                paginate: {
                    first: "Awal",
                    last: "Akhir",
                    next: "›",
                    previous: "‹"
                }
            }
        });
}

function populateMasterFilters() {
    const kategoriEl =
        document.getElementById(
            "master-filter-kategori"
        );
    const industriEl =
        document.getElementById(
            "master-filter-industri"
        );
    if (!kategoriEl || !industriEl) return;
    const kategoriSet =
        new Set();
    const industriSet =
        new Set();
    AppState.masterSiswa.forEach(item => {
        if (item.kategori) {
            kategoriSet.add(
                item.kategori
            );
        }
        if (item.namaIndustri) {
            industriSet.add(
                item.namaIndustri
            );
        }
    });
    kategoriEl.innerHTML =
        `<option value="">Semua</option>`;
    [...kategoriSet]
        .sort()
        .forEach(item => {
            kategoriEl.innerHTML += `
                <option value="${item}">
                    ${item}
                </option>
            `;
        });
    industriEl.innerHTML =
        `<option value="">Semua</option>`;
    [...industriSet]
        .sort()
        .forEach(item => {
            industriEl.innerHTML += `
                <option value="${item}">
                    ${item}
                </option>
            `;
        });
}

function filterMasterSiswa() {
    const search =
        document.getElementById(
            "master-search"
        )
        ?.value
        .toLowerCase()
        .trim();
    const kategori =
        document.getElementById(
            "master-filter-kategori"
        )?.value;
    const industri =
        document.getElementById(
            "master-filter-industri"
        )?.value;
    const result =
        AppState.masterSiswa.filter(item => {
            const matchSearch =
                !search ||
                item.nama
                    ?.toLowerCase()
                    .includes(search) ||
                item.username
                    ?.toLowerCase()
                    .includes(search);
            const matchKategori =
                !kategori ||
                item.kategori === kategori;
            const matchIndustri =
                !industri ||
                item.namaIndustri === industri;
            return (
                matchSearch &&
                matchKategori &&
                matchIndustri
            );
        });
    AppState.masterSiswaFiltered =
        result;
    renderMasterSiswaTable(result);
}

// async function openEditSiswa(username) {
//     try {
//         showLoader("Memuat data...");
//         const siswa =
//             await ApiService.call({
//                 action: "get_siswa_detail",
//                 username
//             });
//         const guruList =
//             await ApiService.call({
//                 action: "get_guru_list"
//             });
//         const lokasiList =
//             await ApiService.call({
//                 action: "get_lokasi_list"
//             });
//         document.getElementById("edit-username")
//             .value = siswa.username;
//         document.getElementById("edit-username-view")
//             .value = siswa.username;
//         document.getElementById("edit-nama")
//             .value = siswa.nama;
//         document.getElementById("edit-kategori")
//             .value = siswa.kategori;

//         populateGuruDropdown(
//             guruList,
//             siswa.parentId
//         );
//         populateLokasiDropdown(
//             lokasiList,
//             siswa.lokasiId
//         );
//         document
//             .getElementById("modal-edit-siswa")
//             .classList
//             .remove("hidden");
//     }
//     catch(err){
//         console.error(err);
//         showToast(
//             "Gagal memuat data siswa",
//             true
//         );
//     }
//     finally{
//         hideLoader();
//     }
// }

// function populateGuruDropdown(
//     list,
//     selectedId
// ){

//     const el =
//         document.getElementById(
//             "edit-parentid"
//         );

//     el.innerHTML = "";

//     list.forEach(guru=>{

//         el.innerHTML += `
//             <option
//                 value="${guru.id}"
//                 ${guru.id===selectedId ? "selected" : ""}>
//                 ${guru.nama}
//             </option>
//         `;

//     });

// }

// function populateLokasiDropdown(
//     list,
//     selectedId
// ){
//     const el =
//         document.getElementById(
//             "edit-lokasiid"
//         );
//     el.innerHTML = "";
//     list.forEach(item=>{
//         el.innerHTML += `
//             <option
//                 value="${item.lokasiId}"
//                 ${item.lokasiId===selectedId ? "selected" : ""}>
//                 ${item.namaIndustri}
//             </option>
//         `;
//     });
// }

// async function saveEditSiswa(){
//     try{
//         showLoader("Menyimpan data...");
//         const res =
//             await ApiService.call({
//                 action:"update_siswa",
//                 username:
//                     document.getElementById("edit-username").value,
//                 nama:
//                     document.getElementById("edit-nama").value,
//                 kategori:
//                     document.getElementById("edit-kategori").value,
//                 parentId:
//                     document.getElementById("edit-parentid").value,
//                 lokasiId:
//                     document.getElementById("edit-lokasiid").value,

//             });
//         showToast(
//             "Data berhasil diperbarui"
//         );
//         closeEditSiswa();
//         await loadMasterSiswa();
//     }
//     catch(error){
//         console.error(error);
//         showToast(
//             "Gagal menyimpan data",
//             true
//         );
//     }
//     finally{
//         hideLoader();
//     }

// }

// ===============================
// WALI DASHBOARD
// ===============================
function setMonitoringMode(mode) {

    AppState.monitoringMode = mode;

    const btnWali =
        document.getElementById("btn-mode-wali");

    const btnPembimbing =
        document.getElementById("btn-mode-pembimbing");

    // RESET STYLE
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

    // ACTIVE STYLE
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

    // RELOAD DASHBOARD
    loadWaliDashboard?.(true);
}

async function getMonitoringDashboard(mode, username) {

    try {

        const currentUser = AppState.currentUser;

        let siswa = [];

        // ==================================
        // MODE WALI KELAS
        // ==================================
        if (mode === "wali") {

            const kategoriWali =
                String(currentUser.kategori || "")
                .trim();

            const {
                data,
                error
            } = await window.supabaseClient
                .from("users")
                .select(`
                    username,
                    nama_lengkap,
                    kategori,
                    lokasi_id,
                    parent_id,
                    p_id,
                    role
                `)
                .eq("role", "siswa")
                .eq("kategori", kategoriWali);

            if (error) throw error;

            siswa = data || [];
        }

        // ==================================
        // MODE PEMBIMBING PKL
        // ==================================
        else {

            const pembimbingId =
                String(
                    currentUser.pId ||
                    currentUser.p_id ||
                    ""
                ).trim();

            const {
                data,
                error
            } = await window.supabaseClient
                .from("users")
                .select(`
                    username,
                    nama_lengkap,
                    kategori,
                    lokasi_id,
                    parent_id,
                    p_id,
                    role
                `)
                .eq("role", "siswa")
                .eq("p_id", pembimbingId);

            if (error) throw error;

            siswa = data || [];
        }

        console.log("MODE:", mode);
        console.log("JUMLAH SISWA:", siswa.length);
        console.log("DATA SISWA:", siswa);

        // ==================================
        // LOKASI INDUSTRI
        // ==================================

        const lokasiIds = [
            ...new Set(
                siswa
                    .map(s => s.lokasi_id)
                    .filter(Boolean)
            )
        ];

        let lokasiMap = {};

        if (lokasiIds.length > 0) {

            const {
                data: lokasiData,
                error: lokasiError
            } = await window.supabaseClient
                .from("lokasi")
                .select("*")
                .in("lokasi_id", lokasiIds);

            if (lokasiError) {
                console.error(lokasiError);
            }

            lokasiMap = Object.fromEntries(
                (lokasiData || []).map(l => [
                    l.lokasi_id,
                    l
                ])
            );
        }

        // ==================================
        // ABSENSI HARI INI
        // ==================================

        const usernames =
            siswa.map(s => s.username);

        let riwayat = [];

        if (usernames.length > 0) {

            const start =
                new Date();

            start.setHours(0,0,0,0);

            const end =
                new Date();

            end.setHours(23,59,59,999);

            const {
                data: absensiData,
                error: absensiError
            } = await window.supabaseClient
                .from("absensi")
                .select("*")
                .in("username", usernames)
                .gte("waktu", start.toISOString())
                .lte("waktu", end.toISOString());

            if (absensiError) {
                console.error(absensiError);
            }

            riwayat = absensiData || [];
        }

        // ==================================
        // STATUS HARIAN
        // ==================================

        let statusMap = {};

        if (usernames.length > 0) {

            const today =
                new Date()
                .toISOString()
                .split("T")[0];

            const {
                data: statusData,
                error: statusError
            } = await window.supabaseClient
                .from("status_harian")
                .select("*")
                .in("username", usernames)
                .eq("tanggal", today);
            
            if (statusError) {
                console.error(statusError);
            }

            statusMap = Object.fromEntries(
                (statusData || []).map(s => [
                    s.username,
                    s
                ])
            );
        }

        // ==================================
        // MERGE DATA
        // ==================================

        const siswaFinal = siswa.map(s => {

            const lokasi =
                lokasiMap[s.lokasi_id] || {};

            const status =
                statusMap[s.username] || {};

            return {

                username: s.username,

                nama:
                    s.nama_lengkap || "-",

                kategori:
                    s.kategori || "-",

                lokasiId:
                    s.lokasi_id,

                namaIndustri:
                    lokasi.nama_industri || "-",

                mapsUrl:
                    lokasi.latitude &&
                    lokasi.longitude
                        ? `https://www.google.com/maps?q=${lokasi.latitude},${lokasi.longitude}`
                        : "#",

                statusHarian:
                    status.status || "",

                approvalStatus:
                    status.approval || "",

                keteranganStatus:
                    status.keterangan || ""

            };

        });

        return {
            siswa: siswaFinal,
            riwayat
        };

    }
    catch (error) {

        console.error(
            "getMonitoringDashboard:",
            error
        );

        throw error;
    }
}

async function loadWaliDashboard(useLoader = false) {
    try {
        const user = AppState.currentUser;
        if (!user) return;

        if (useLoader) {
            showLoader("Memuat data siswa...");
        }

        if (!AppState.monitoringMode) {
            AppState.monitoringMode = "wali";
        }

        const data = await getMonitoringDashboard(
            AppState.monitoringMode,
            user.username
        );

        console.log("SISWA FINAL:", data.siswa);

        console.log("MONITORING DATA:", data);

        const siswa =
            data.siswa || [];

        const riwayat =
            data.riwayat || [];

        const contentBox = document.getElementById("wali-dashboard-content");
        const emptyBox = document.getElementById("wali-dashboard-empty");

        if (contentBox) contentBox.classList.remove("hidden");

        if (emptyBox) {
            emptyBox.classList.add("hidden");
            emptyBox.innerHTML = "";
        }

        if (AppState.monitoringMode === "wali" && siswa.length === 0) {
            if (contentBox) contentBox.classList.add("hidden");

            if (emptyBox) {
                emptyBox.classList.remove("hidden");
                emptyBox.innerHTML = `
                    <p>
                        Tidak memiliki siswa yang sedang PKL sebagai <b>Wali Kelas</b>.
                    </p>

                    <button onclick="setMonitoringMode('pembimbing')"
                        class="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">
                        Buka Pembimbing PKL
                    </button>
                `;
            }

            return;
        }

        if (AppState.monitoringMode === "pembimbing" && siswa.length === 0) {
            if (contentBox) contentBox.classList.add("hidden");

            if (emptyBox) {
                emptyBox.classList.remove("hidden");
                emptyBox.innerHTML = `
                    <p>
                        Anda tidak sedang menjadi <b>Pembimbing PKL</b>.
                    </p>

                    <button onclick="setMonitoringMode('wali')"
                        class="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">
                        Buka Wali Kelas
                    </button>
                `;
            }

            return;
        }

        const today =
            new Date().toISOString().split("T")[0];

        const hadirHariIni =
            riwayat.filter(r => {

                const tanggalAbsen =
                    String(r.waktu || "")
                    .split("T")[0];

                return (
                    tanggalAbsen === today &&
                    String(r.tipe || "").toLowerCase() === "masuk"
                );

            });

        const hadirUsernames = new Set(
            hadirHariIni.map(r => String(r.username || "").trim())
        );

        const statusKhusus = siswa.filter(s =>
            s.statusHarian &&
            String(s.approvalStatus || "").trim().toLowerCase() === "approved"
        );

        const statusPending = siswa.filter(s =>
            s.statusHarian &&
            String(s.approvalStatus || "").trim().toLowerCase() === "pending"
        );

        const statusUsernames = new Set([
            ...statusKhusus.map(s =>
                String(s.username || "").trim()
            ),
            ...statusPending.map(s =>
                String(s.username || "").trim()
            )
        ]);

        const belumHadir = siswa.filter(s =>
            !hadirUsernames.has(String(s.username || "").trim()) &&
            !statusUsernames.has(String(s.username || "").trim())
        );

        // ===============================
        // PROFILE WALI
        // ===============================
        const waliNama = document.getElementById("wali-nama");
        const waliKategori = document.getElementById("wali-kategori");
        const waliAvatar = document.getElementById("wali-avatar");

        if (waliNama) {
            waliNama.textContent =
                user.namaLengkap ||
                user.nama ||
                user["Nama Lengkap"] ||
                "-";
        }

        if (waliKategori) {
            waliKategori.textContent =
                user.kategori ||
                user.Kategori ||
                user["Kategori"] ||
                "-";
        }

        if (waliAvatar) {
            waliAvatar.textContent =
                (
                    user.namaLengkap ||
                    user.nama ||
                    user["Nama Lengkap"] ||
                    "W"
                ).charAt(0).toUpperCase();
        }

        // ===============================
        // SUMMARY
        // ===============================
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        };

        setText("wali-total-siswa", siswa.length);
        setText("wali-sudah-hadir", hadirHariIni.length);
        setText("wali-belum-hadir", belumHadir.length);
        setText("wali-status-khusus", statusKhusus.length);

        setText("wali-belum-count", `${belumHadir.length} siswa`);
        setText("wali-hadir-count", `${hadirHariIni.length} siswa`);
        setText("wali-status-count", `${statusKhusus.length} siswa`);

        // ===============================
        // BELUM HADIR LIST
        // ===============================
        const belumList = document.getElementById("wali-belum-list");

        if (belumList) {
            if (!belumHadir.length) {
                belumList.innerHTML = `
                    <div class="text-sm text-green-600">
                        Tidak ada siswa yang belum konfirmasi
                    </div>
                `;
            } else {
                belumList.innerHTML = belumHadir.map(s => `
                    <div class="border rounded-xl p-3">
                        <div class="font-medium text-slate-800">
                            ${s.nama || "-"}
                        </div>

                        <div class="text-xs text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
                            <span>${s.kategori || "-"}</span>
                            <span>•</span>
                            <a href="${s.mapsUrl || '#'}"
                                target="_blank"
                                class="text-indigo-600 hover:underline">
                                <i class="fa-solid fa-location-dot"></i>
                                ${s.namaIndustri || "Belum diatur"}
                            </a>
                        </div>
                    </div>
                `).join("");
            }
        }

        // ===============================
        // HADIR LIST
        // ===============================
        const hadirList = document.getElementById("wali-hadir-list");

        if (hadirList) {
            if (!hadirHariIni.length) {
                hadirList.innerHTML = `
                    <div class="text-sm text-slate-500">
                        Belum ada siswa hadir
                    </div>
                `;
            } else {
                hadirList.innerHTML = hadirHariIni.map(r => `
                    <div class="border rounded-xl p-3">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-slate-800">
                                    ${r.nama_lengkap || r.nama || "-"}
                                </div>

                                <div class="text-xs text-slate-500 mt-1">
                                    ${r.kategori || "-"}
                                </div>
                            </div>

                            <span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                Hadir
                            </span>
                        </div>

                        <div class="mt-2 text-xs text-slate-500">
                            ${formatTanggalIndonesia(r.waktu)}
                        </div>
                    </div>
                `).join("");
            }
        }

        // ===============================
        // STATUS KHUSUS LIST
        // ===============================
        const statusList = document.getElementById("wali-status-list");

        if (statusList) {
            if (!statusKhusus.length) {
                statusList.innerHTML = `
                    <div class="text-sm text-slate-500">
                        Tidak ada status khusus hari ini
                    </div>
                `;
            } else {
                statusList.innerHTML = statusKhusus.map(s => `
                    <div class="border rounded-xl p-3 bg-amber-50 border-amber-100">

                        <div class="flex items-start justify-between gap-2">

                            <div class="min-w-0">

                                <div class="font-medium text-slate-800 truncate">
                                    ${s.nama || "-"}
                                </div>

                                <div class="text-xs text-slate-500">
                                    ${s.kategori || "-"}
                                </div>

                            </div>

                            <span class="px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadgeClass(s.statusHarian)}">
                                ${s.statusHarian || "-"}
                            </span>

                        </div>

                        ${
                            s.keteranganStatus
                                ? `
                                    <div class="mt-2 text-xs text-slate-500 italic">
                                        ${s.keteranganStatus}
                                    </div>
                                `
                                : ""
                        }

                    </div>
                `).join("");
            }
        }
        // ===============================
        // PENDING APPROVAL
        // ===============================
        setText("wali-pending-count", `${statusPending.length} siswa`);

        const pendingList = document.getElementById("wali-pending-list");

        if (pendingList) {
            if (!statusPending.length) {
                pendingList.innerHTML = `
                    <div class="text-sm text-slate-500">
                        Tidak ada pengajuan pending
                    </div>
                `;
            } else {
                pendingList.innerHTML = statusPending.map(s => `
                    <div class="border rounded-xl p-3 bg-orange-50 border-orange-100">

                        <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0">
                                <div class="font-medium text-slate-800 truncate">
                                    ${s.nama || "-"}
                                </div>

                                <div class="text-xs text-slate-500">
                                    ${s.kategori || "-"}
                                </div>
                            </div>

                            <span class="px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadgeClass(s.statusHarian)}">
                                ${s.statusHarian || "-"}
                            </span>
                        </div>

                        ${
                            s.keteranganStatus
                                ? `<div class="mt-2 text-xs text-slate-500 italic">${s.keteranganStatus}</div>`
                                : ""
                        }

                        <div class="mt-2 text-[11px] font-medium text-orange-600">
                            Menunggu Approval
                        </div>

                    </div>
                `).join("");
            }
        }

    } catch (error) {
        console.error("Wali dashboard error:", error);
        showToast("Gagal memuat dashboard wali", true);

    } finally {
        hideLoader();
    }
}

function getStatusBadgeClass(status) {

    switch ((status || "").toLowerCase()) {

        case "day off":
            return "bg-amber-100 text-amber-700";

        case "izin":
            return "bg-blue-100 text-blue-700";

        case "sakit":
            return "bg-red-100 text-red-700";

        case "libur industri":
            return "bg-purple-100 text-purple-700";

        case "lupa absen":
            return "bg-slate-200 text-slate-700";

        default:
            return "bg-slate-100 text-slate-700";
    }
}

function getApprovalBadgeClass(approval) {
    switch (String(approval || "").trim().toLowerCase()) {
        case "approved":
            return "bg-green-100 text-green-700";

        case "rejected":
            return "bg-red-100 text-red-700";

        case "pending":
            return "bg-amber-100 text-amber-700";

        default:
            return "bg-slate-100 text-slate-700";
    }
}

function setApprovalMode(mode) {
    AppState.approvalMode = mode;

    const btnWali = document.getElementById("btn-approval-mode-wali");
    const btnPembimbing = document.getElementById("btn-approval-mode-pembimbing");

    btnWali?.classList.remove("bg-indigo-600", "text-white");
    btnPembimbing?.classList.remove("bg-indigo-600", "text-white");

    btnWali?.classList.add("bg-slate-100", "text-slate-700");
    btnPembimbing?.classList.add("bg-slate-100", "text-slate-700");

    if (mode === "wali") {
        btnWali?.classList.remove("bg-slate-100", "text-slate-700");
        btnWali?.classList.add("bg-indigo-600", "text-white");
    } else {
        btnPembimbing?.classList.remove("bg-slate-100", "text-slate-700");
        btnPembimbing?.classList.add("bg-indigo-600", "text-white");
    }

    loadStatusApproval(true);
}

async function loadStatusApproval(useLoader = false) {

    try {

        const user =
            AppState.currentUser;

        if (!user) return;

        if (useLoader) {
            showLoader(
                "Memuat data approval..."
            );
        }

        let data = [];

        // =========================
        // MODE WALI
        // =========================

        if (
            AppState.approvalMode === "wali"
        ) {

            const {
                data: rows,
                error
            } = await window.supabaseClient
                .from("status_harian")
                .select("*")
                .eq(
                    "approval",
                    "Pending"
                )
                .eq(
                    "kategori",
                    user.kategori
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

            data = rows || [];
        }

        // =========================
        // MODE PEMBIMBING
        // =========================

        else {

            const {
                data: siswa,
                error: siswaError
            } = await window.supabaseClient
                .from("users")
                .select("username")
                .eq(
                    "p_id",
                    user.pId
                );

            if (siswaError) {
                throw siswaError;
            }

            const usernames =
                (siswa || [])
                    .map(
                        s => s.username
                    );

            if (
                usernames.length > 0
            ) {

                const {
                    data: rows,
                    error
                } = await window.supabaseClient
                    .from("status_harian")
                    .select("*")
                    .eq(
                        "approval",
                        "Pending"
                    )
                    .in(
                        "username",
                        usernames
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

                data = rows || [];
            }
        }

        const list =
            document.getElementById(
                "approval-list"
            );

        if (!list) return;

        if (!data.length) {

            list.innerHTML = `
                <div class="bg-white rounded-2xl p-4 shadow text-center text-slate-500">
                    Tidak ada pengajuan pending.
                </div>
            `;

            return;
        }

        list.innerHTML =
            data.map(item => `

                <div class="bg-white rounded-2xl p-4 shadow border border-slate-100">

                    <div class="flex items-start justify-between gap-3">

                        <div>

                            <div class="font-bold text-slate-800">
                                ${item.nama_lengkap || "-"}
                            </div>

                            <div class="text-xs text-slate-500 mt-1">
                                ${item.kategori || "-"} • ${item.tanggal || "-"}
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

                    <div class="mt-4 flex gap-2">

                        <button
                            onclick="updateApproval('${item.id}','Approved')"
                            class="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-semibold">

                            Setujui

                        </button>

                        <button
                            onclick="updateApproval('${item.id}','Rejected')"
                            class="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-semibold">

                            Tolak

                        </button>

                    </div>

                </div>

            `).join("");

    }
    catch (error) {

        console.error(
            "Approval error:",
            error
        );

        showToast(
            "Gagal memuat approval",
            true
        );

    }
    finally {

        hideLoader();

    }
}

async function updateApproval(id, approval) {

    const user =
        AppState.currentUser;

    if (!user) return;

    const label =
        approval === "Approved"
            ? "menyetujui"
            : "menolak";

    Swal.fire({

        title:
            approval === "Approved"
                ? "Setujui Pengajuan?"
                : "Tolak Pengajuan?",

        text:
            `Anda akan ${label} pengajuan ini.`,

        icon: "question",

        showCancelButton: true,

        confirmButtonText:
            approval === "Approved"
                ? "Ya, Setujui"
                : "Ya, Tolak",

        cancelButtonText: "Batal",

        confirmButtonColor:
            approval === "Approved"
                ? "#16a34a"
                : "#dc2626"

    }).then(async result => {

        if (!result.isConfirmed) {
            return;
        }

        try {

            showLoader(
                "Memproses approval..."
            );

            const {
                error
            } = await window.supabaseClient
                .from("status_harian")
                .update({

                    approval:

                        approval,

                    approved_by:

                        user.username,
                        
                    approved_at:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    id
                );

            if (error) {
                throw error;
            }

            Swal.fire({

                icon: "success",

                title: "Berhasil",

                text:
                    approval === "Approved"
                        ? "Pengajuan berhasil disetujui"
                        : "Pengajuan berhasil ditolak",

                timer: 1500,

                showConfirmButton: false

            });

            // refresh list
            await loadStatusApproval(false);

            // refresh dashboard wali
            if (
                typeof loadWaliDashboard ===
                "function"
            ) {
                await loadWaliDashboard(false);
            }

        }
        catch (error) {

            console.error(
                "Update approval error:",
                error
            );

            showToast(
                error.message ||
                "Gagal memproses approval",
                true
            );

        }
        finally {

            hideLoader();

        }

    });

}
// ===============================
// MODE SISWA
// ===============================
function pilihModeSiswaOrtu() {
        Swal.fire({
        title: "Pilih Akses",
        text: "Masuk sebagai siswa atau orang tua?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Siswa",
        cancelButtonText: "Orang Tua",
        confirmButtonColor: "#4f46e5",
        cancelButtonColor: "#16a34a",
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then((result) => {
        if (result.isConfirmed) {
            AppState.accessMode = "siswa";
        } else {
            AppState.accessMode = "ortu";
        }

        buildMenu(AppState.currentUser);
        buildMobileBottomMenu?.(AppState.currentUser);

        showLoader("Memuat dashboard...");

        navigateTo("page-user-dashboard");
    });
}


async function loadUserDashboardStats() {

    try {

        const user = AppState.currentUser;

        if (!user) return;

        // ======================
        // LOAD LOKASI PKL
        // ======================

        if (!AppState.currentUserLocation && user.lokasiId) {
            await loadUserLocation();
        }

        // =========================
        // PEMBIMBING
        // =========================

        await loadPembimbingSiswa();

        // ======================
        // AMBIL DATA ABSENSI
        // ======================

        const {
            data: riwayat,
            error
        } = await window.supabaseClient
            .from("absensi")
            .select("*")
            .eq("username", user.username)
            .order("waktu", {
                ascending: false
            });

        if (error) {
            throw error;
        }

        // ======================
        // HARI INI
        // ======================

        const today =
            new Date()
                .toISOString()
                .split("T")[0];

        const absenHariIni =
            (riwayat || []).filter(r =>
                r.waktu &&
                r.waktu.startsWith(today)
            );

        const masuk =
            absenHariIni.find(
                r => r.tipe === "Masuk"
            );

        const pulang =
            absenHariIni.find(
                r => r.tipe === "Pulang"
            );

        const hariIni = {

            status:
                absenHariIni.length > 0
                    ? "Hadir"
                    : "Belum Absen",

            masuk:
                masuk
                    ? new Date(masuk.waktu)
                        .toLocaleTimeString(
                            "id-ID",
                            {
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        )
                    : "-",

            pulang:
                pulang
                    ? new Date(pulang.waktu)
                        .toLocaleTimeString(
                            "id-ID",
                            {
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        )
                    : "-"

        };

        // ======================
        // BULAN INI
        // ======================

        const now = new Date();

        const bulan =
            now.getMonth();

        const tahun =
            now.getFullYear();

        const bulanIni =
            (riwayat || []).filter(r => {

                if (!r.waktu) return false;

                const d =
                    new Date(r.waktu);

                return (
                    d.getMonth() === bulan &&
                    d.getFullYear() === tahun
                );

            });

        const totalMasuk =
            bulanIni.filter(
                r => r.tipe === "Masuk"
            ).length;

        const totalPulang =
            bulanIni.filter(
                r => r.tipe === "Pulang"
            ).length;

        const hariMasuk =
            new Set(
                bulanIni
                    .filter(
                        r => r.tipe === "Masuk"
                    )
                    .map(
                        r => r.waktu.substring(0, 10)
                    )
            );

        const totalHadir =
            hariMasuk.size;

        const progress =
            Math.min(
                Math.round(
                    (totalHadir / 22) * 100
                ),
                100
            );

        const ringkasan = {

            totalHadir,

            totalMasuk,

            totalPulang,

            progress

        };

        // ======================
        // LAST ABSEN
        // ======================

        let last = null;

        if (riwayat && riwayat.length > 0) {

            const row = riwayat[0];

            const dt =
                new Date(row.waktu);

            last = {

                tipe:
                    row.tipe,

                tanggal:
                    dt.toLocaleDateString(
                        "id-ID"
                    ),

                jam:
                    dt.toLocaleTimeString(
                        "id-ID"
                    ),

                jarak:
                    row.jarak || 0

            };

        }

        // ======================
        // HELPER
        // ======================

        const setText = (id, val) => {

            const el =
                document.getElementById(id);

            if (el) {
                el.innerText = val;
            }

        };

        const setHTML = (id, val) => {

            const el =
                document.getElementById(id);

            if (el) {
                el.innerHTML = val;
            }

        };

        const setWidth = (id, val) => {

            const el =
                document.getElementById(id);

            if (el) {
                el.style.width = val;
            }

        };

        // ======================
        // STATUS HARI INI
        // ======================

        setText(
            "ui-status-hari",
            hariIni.status
        );

        setText(
            "ui-masuk",
            hariIni.masuk
        );

        setText(
            "ui-pulang",
            hariIni.pulang
        );

        // ======================
        // DATA SISWA
        // ======================

        setText(
            "ui-user-name",
            user.nama
        );

        setText(
            "ui-user-kategori",
            user.kategori || "-"
        );

        // ======================
        // RINGKASAN
        // ======================

        setText(
            "ui-total-hadir",
            ringkasan.totalHadir
        );

        setText(
            "ui-total-masuk",
            ringkasan.totalMasuk
        );

        setText(
            "ui-total-pulang",
            ringkasan.totalPulang
        );

        setWidth(
            "ui-progress-kehadiran",
            `${ringkasan.progress}%`
        );

        setText(
            "ui-persentase",
            `${ringkasan.progress}%`
        );

        // ======================
        // LOKASI PKL
        // ======================

        const lokasiEl =
            document.getElementById(
                "ui-user-lokasi"
            );

        if (
            lokasiEl &&
            AppState.currentUserLocation
        ) {

            const lokasi =
                AppState.currentUserLocation;

            lokasiEl.innerHTML = `
                <i class="fa-solid fa-location-dot"></i>
                ${lokasi.namaIndustri}
            `;

            lokasiEl.href =
                `https://www.google.com/maps?q=${lokasi.lat},${lokasi.lng}`;

            lokasiEl.target =
                "_blank";
        }

        // ======================
        // PEMBIMBING
        // ======================

        // setText(
        //     "ui-user-pembina",
        //     user.pembimbingNama || "-"
        // );

        const waEl =
            document.getElementById(
                "ui-user-wa-pembina"
            );

        if (
            waEl &&
            user.pembimbingWa
        ) {

            let wa =
                user.pembimbingWa.replace(
                    /\D/g,
                    ""
                );

            if (wa.startsWith("08")) {
                wa =
                    "62" +
                    wa.substring(1);
            }

            waEl.href =
                `https://wa.me/${wa}`;

            waEl.classList.remove(
                "hidden"
            );

        } else if (waEl) {

            waEl.classList.add(
                "hidden"
            );

        }

        // ======================
        // LAST ABSEN
        // ======================

        if (last) {

            setHTML(
                "ui-last-absen",
                `
                <p><b>${last.tipe}</b></p>
                <p>${last.tanggal} ${last.jam}</p>
                <p>${Math.round(last.jarak)} meter</p>
                `
            );

        } else {

            setHTML(
                "ui-last-absen",
                `
                <p>
                    Belum ada riwayat absensi
                </p>
                `
            );

        }

    }
    catch (err) {

        console.error(
            "Dashboard siswa error:",
            err
        );

        showToast(
            "Gagal memuat dashboard",
            true
        );

    }
    finally {

        hideLoader();

    }

}

async function loadPembimbingSiswa() {

    const user = AppState.currentUser;

    if (!user) {
        console.warn("User belum tersedia");
        return null;
    }

    if (!user.pId) {
        console.warn("Siswa belum memiliki p_id");
        
        const el = document.getElementById("ui-user-pembina");
        if (el) {
            el.innerText = "Belum ditentukan";
        }

        return null;
    }

    try {

        const {
            data: guru,
            error
        } = await window.supabaseClient
            .from("guru")
            .select("p_id,nama_lengkap")
            .eq("p_id", user.pId || user.p_id)
            .maybeSingle();

        if (error) {
            console.error(
                "Gagal mengambil data pembimbing:",
                error
            );

            return null;
        }

        if (!guru) {

            console.warn(
                "Guru tidak ditemukan untuk p_id:",
                user.pId
            );

            const el =
                document.getElementById(
                    "ui-user-pembina"
                );

            if (el) {
                el.innerText = "Belum ditentukan";
            }

            return null;
        }

        // =========================
        // TAMPILKAN NAMA PEMBIMBING
        // =========================

        const pembinaEl =
            document.getElementById(
                "ui-user-pembina"
            );

        if (pembinaEl) {
            pembinaEl.innerText =
                guru.nama_lengkap || "-";
        }

        return guru;

    } catch (error) {

        console.error(
            "Load pembimbing error:",
            error
        );

        return null;
    }
}

function getTodayStatus(riwayat) {

    const today = new Date().toLocaleDateString("id-ID");

    const todayData = riwayat.filter(r =>
        r.timestamp.includes(today)
    );

    const masuk = todayData.find(r => r.tipe === "Masuk");
    const pulang = todayData.find(r => r.tipe === "Pulang");

    return {
        status: todayData.length ? "Hadir" : "Belum Absen",
        jamMasuk: masuk ? masuk.timestamp : "-",
        jamPulang: pulang ? pulang.timestamp : "-"
    };
}

function getMonthlySummary(riwayat) {

    const month = new Date().getMonth();

    const thisMonth = riwayat.filter(r => {
        const d = parseDate(r.timestamp);
        return d.getMonth() === month;
    });

    const hariMasuk = new Set(
        thisMonth
            .filter(r => r.tipe === "Masuk")
            .map(r => r.timestamp.split(" ")[0])
    );

    return {
        totalHadir: hariMasuk.size,
        totalMasuk: thisMonth.filter(r => r.tipe === "Masuk").length,
        totalPulang: thisMonth.filter(r => r.tipe === "Pulang").length
    };
}

function getAttendanceProgress(totalHadir) {

    const targetHariKerja = 22; // bisa kamu ganti nanti dari GAS

    const percent = (totalHadir / targetHariKerja) * 100;

    return Math.min(percent, 100);
}

function getDayName(day, month, year) {
    const days = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu"
    ];

    return days[new Date(year, month - 1, day).getDay()];
}

function getMonthShort(month) {
    const months = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];

    return months[month - 1] || "";
}

function initStudentHistoryFilter() {

    const now = new Date();

    const monthEl = document.getElementById("student-history-month");
    const yearEl = document.getElementById("student-history-year");

    if (!monthEl || !yearEl) return;

    monthEl.value = String(now.getMonth() + 1);
    yearEl.value = String(now.getFullYear());

}

//KONFIRMASI KEHADIRAN

function openStatusCamera() {

    document
        .getElementById("status-camera-input")
        .click();

}

function openStatusGallery() {

    document
        .getElementById("status-gallery-input")
        .click();

}

function initStatusHarianForm() {
    const tanggalEl = document.getElementById("status-tanggal");

    if (tanggalEl) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");

        tanggalEl.value = `${yyyy}-${mm}-${dd}`;
    }
}

//Compress
async function compressImage(file, options = {}) {
    const {
        maxWidth = 1280,
        quality = 0.75
    } = options;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = height * (maxWidth / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                resolve(
                    canvas.toDataURL(
                        "image/jpeg",
                        quality
                    )
                );
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

//PREVIEW
function previewApprovalBukti(url) {

    Swal.fire({
        title: "Bukti Pengajuan",
        imageUrl: url,
        imageAlt: "Bukti Pengajuan",
        confirmButtonText: "Tutup",
        confirmButtonColor: "#4f46e5",

        imageWidth: 500,

        didOpen: () => {

            const img =
                Swal.getImage();

            if (img) {

                img.onerror = () => {

                    Swal.update({
                        icon: "info",
                        imageUrl: "",
                        html: `
                            <div class="text-center py-4">

                                <i class="fa-solid fa-image text-5xl text-slate-300 mb-3"></i>

                                <div class="font-semibold text-slate-700">
                                    Bukti Tidak Tersedia
                                </div>

                                <div class="text-sm text-slate-500 mt-2">
                                    File bukti telah dihapus otomatis oleh sistem
                                    atau sudah tidak tersedia.
                                </div>

                            </div>
                        `
                    });

                };

            }

        }

    });

}

async function checkHariAktifPKLByTanggal(
    user,
    tanggal
) {

    try {

        if (
            !user ||
            !tanggal
        ) {

            return {
                aktif: true
            };
        }

        const lokasiId =
            String(
                user.lokasiId || ""
            )
            .trim()
            .toUpperCase();

        // =====================================
        // TENTUKAN HARI
        // =====================================

        const date =
            new Date(
                `${tanggal}T00:00:00`
            );

        const namaHari =
            [
                "minggu",
                "senin",
                "selasa",
                "rabu",
                "kamis",
                "jumat",
                "sabtu"
            ][
                date.getDay()
            ];

        // =====================================
        // CEK HARI LIBUR
        // =====================================

        const {
            data: liburData,
            error: liburError
        } =
            await window.supabaseClient
                .from("hari_libur")
                .select("*")
                .eq(
                    "tanggal",
                    tanggal
                );

        if (liburError) {

            throw liburError;
        }

        // =====================================
        // CARI LIBUR YANG BERLAKU
        // UNTUK LOKASI SISWA
        // =====================================

        const liburAktif =
            (liburData || [])
            .find(item => {

                const berlaku =
                    String(
                        item.berlaku || ""
                    )
                    .trim()
                    .toUpperCase();

                // ---------------------------------
                // BERLAKU UNTUK SEMUA LOKASI
                // ---------------------------------

                if (
                    berlaku === "ALL"
                ) {

                    return true;
                }

                // ---------------------------------
                // BERLAKU UNTUK BEBERAPA LOKASI
                // Contoh:
                // L001,L002,L003
                // ---------------------------------

                const lokasiList =
                    berlaku
                    .split(",")
                    .map(
                        value =>
                            value
                            .trim()
                            .toUpperCase()
                    )
                    .filter(Boolean);

                return lokasiList.includes(
                    lokasiId
                );

            });

        // =====================================
        // JIKA LIBUR NASIONAL
        // =====================================

        if (liburAktif) {

            return {

                aktif: false,

                jenis:
                    "LIBUR_NASIONAL",

                namaLibur:
                    liburAktif.nama_libur,

                tanggal,

                message:
                    liburAktif.nama_libur

            };
        }

        // =====================================
        // CEK KALENDER INDUSTRI
        // =====================================

        const {
            data: kalender,
            error: kalenderError
        } =
            await window.supabaseClient
                .from(
                    "kalender_industri"
                )
                .select("*")
                .eq(
                    "lokasi_id",
                    lokasiId
                )
                .eq(
                    "aktif",
                    true
                )
                .maybeSingle();

        if (kalenderError) {

            throw kalenderError;
        }

        // =====================================
        // TIDAK ADA KALENDER INDUSTRI
        // =====================================

        if (!kalender) {

            return {

                aktif: true

            };
        }

        // =====================================
        // CEK HARI AKTIF
        // =====================================

        const hariAktif =
            kalender[
                namaHari
            ];

        // =====================================
        // HARI LIBUR INDUSTRI
        // =====================================

        if (
            hariAktif === false ||
            hariAktif === 0
        ) {

            return {

                aktif: false,

                jenis:
                    "LIBUR_INDUSTRI",

                namaIndustri:
                    kalender.nama_industri,

                namaHari,

                tanggal,

                message:
                    `${kalender.nama_industri} libur pada hari ${namaHari}`

            };
        }

        // =====================================
        // HARI AKTIF
        // =====================================

        return {

            aktif: true

        };

    }
    catch (error) {

        console.error(
            "checkHariAktifPKLByTanggal:",
            error
        );

        throw error;
    }
}

async function submitStatusHarian() {

    try {

        const user =
            AppState.currentUser;

        if (!user) return;

        // =====================================
        // AMBIL FORM
        // =====================================

        const tanggal =
            document.getElementById(
                "status-tanggal"
            )?.value;

        const status =
            document.getElementById(
                "status-tipe"
            )?.value;

        const keterangan =
            document.getElementById(
                "status-keterangan"
            )?.value || "";

        // =====================================
        // VALIDASI TANGGAL
        // =====================================

        if (!tanggal) {

            showToast(
                "Tanggal wajib diisi",
                true
            );

            return;
        }

        // =====================================
        // VALIDASI STATUS
        // =====================================

        if (!status) {

            showToast(
                "Pilih status terlebih dahulu",
                true
            );

            return;
        }

        // =====================================
        // CEK HARI AKTIF PKL
        // =====================================

        showLoader(
            "Memeriksa kalender PKL..."
        );

        const hariAktif =
            await checkHariAktifPKLByTanggal(
                user,
                tanggal
            );

        if (
            !hariAktif.aktif
        ) {

            hideLoader();

            // =================================
            // LIBUR NASIONAL
            // =================================

            if (
                hariAktif.jenis ===
                "LIBUR_NASIONAL"
            ) {

                await Swal.fire({

                    icon: "info",

                    title:
                        "Pengajuan Dinonaktifkan",

                    html: `

                        <div class="text-center">

                            <div class="mb-4">

                                <i
                                    class="fa-solid fa-calendar-xmark"
                                    style="
                                        font-size:60px;
                                        color:#ef4444;
                                    ">
                                </i>

                            </div>

                            <div
                                class="
                                    bg-red-50
                                    border
                                    border-red-200
                                    rounded-xl
                                    p-4
                                ">

                                <div
                                    class="
                                        font-bold
                                        text-red-700
                                        mb-2
                                    ">

                                    Hari Libur Nasional

                                </div>

                                <div
                                    class="
                                        text-slate-700
                                        font-semibold
                                    ">

                                    ${hariAktif.namaLibur}

                                </div>

                            </div>

                            <p
                                class="
                                    mt-4
                                    text-sm
                                    text-slate-500
                                ">

                                Pengajuan status kehadiran
                                tidak dapat dilakukan
                                pada hari libur nasional.

                            </p>

                        </div>

                    `,

                    confirmButtonText:
                        "Mengerti",

                    confirmButtonColor:
                        "#4F46E5"

                });

                return;
            }

            // =================================
            // LIBUR INDUSTRI
            // =================================

            if (
                hariAktif.jenis ===
                "LIBUR_INDUSTRI"
            ) {

                await Swal.fire({

                    icon: "warning",

                    title:
                        "Pengajuan Dinonaktifkan",

                    html: `

                        <div class="text-center">

                            <div class="mb-4">

                                <i
                                    class="fa-solid fa-building-circle-xmark"
                                    style="
                                        font-size:60px;
                                        color:#f97316;
                                    ">
                                </i>

                            </div>

                            <div
                                class="
                                    bg-orange-50
                                    border
                                    border-orange-200
                                    rounded-xl
                                    p-4
                                ">

                                <div
                                    class="
                                        font-bold
                                        text-orange-700
                                        mb-2
                                    ">

                                    Hari Libur Industri

                                </div>

                                <div
                                    class="
                                        text-slate-700
                                        font-semibold
                                    ">

                                    ${hariAktif.namaIndustri}

                                </div>

                            </div>

                            <p
                                class="
                                    mt-4
                                    text-sm
                                    text-slate-500
                                ">

                                Industri tidak menerapkan
                                kegiatan PKL pada hari

                                <b>
                                    ${hariAktif.namaHari.toUpperCase()}
                                </b>.

                            </p>

                        </div>

                    `,

                    confirmButtonText:
                        "Mengerti",

                    confirmButtonColor:
                        "#4F46E5"

                });

                return;
            }

            return;
        }

        // =====================================
        // VALIDASI FOTO
        // =====================================

        const wajibFoto = [
            "Sakit",
            "Izin"
        ];

        if (
            wajibFoto.includes(status) &&
            !statusPhoto
        ) {

            showToast(
                "Silakan upload foto bukti terlebih dahulu.",
                true
            );

            return;
        }

        // =====================================
        // CEK DUPLIKAT
        // =====================================

        showLoader(
            "Memeriksa pengajuan..."
        );

        const {
            data: existing,
            error: cekError
        } =
            await window.supabaseClient
                .from("status_harian")
                .select("id")
                .eq(
                    "username",
                    user.username
                )
                .eq(
                    "tanggal",
                    tanggal
                );

        if (cekError) {

            throw cekError;
        }

        if (
            existing &&
            existing.length > 0
        ) {

            hideLoader();

            await Swal.fire({

                icon: "warning",

                title:
                    "Pengajuan Sudah Ada",

                text:
                    "Anda sudah mengirim status untuk tanggal tersebut.",

                confirmButtonText:
                    "Mengerti",

                confirmButtonColor:
                    "#4F46E5"

            });

            return;
        }

        // =====================================
        // UPLOAD FOTO
        // =====================================

        let fotoUrl = null;

        if (statusPhoto) {

            showLoader(
                "Mengupload bukti..."
            );

            fotoUrl =
                await uploadFotoStatus(
                    statusPhoto,
                    user.username
                );
        }

        // =====================================
        // INSERT STATUS
        // =====================================

        showLoader(
            "Menyimpan pengajuan..."
        );

        const {
            error: insertError
        } =
            await window.supabaseClient
                .from("status_harian")
                .insert([{

                    tanggal:
                        tanggal,

                    username:
                        user.username,

                    nama_lengkap:
                        user.nama,

                    kategori:
                        user.kategori,

                    lokasi_id:
                        user.lokasiId,

                    status:
                        status,

                    keterangan:
                        keterangan,

                    approval:
                        "Pending",

                    approved_by:
                        null,

                    foto_bukti:
                        fotoUrl

                }]);

        if (insertError) {

            throw insertError;
        }

        // =====================================
        // BERHASIL
        // =====================================

        hideLoader();

        await Swal.fire({

            icon: "success",

            title:
                "Berhasil",

            text:
                "Konfirmasi kehadiran berhasil dikirim.",

            timer: 2000,

            timerProgressBar: true,

            showConfirmButton: true,

            confirmButtonText:
                "OK",

            confirmButtonColor:
                "#4F46E5"

        });

        // =====================================
        // RESET
        // =====================================

        resetStatusHarianForm();

        navigateTo(
            "page-user-dashboard"
        );

    }
    catch (error) {

        console.error(
            "Submit status error:",
            error
        );

        hideLoader();

        await Swal.fire({

            icon: "error",

            title:
                "Gagal Mengirim",

            text:
                error.message ||
                "Terjadi kesalahan saat mengirim konfirmasi.",

            confirmButtonText:
                "Mengerti",

            confirmButtonColor:
                "#DC2626"

        });

    }
    finally {

        hideLoader();

    }
}

function resetStatusHarianForm() {

    statusPhoto = null;

    document.getElementById("status-tipe").value = "";

    document.getElementById("status-keterangan").value = "";

    document.getElementById("status-camera-input").value = "";

    document.getElementById("status-gallery-input").value = "";

    const preview =
        document.getElementById("status-photo-preview");

    preview.src = "";

    preview.classList.add("hidden-page");

}