let kepsekMap = null;
let kepsekMarkers = [];
let kepsekLokasiSelect = null;

const KepsekDashboardService = {

    data: [],
    filteredData: [],
    selectedDate: null,
    selectedLokasi: "ALL",

    // =====================================================
    // INIT
    // =====================================================

    async init(useLoader = true) {

        try {

            const tanggalEl =
                document.getElementById(
                    "kepsek-filter-tanggal"
                );

            // =============================================
            // SET TANGGAL DEFAULT
            // =============================================

            if (tanggalEl && !tanggalEl.value) {

                const today = new Date();

                const year =
                    today.getFullYear();

                const month =
                    String(
                        today.getMonth() + 1
                    ).padStart(2, "0");

                const day =
                    String(
                        today.getDate()
                    ).padStart(2, "0");

                tanggalEl.value =
                    `${year}-${month}-${day}`;
            }


            // =============================================
            // LOAD LOKASI
            // =============================================

            await this.loadLokasi();


            // =============================================
            // LOAD DASHBOARD
            // =============================================

            await this.load(useLoader);

        }
        catch (error) {

            console.error(
                "KepsekDashboardService.init:",
                error
            );

            showToast(
                "Gagal menyiapkan dashboard Kepala Sekolah",
                true
            );
        }
    },


    // =====================================================
    // LOAD LOKASI
    // =====================================================

    async loadLokasi() {

        try {

            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("lokasi")
                    .select(`
                        lokasi_id,
                        nama_industri,
                        latitude,
                        longitude,
                        radius,
                        alamat,
                        status
                    `)
                    .order(
                        "nama_industri",
                        {
                            ascending: true
                        }
                    );


            if (error) {
                throw error;
            }


            const lokasi =
                data || [];


            console.log(
                "LOKASI:",
                lokasi
            );


            const select =
                document.getElementById(
                    "kepsek-filter-lokasi"
                );


            if (!select) {
                return;
            }


            // =============================================
            // HAPUS TOMSELECT LAMA
            // =============================================

            if (
                window.kepsekLokasiSelect
            ) {

                try {

                    window.kepsekLokasiSelect.destroy();

                }
                catch (e) {

                    console.warn(
                        "Gagal destroy TomSelect lokasi",
                        e
                    );
                }

                window.kepsekLokasiSelect =
                    null;
            }


            // =============================================
            // ISI SELECT
            // =============================================

            select.innerHTML = `
                <option value="ALL">
                    Semua Lokasi
                </option>

                ${
                    lokasi
                        .map(item => `

                            <option
                                value="${this.escapeAttribute(
                                    item.lokasi_id
                                )}"
                            >
                                ${this.escapeHtml(
                                    item.nama_industri ||
                                    item.lokasi_id
                                )}
                            </option>

                        `)
                        .join("")
                }
            `;


            // =============================================
            // TOM SELECT
            // =============================================

            if (
                typeof TomSelect !==
                "undefined"
            ) {

                window.kepsekLokasiSelect =
                    new TomSelect(
                        "#kepsek-filter-lokasi",
                        {
                            create: false,
                            allowEmptyOption: false,
                            placeholder:
                                "Ketik nama lokasi PKL...",
                            sortField: {
                                field: "text",
                                direction: "asc"
                            }
                        }
                    );


                window.kepsekLokasiSelect
                    .setValue("ALL");


                // =========================================
                // EVENT PERUBAHAN LOKASI
                // =========================================

                window.kepsekLokasiSelect
                    .on(
                        "change",
                        value => {

                            this.selectedLokasi =
                                value ||
                                "ALL";

                            this.applyFilters();

                        }
                    );
            }
            else {

                select.value =
                    "ALL";


                select.addEventListener(
                    "change",
                    () => {

                        this.selectedLokasi =
                            select.value ||
                            "ALL";

                        this.applyFilters();
                    }
                );
            }

        }
        catch (error) {

            console.error(
                "KepsekDashboardService.loadLokasi:",
                error
            );

            showToast(
                "Gagal memuat daftar lokasi",
                true
            );
        }
    },


    // =====================================================
    // LOAD DASHBOARD
    // =====================================================

    async load(useLoader = false) {

        try {

            const user =
                AppState.currentUser;


            if (!user) {

                console.warn(
                    "KepsekDashboardService: user belum tersedia"
                );

                return;
            }


            if (useLoader) {

                showLoader(
                    "Memuat dashboard Kepala Sekolah..."
                );
            }


            // =============================================
            // TANGGAL
            // =============================================

            const tanggal =
                document.getElementById(
                    "kepsek-filter-tanggal"
                )?.value;


            if (!tanggal) {

                showToast(
                    "Tanggal belum dipilih",
                    true
                );

                return;
            }


            this.selectedDate =
                tanggal;


            // =============================================
            // LOKASI
            // =============================================

            const lokasiSelect =
                document.getElementById(
                    "kepsek-filter-lokasi"
                );


            this.selectedLokasi =
                lokasiSelect?.value ||
                this.selectedLokasi ||
                "ALL";


            // =============================================
            // LOAD SISWA
            // =============================================

            const {
                data: siswaData,
                error: siswaError
            } =
                await window.supabaseClient
                    .from("users")
                    .select(`
                        username,
                        nama_lengkap,
                        kategori,
                        lokasi_id,
                        p_id,
                        parent_id,
                        role
                    `)
                    .eq(
                        "role",
                        "siswa"
                    );


            if (siswaError) {
                throw siswaError;
            }


            const siswa =
                siswaData || [];


            // =============================================
            // RANGE TANGGAL
            // =============================================

            const startDate =
                `${tanggal}T00:00:00`;

            const endDate =
                `${tanggal}T23:59:59.999`;


            // =============================================
            // LOAD ABSENSI
            // =============================================

            const {
                data: absensiData,
                error: absensiError
            } =
                await window.supabaseClient
                    .from("absensi")
                    .select(`
                        id,
                        waktu,
                        username,
                        nama_lengkap,
                        kategori,
                        lokasi_id,
                        nama_industri,
                        tipe,
                        latitude,
                        longitude,
                        jarak,
                        foto_url,
                        maps_url
                    `)
                    .gte(
                        "waktu",
                        startDate
                    )
                    .lte(
                        "waktu",
                        endDate
                    )
                    .order(
                        "waktu",
                        {
                            ascending: true
                        }
                    );


            if (absensiError) {
                throw absensiError;
            }


            const absensi =
                absensiData || [];


            // =============================================
            // LOAD STATUS HARIAN
            // =============================================

            const {
                data: statusData,
                error: statusError
            } =
                await window.supabaseClient
                    .from("status_harian")
                    .select(`
                        id,
                        tanggal,
                        username,
                        nama_lengkap,
                        kategori,
                        lokasi_id,
                        status,
                        keterangan,
                        approval,
                        approved_by,
                        foto_bukti,
                        created_at,
                        approved_at
                    `)
                    .eq(
                        "tanggal",
                        tanggal
                    );


            if (statusError) {
                throw statusError;
            }


            const statusHarian =
                statusData || [];


            // =============================================
            // LOAD LOKASI
            // =============================================

            const {
                data: lokasiData,
                error: lokasiError
            } =
                await window.supabaseClient
                    .from("lokasi")
                    .select(`
                        lokasi_id,
                        nama_industri,
                        latitude,
                        longitude,
                        radius,
                        alamat,
                        status
                    `);


            if (lokasiError) {
                throw lokasiError;
            }


            const lokasi =
                lokasiData || [];
            this.lokasiData = lokasi;


            // =============================================
            // BUILD DATA
            // =============================================

            // =================================================
            // PROSES DATA
            // =================================================

            const result =
                this.buildData(
                    siswa,
                    absensi,
                    statusHarian,
                    lokasi,
                    tanggal
                );


            // =================================================
            // AMBIL FILTER LOKASI YANG DIPILIH
            // =================================================
            const selectedLokasi =
                lokasiSelect?.value || "ALL";


            // =================================================
            // FILTER BERDASARKAN LOKASI
            // =================================================

            let dashboardData =
                [...result];


            // Jika bukan ALL,
            // tampilkan hanya siswa pada lokasi tersebut

            if (
                selectedLokasi &&
                selectedLokasi !== "ALL"
            ) {

                dashboardData =
                    result.filter(
                        siswa =>
                            String(
                                siswa.lokasiId || ""
                            ).trim()
                            ===
                            String(
                                selectedLokasi
                            ).trim()
                    );
            }


            // =================================================
            // SIMPAN DATA
            // =================================================

            this.data =
                dashboardData;


            this.filteredData =
                [...dashboardData];


            // =================================================
            // DEBUG
            // =================================================

            console.log(
                "Kepsek selected lokasi:",
                selectedLokasi
            );

            console.log(
                "Total data sebelum filter:",
                result.length
            );

            console.log(
                "Total data setelah filter lokasi:",
                dashboardData.length
            );


            // =================================================
            // RENDER SUMMARY
            // =================================================

            this.renderSummary(
                dashboardData
            );


            // =================================================
            // RENDER REKAP INDUSTRI
            // =================================================

            this.renderIndustri(
                dashboardData
            );


            // =================================================
            // RENDER FILTER SISWA
            // =================================================

            this.renderFilter(
                dashboardData
            );


            // =================================================
            // RENDER TABLE
            // =================================================

            this.renderTable(
                dashboardData
            );


            // =================================================
            // RENDER MAP
            // =================================================

            this.renderMap(
                dashboardData
            );


        }
        catch (error) {

            console.error(
                "KepsekDashboardService.load:",
                error
            );

            showToast(
                "Gagal memuat dashboard Kepala Sekolah",
                true
            );

        }
        finally {

            if (useLoader) {
                hideLoader();
            }
        }
    },


    // =====================================================
    // BUILD DATA
    // =====================================================

    buildData(
        siswa,
        absensi,
        statusHarian,
        lokasi,
        tanggal
    ) {

        const result = [];


        // =============================================
        // MAP LOKASI
        // =============================================

        const lokasiMap = {};


        lokasi.forEach(
            item => {

                if (!item.lokasi_id) {
                    return;
                }

                lokasiMap[
                    item.lokasi_id
                ] = item;
            }
        );


        // =============================================
        // GROUP ABSENSI
        // =============================================

        const absensiMap = {};


        absensi.forEach(
            item => {

                if (!item.username) {
                    return;
                }


                if (
                    !absensiMap[item.username]
                ) {

                    absensiMap[
                        item.username
                    ] = [];
                }


                absensiMap[
                    item.username
                ].push(item);
            }
        );


        // =============================================
        // GROUP STATUS
        // =============================================

        const statusMap = {};


        statusHarian.forEach(
            item => {

                if (!item.username) {
                    return;
                }


                statusMap[
                    item.username
                ] = item;
            }
        );


        // =============================================
        // PROSES SISWA
        // =============================================

        siswa.forEach(
            siswaItem => {

                const username =
                    siswaItem.username;


                if (!username) {
                    return;
                }


                const dataAbsensi =
                    absensiMap[
                        username
                    ] || [];


                const status =
                    statusMap[
                        username
                    ] || null;


                const lokasiItem =
                    lokasiMap[
                        siswaItem.lokasi_id
                    ] || null;


                // =========================================
                // CARI ABSEN MASUK
                // =========================================

                const masuk =
                    dataAbsensi.find(
                        item => {

                            const tipe =
                                String(
                                    item.tipe || ""
                                )
                                .trim()
                                .toLowerCase();


                            return (
                                tipe === "masuk" ||
                                tipe.includes("masuk")
                            );
                        }
                    );


                // =========================================
                // CARI ABSEN PULANG
                // =========================================

                const pulang =
                    dataAbsensi.find(
                        item => {

                            const tipe =
                                String(
                                    item.tipe || ""
                                )
                                .trim()
                                .toLowerCase();


                            return (
                                tipe === "pulang" ||
                                tipe.includes("pulang") ||
                                tipe.includes("keluar") ||
                                tipe.includes("check out") ||
                                tipe.includes("checkout")
                            );
                        }
                    );


                // =========================================
                // STATUS
                // =========================================

                let statusText =
                    "Belum Hadir";


                let keterangan =
                    "";


                if (masuk) {

                    statusText =
                        "Hadir";


                    if (
                        pulang
                    ) {

                        keterangan =
                            "Masuk & Pulang";

                    }
                    else {

                        keterangan =
                            "Sudah Masuk, Belum Pulang";
                    }

                }
                else if (status) {

                    const approval =
                        String(
                            status.approval || ""
                        )
                        .trim()
                        .toLowerCase();


                    if (
                        approval ===
                        "pending"
                    ) {

                        statusText =
                            "Pending";

                    }
                    else if (
                        approval ===
                        "approved"
                    ) {

                        statusText =
                            status.status ||
                            "Disetujui";

                    }
                    else if (
                        approval ===
                        "rejected"
                    ) {

                        statusText =
                            "Ditolak";

                    }
                    else {

                        statusText =
                            status.status ||
                            "Pengajuan";
                    }


                    keterangan =
                        status.keterangan ||
                        "";
                }


                // =========================================
                // INDUSTRI
                // =========================================

                const industri =
                    masuk?.nama_industri ||
                    pulang?.nama_industri ||
                    lokasiItem?.nama_industri ||
                    "-";


                // =========================================
                // KOORDINAT
                // =========================================

                const latitude =
                    masuk?.latitude ??
                    pulang?.latitude ??
                    lokasiItem?.latitude ??
                    null;


                const longitude =
                    masuk?.longitude ??
                    pulang?.longitude ??
                    lokasiItem?.longitude ??
                    null;


                // =========================================
                // DATA FINAL
                // =========================================

                result.push({

                    username,

                    nama:
                        siswaItem.nama_lengkap ||
                        "-",

                    kategori:
                        siswaItem.kategori ||
                        "-",

                    lokasiId:
                        siswaItem.lokasi_id ||
                        "-",

                    pId:
                        siswaItem.p_id ||
                        null,

                    parentId:
                        siswaItem.parent_id ||
                        null,

                    industri,

                    alamat:
                        lokasiItem?.alamat ||
                        "-",

                    jamMasuk:
                        masuk
                            ? this.formatTime(
                                masuk.waktu
                            )
                            : "-",

                    jamPulang:
                        pulang
                            ? this.formatTime(
                                pulang.waktu
                            )
                            : "-",

                    status:
                        statusText,

                    keterangan,

                    jarak:
                        masuk?.jarak ??
                        pulang?.jarak ??
                        null,

                    fotoUrl:
                        masuk?.foto_url ||
                        pulang?.foto_url ||
                        null,

                    mapsUrl:
                        masuk?.maps_url ||
                        pulang?.maps_url ||
                        null,

                    latitude,

                    longitude,

                    tipeMasuk:
                        masuk?.tipe ||
                        null,

                    tipePulang:
                        pulang?.tipe ||
                        null,

                    absensi:
                        dataAbsensi,

                    statusHarian:
                        status
                });
            }
        );


        return result;
    },


    // =====================================================
    // FORMAT TIME
    // =====================================================

    formatTime(value) {

        if (!value) {
            return "-";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "-";
        }


        return date.toLocaleTimeString(
            "id-ID",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    },


    // =====================================================
    // SUMMARY
    // =====================================================

    renderSummary(data, lokasi = []) {

        const totalSiswa = data.length;

        const totalHadir =
            data.filter(
                s => s.jamMasuk !== "-"
            ).length;

        const totalBelum =
            data.filter(
                s =>
                    s.jamMasuk === "-" &&
                    s.status === "Belum Hadir"
            ).length;

        const totalIndustri =
            lokasi.filter(
                l =>
                    l.status === true ||
                    l.status === "aktif" ||
                    l.status === "Active" ||
                    l.status === "active"
            ).length;

        const totalStatus =
            data.filter(
                s =>
                    s.status !== "Hadir" &&
                    s.status !== "Belum Hadir"
            ).length;

        const totalPending =
            data.filter(
                s =>
                    String(s.status || "")
                        .trim()
                        .toLowerCase() === "pending"
            ).length;

        this.setText(
            "kepsek-total-siswa",
            totalSiswa
        );

        this.setText(
            "kepsek-total-hadir",
            totalHadir
        );

        this.setText(
            "kepsek-total-belum",
            totalBelum
        );

        this.setText(
            "kepsek-total-industri",
            totalIndustri
        );

        this.setText(
            "kepsek-total-status",
            totalStatus
        );

        this.setText(
            "kepsek-total-pending",
            totalPending
        );
    },


    // =====================================================
    // REKAP INDUSTRI
    // =====================================================

    renderIndustri(data) {

        const container =
            document.getElementById(
                "kepsek-rekap-industri"
            );


        if (!container) {
            return;
        }


        const map = {};


        data.forEach(
            siswa => {

                const industri =
                    siswa.industri ||
                    "Belum Ditentukan";


                if (!map[industri]) {

                    map[industri] = {

                        total: 0,

                        hadir: 0,

                        belum: 0,

                        status: 0
                    };
                }


                map[industri].total++;


                if (
                    siswa.jamMasuk !== "-"
                ) {

                    map[industri].hadir++;

                }
                else if (
                    siswa.status ===
                    "Belum Hadir"
                ) {

                    map[industri].belum++;

                }
                else {

                    map[industri].status++;
                }
            }
        );


        const entries =
            Object.entries(map);


        if (!entries.length) {

            container.innerHTML = `
                <div class="text-sm text-slate-500">
                    Belum ada data industri.
                </div>
            `;

            return;
        }


        container.innerHTML =
            entries
                .sort(
                    (a, b) =>
                        b[1].total -
                        a[1].total
                )
                .map(
                    ([industri, item]) => `

                        <div class="border rounded-xl p-4">

                            <div class="flex items-center justify-between">

                                <div>

                                    <div class="font-bold text-slate-800">
                                        ${this.escapeHtml(
                                            industri
                                        )}
                                    </div>

                                    <div class="text-xs text-slate-500 mt-1">
                                        ${item.total} siswa
                                    </div>

                                </div>

                                <div class="text-green-600 font-bold">
                                    ${item.hadir}
                                </div>

                            </div>

                            <div class="grid grid-cols-3 gap-2 mt-3 text-xs">

                                <div class="bg-green-50 rounded-lg p-2 text-center">

                                    <div class="text-green-700 font-bold">
                                        ${item.hadir}
                                    </div>

                                    <div class="text-slate-500">
                                        Hadir
                                    </div>

                                </div>

                                <div class="bg-red-50 rounded-lg p-2 text-center">

                                    <div class="text-red-700 font-bold">
                                        ${item.belum}
                                    </div>

                                    <div class="text-slate-500">
                                        Belum
                                    </div>

                                </div>

                                <div class="bg-orange-50 rounded-lg p-2 text-center">

                                    <div class="text-orange-700 font-bold">
                                        ${item.status}
                                    </div>

                                    <div class="text-slate-500">
                                        Status
                                    </div>

                                </div>

                            </div>

                        </div>
                    `
                )
                .join("");
    },


    // =====================================================
    // FILTER OPTION
    // =====================================================

    renderFilter(data) {

        const kategoriEl =
            document.getElementById(
                "kepsek-filter-kategori"
            );


        const industriEl =
            document.getElementById(
                "kepsek-filter-industri"
            );


        // =============================================
        // KATEGORI
        // =============================================

        if (kategoriEl) {

            const current =
                kategoriEl.value;


            const kategori =
                [
                    ...new Set(
                        data
                            .map(
                                item =>
                                    item.kategori
                            )
                            .filter(Boolean)
                    )
                ]
                .sort();


            kategoriEl.innerHTML = `
                <option value="">
                    Semua Kelas
                </option>

                ${
                    kategori
                        .map(
                            item => `
                                <option value="${this.escapeAttribute(item)}">
                                    ${this.escapeHtml(item)}
                                </option>
                            `
                        )
                        .join("")
                }
            `;


            if (
                kategori.includes(current)
            ) {

                kategoriEl.value =
                    current;
            }
        }


        // =============================================
        // INDUSTRI
        // =============================================

        if (industriEl) {

            const current =
                industriEl.value;


            const industri =
                [
                    ...new Set(
                        data
                            .map(
                                item =>
                                    item.industri
                            )
                            .filter(
                                item =>
                                    item &&
                                    item !== "-"
                            )
                    )
                ]
                .sort();


            industriEl.innerHTML = `
                <option value="">
                    Semua Industri
                </option>

                ${
                    industri
                        .map(
                            item => `
                                <option value="${this.escapeAttribute(item)}">
                                    ${this.escapeHtml(item)}
                                </option>
                            `
                        )
                        .join("")
                }
            `;


            if (
                industri.includes(current)
            ) {

                industriEl.value =
                    current;
            }
        }
    },


    // =====================================================
    // APPLY FILTER
    // =====================================================

    applyFilters() {

        const search =
            String(
                document.getElementById(
                    "kepsek-search"
                )?.value || ""
            )
            .trim()
            .toLowerCase();


        const kategori =
            document.getElementById(
                "kepsek-filter-kategori"
            )?.value || "";


        const industri =
            document.getElementById(
                "kepsek-filter-industri"
            )?.value || "";


        const lokasi =
            document.getElementById(
                "kepsek-filter-lokasi"
            )?.value ||
            this.selectedLokasi ||
            "ALL";


        this.selectedLokasi =
            lokasi;


        this.filteredData =
            this.data.filter(
                siswa => {

                    const cocokSearch =
                        !search ||
                        String(
                            siswa.nama || ""
                        )
                        .toLowerCase()
                        .includes(search)
                        ||
                        String(
                            siswa.username || ""
                        )
                        .toLowerCase()
                        .includes(search);


                    const cocokKategori =
                        !kategori ||
                        siswa.kategori ===
                        kategori;


                    const cocokIndustri =
                        !industri ||
                        siswa.industri ===
                        industri;


                    const cocokLokasi =
                        lokasi === "ALL" ||
                        siswa.lokasiId ===
                        lokasi;


                    return (
                        cocokSearch &&
                        cocokKategori &&
                        cocokIndustri &&
                        cocokLokasi
                    );
                }
            );


        this.renderTable(
            this.filteredData
        );
    },


    // =====================================================
    // KOMPATIBILITAS FUNGSI LAMA
    // =====================================================

    filter() {

        this.applyFilters();
    },


    // =====================================================
    // TABLE
    // =====================================================

    renderTable(data) {

        const tbody =
            document.getElementById(
                "kepsek-table-body"
            );


        if (!tbody) {
            return;
        }


        if (
            typeof $ !== "undefined" &&
            $.fn.DataTable &&
            $.fn.DataTable.isDataTable(
                "#kepsek-table"
            )
        ) {

            $("#kepsek-table")
                .DataTable()
                .clear()
                .destroy();
        }


        if (!data.length) {

            tbody.innerHTML = `
                <tr>

                    <td
                        colspan="6"
                        class="p-4 text-center text-slate-500">

                        Tidak ada data siswa.

                    </td>

                </tr>
            `;

            return;
        }


        tbody.innerHTML =
            data
                .map(
                    siswa => {

                        let statusClass =
                            "bg-slate-100 text-slate-600";


                        const status =
                            String(
                                siswa.status ||
                                ""
                            )
                            .trim()
                            .toLowerCase();


                        if (
                            status ===
                            "hadir"
                        ) {

                            statusClass =
                                "bg-green-100 text-green-700";

                        }
                        else if (
                            status ===
                            "belum hadir"
                        ) {

                            statusClass =
                                "bg-red-100 text-red-700";

                        }
                        else if (
                            status ===
                            "pending"
                        ) {

                            statusClass =
                                "bg-orange-100 text-orange-700";

                        }
                        else if (
                            status ===
                            "ditolak"
                        ) {

                            statusClass =
                                "bg-red-100 text-red-700";

                        }
                        else {

                            statusClass =
                                "bg-indigo-100 text-indigo-700";
                        }


                        return `

                            <tr>

                                <td class="font-medium">
                                    ${this.escapeHtml(
                                        siswa.nama
                                    )}
                                </td>

                                <td>
                                    ${this.escapeHtml(
                                        siswa.kategori
                                    )}
                                </td>

                                <td>
                                    ${this.escapeHtml(
                                        siswa.industri
                                    )}
                                </td>

                                <td>

                                    ${
                                        siswa.jamMasuk !== "-"
                                        ? `
                                            <span class="font-medium text-green-700">
                                                ${this.escapeHtml(
                                                    siswa.jamMasuk
                                                )}
                                            </span>
                                        `
                                        : "-"
                                    }

                                </td>

                                <td>

                                    <span
                                        class="px-2 py-1 rounded-full text-xs font-semibold ${statusClass}">

                                        ${this.escapeHtml(
                                            siswa.status
                                        )}

                                    </span>

                                    ${
                                        siswa.keterangan
                                        ? `
                                            <div class="text-xs text-slate-500 mt-1">
                                                ${this.escapeHtml(
                                                    siswa.keterangan
                                                )}
                                            </div>
                                        `
                                        : ""
                                    }

                                </td>

                                <td>

                                    ${
                                        siswa.mapsUrl
                                        ? `
                                            <a
                                                href="${this.escapeAttribute(
                                                    siswa.mapsUrl
                                                )}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="text-indigo-600 hover:underline">

                                                <i class="fa-solid fa-location-dot"></i>
                                                Lihat

                                            </a>
                                        `
                                        : "-"
                                    }

                                </td>

                            </tr>

                        `;
                    }
                )
                .join("");


        if (
            typeof $ !== "undefined" &&
            $.fn.DataTable
        ) {

            $("#kepsek-table")
                .DataTable({

                    pageLength: 10,

                    lengthMenu: [
                        10,
                        25,
                        50,
                        100
                    ],

                    ordering: true,

                    searching: false,

                    scrollX: true,

                    autoWidth: false,

                    destroy: true,

                    language: {

                        info:
                            "Menampilkan _START_ sampai _END_ dari _TOTAL_ siswa",

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
    },


    // =====================================================
    // MAP
    // =====================================================

    renderMap(data) {

        const mapEl =
            document.getElementById(
                "kepsek-map"
            );


        if (!mapEl) {
            return;
        }


        // =============================================
        // HAPUS MAP LAMA
        // =============================================

        if (
            window.kepsekMap
        ) {

            try {
                window.kepsekMap.remove();
            }
            catch (error) {

                console.warn(
                    "Gagal menghapus map lama",
                    error
                );
            }

            window.kepsekMap =
                null;
        }


        // =============================================
        // LEAFLET
        // =============================================

        if (
            typeof L ===
            "undefined"
        ) {

            mapEl.innerHTML = `
                <div class="h-full flex items-center justify-center text-slate-500">
                    Library peta belum tersedia.
                </div>
            `;

            return;
        }


        // =============================================
        // KOORDINAT
        // =============================================

        const titik =
            data.filter(
                siswa =>
                    siswa.latitude !== null &&
                    siswa.longitude !== null &&
                    !Number.isNaN(
                        Number(
                            siswa.latitude
                        )
                    ) &&
                    !Number.isNaN(
                        Number(
                            siswa.longitude
                        )
                    )
            );


        let center =
            [
                -8.65,
                115.2167
            ];


        if (titik.length) {

            center = [
                Number(
                    titik[0].latitude
                ),
                Number(
                    titik[0].longitude
                )
            ];
        }


        // =============================================
        // CREATE MAP
        // =============================================

        window.kepsekMap =
            L.map(
                mapEl
            ).setView(
                center,
                12
            );


        // =============================================
        // TILE
        // =============================================

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        )
        .addTo(
            window.kepsekMap
        );


        // =============================================
        // MARKER
        // =============================================

        titik.forEach(
            siswa => {

                const marker =
                    L.marker([
                        Number(
                            siswa.latitude
                        ),
                        Number(
                            siswa.longitude
                        )
                    ])
                    .addTo(
                        window.kepsekMap
                    );


                marker.bindPopup(`

                    <div class="text-sm">

                        <div class="font-bold mb-1">
                            ${this.escapeHtml(
                                siswa.nama
                            )}
                        </div>

                        <div>
                            ${this.escapeHtml(
                                siswa.kategori
                            )}
                        </div>

                        <div class="mt-1">
                            ${this.escapeHtml(
                                siswa.industri
                            )}
                        </div>

                        <div class="mt-1">
                            Status:
                            <b>
                                ${this.escapeHtml(
                                    siswa.status
                                )}
                            </b>
                        </div>

                        ${
                            siswa.jamMasuk !== "-"
                            ? `
                                <div class="mt-1">
                                    Masuk:
                                    ${this.escapeHtml(
                                        siswa.jamMasuk
                                    )}
                                </div>
                            `
                            : ""
                        }

                        ${
                            siswa.jamPulang !== "-"
                            ? `
                                <div class="mt-1">
                                    Pulang:
                                    ${this.escapeHtml(
                                        siswa.jamPulang
                                    )}
                                </div>
                            `
                            : ""
                        }

                    </div>

                `);
            }
        );


        // =============================================
        // FIT BOUNDS
        // =============================================

        if (
            titik.length > 1
        ) {

            const bounds =
                L.latLngBounds(
                    titik.map(
                        siswa => [
                            Number(
                                siswa.latitude
                            ),
                            Number(
                                siswa.longitude
                            )
                        ]
                    )
                );


            window.kepsekMap.fitBounds(
                bounds,
                {
                    padding: [
                        30,
                        30
                    ]
                }
            );
        }


        setTimeout(
            () => {

                window.kepsekMap
                    ?.invalidateSize();

            },
            300
        );
    },


    // =====================================================
    // SET TEXT
    // =====================================================

    setText(
        id,
        value
    ) {

        const el =
            document.getElementById(
                id
            );


        if (el) {
            el.textContent =
                value;
        }
    },


    // =====================================================
    // ESCAPE HTML
    // =====================================================

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


    // =====================================================
    // ESCAPE ATTRIBUTE
    // =====================================================

    escapeAttribute(value) {

        return this.escapeHtml(
            value
        );
    }
};


// =========================================================
// WRAPPER LAMA
// =========================================================

async function loadKepsekDashboard(
    useLoader = true
) {

    return KepsekDashboardService.load(
        useLoader
    );
}


// =========================================================
// FILTER WRAPPER
// =========================================================

function renderKepsekFilter(lokasiList = [], selected = "ALL") {

    const select =
        document.getElementById("kepsek-filter-lokasi");

    if (!select) {
        console.error(
            "Element #kepsek-filter-lokasi tidak ditemukan"
        );
        return;
    }

    console.log(
        "RENDER LOKASI:",
        lokasiList
    );

    // Hancurkan TomSelect lama
    if (kepsekLokasiSelect) {
        kepsekLokasiSelect.destroy();
        kepsekLokasiSelect = null;
    }

    // Kosongkan select
    select.innerHTML = "";

    // Semua lokasi
    const optionAll =
        document.createElement("option");

    optionAll.value = "ALL";
    optionAll.textContent = "Semua Lokasi";

    select.appendChild(optionAll);

    // Tambahkan lokasi
    lokasiList.forEach(lokasi => {

        const option =
            document.createElement("option");

        option.value =
            lokasi.lokasi_id;

        option.textContent =
            lokasi.nama_industri || "-";

        select.appendChild(option);

    });

    // Set value sebelum TomSelect
    select.value =
        selected || "ALL";

    console.log(
        "OPTION LOKASI:",
        select.options.length
    );

    // =========================
    // TOM SELECT
    // =========================

    if (typeof TomSelect !== "undefined") {

        kepsekLokasiSelect =
            new TomSelect(
                "#kepsek-filter-lokasi",
                {
                    create: false,
                    allowEmptyOption: true,
                    placeholder:
                        "Ketik nama lokasi PKL...",
                    searchField: [
                        "text"
                    ],
                    sortField: {
                        field: "text",
                        direction: "asc"
                    }
                }
            );

        kepsekLokasiSelect.setValue(
            selected || "ALL"
        );

    } else {

        console.warn(
            "TomSelect belum tersedia"
        );
    }
}

async function loadKepsekLokasi() {

    try {

        const {
            data,
            error
        } = await window.supabaseClient
            .from("lokasi")
            .select(`
                lokasi_id,
                nama_industri,
                latitude,
                longitude,
                radius,
                alamat,
                status
            `)
            .order(
                "nama_industri",
                {
                    ascending: true
                }
            );

        if (error) {
            throw error;
        }

        console.log(
            "DATA LOKASI KEPSEK:",
            data
        );

        renderKepsekFilter(
            data || [],
            "ALL"
        );

        return data || [];

    } catch (error) {

        console.error(
            "loadKepsekLokasi:",
            error
        );

        showToast(
            "Gagal memuat lokasi PKL",
            true
        );

        return [];
    }
}

function filterKepsekSiswa() {
    KepsekDashboardService.applyFilters();
}

function populateKepsekFilters() {
    KepsekDashboardService.renderFilter(
        KepsekDashboardService.data
    );
}

//MASTER DATA SISWA
async function loadMasterSiswa() {

    try {

        showLoader("Memuat data siswa...");

        const { data: siswaData, error: siswaError } =
            await window.supabaseClient
                .from("users")
                .select(`
                    username,
                    nama_lengkap,
                    kategori,
                    lokasi_id,
                    p_id
                `)
                .eq("role", "siswa");

        if (siswaError) {
            throw siswaError;
        }

        const { data: lokasiData, error: lokasiError } =
            await window.supabaseClient
                .from("lokasi")
                .select(`
                    lokasi_id,
                    nama_industri
                `);

        if (lokasiError) {
            throw lokasiError;
        }

        const { data: guruData, error: guruError } =
            await window.supabaseClient
                .from("guru")
                .select(`
                    p_id,
                    nama_lengkap
                `);

        if (guruError) {
            throw guruError;
        }

        const lokasiMap = {};
        lokasiData.forEach(item => {
            lokasiMap[item.lokasi_id] = item;
        });

        const guruMap = {};
        guruData.forEach(item => {
            guruMap[item.p_id] = item;
        });

        AppState.masterSiswa =
            (siswaData || []).map(s => ({

                username: s.username,

                nama: s.nama_lengkap,

                kategori: s.kategori,

                lokasiId: s.lokasi_id,

                pId: s.p_id,

                namaIndustri:
                    lokasiMap[s.lokasi_id]
                        ?.nama_industri || "-",

                namaPembimbing:
                    guruMap[s.p_id]
                        ?.nama_lengkap || "-"

            }));

        populateMasterFilters();

        renderMasterSiswaTable(
            AppState.masterSiswa
        );

    }
    catch (error) {

        console.error(error);

        showToast(
            "Gagal memuat data siswa",
            true
        );

    }
    finally {

        hideLoader();

    }

}

async function openEditSiswa(username) {

    try {

        showLoader("Memuat data siswa...");

        const { data: siswa, error } =
            await window.supabaseClient
                .from("users")
                .select(`
                    username,
                    nama_lengkap,
                    kategori,
                    lokasi_id,
                    p_id
                `)
                .eq("username", username)
                .single();

        if (error) {
            throw error;
        }

        const { data: guruList } =
            await window.supabaseClient
                .from("guru")
                .select(`
                    p_id,
                    nama_lengkap
                `)
                .order("nama_lengkap");

        const { data: lokasiList } =
            await window.supabaseClient
                .from("lokasi")
                .select(`
                    lokasi_id,
                    nama_industri
                `)
                .order("nama_industri");

        document.getElementById(
            "edit-username"
        ).value =
            siswa.username;

        document.getElementById(
            "edit-username-view"
        ).value =
            siswa.username;

        document.getElementById(
            "edit-nama"
        ).value =
            siswa.nama_lengkap || "";

        document.getElementById(
            "edit-kategori"
        ).value =
            siswa.kategori || "";

        populateGuruDropdown(
            guruList,
            siswa.p_id
        );

        populateLokasiDropdown(
            lokasiList,
            siswa.lokasi_id
        );

        document
            .getElementById(
                "modal-edit-siswa"
            )
            .classList
            .remove("hidden");

    }
    catch (error) {

        console.error(error);

        showToast(
            "Gagal memuat data siswa",
            true
        );

    }
    finally {

        hideLoader();

    }

}

function populateGuruDropdown(
    list,
    selectedId
) {

    const el =
        document.getElementById(
            "edit-parentid"
        );

    if (!el) return;

    el.innerHTML = "";

    list.forEach(item => {

        el.innerHTML += `
            <option
                value="${item.p_id}"
                ${item.p_id === selectedId ? "selected" : ""}>
                ${item.nama_lengkap}
            </option>
        `;

    });

}

function populateLokasiDropdown(
    list,
    selectedId
) {

    const el =
        document.getElementById(
            "edit-lokasiid"
        );

    if (!el) return;

    el.innerHTML = "";

    list.forEach(item => {

        el.innerHTML += `
            <option
                value="${item.lokasi_id}"
                ${item.lokasi_id === selectedId ? "selected" : ""}>
                ${item.nama_industri}
            </option>
        `;

    });

}

async function saveEditSiswa() {

    try {

        showLoader("Menyimpan data...");

        const username =
            document.getElementById(
                "edit-username"
            ).value;

        const nama =
            document.getElementById(
                "edit-nama"
            ).value;

        const { error } =
            await window.supabaseClient
                .from("users")
                .update({

                    nama_lengkap:
                        nama,

                    kategori:
                        document.getElementById(
                            "edit-kategori"
                        ).value,

                    p_id:
                        document.getElementById(
                            "edit-parentid"
                        ).value,

                    lokasi_id:
                        document.getElementById(
                            "edit-lokasiid"
                        ).value

                })
                .eq(
                    "username",
                    username
                );

        if (error) {
            throw error;
        }

        hideLoader();

        closeEditSiswa();

        await Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: `Data siswa ${nama} berhasil diperbarui`,
            confirmButtonText: "OK",
            timer: 2000,
            timerProgressBar: true
        });

        await loadMasterSiswa();

    }
    catch (error) {

        console.error(error);

        hideLoader();

        await Swal.fire({
            icon: "error",
            title: "Gagal",
            text: "Data siswa gagal diperbarui",
            confirmButtonText: "OK"
        });

    }

}

function closeEditSiswa() {
    document
        .getElementById("modal-edit-siswa")
        .classList
        .add("hidden");
}

//MASTER LOKASI
async function loadMasterLokasi() {
    try {
        showLoader(
            "Memuat lokasi..."
        );
        const {
            data,
            error
        } = await window.supabaseClient
            .from("lokasi")
            .select("*")
            .order(
                "nama_industri"
            );
        if (error) {
            throw error;
        }
        AppState.masterLokasi =
            data || [];
        populateLokasiFilter();
        renderMasterLokasiTable(
            AppState.masterLokasi
        );
    }
    catch(error){
        console.error(error);
        showToast(
            "Gagal memuat lokasi",
            true
        );
    }
    finally {
        hideLoader();
    }
}

function populateLokasiFilter() {   
    const statusEl =
        document.getElementById(
            "lokasi-filter-status"
        );
    if (!statusEl) return;
    const list =
        [...new Set(
            AppState.masterLokasi
                .map(i => i.status)
        )];
    statusEl.innerHTML =
        `<option value="">Semua Status</option>`;
    list.forEach(item => {
        statusEl.innerHTML += `
            <option value="${item}">
                ${item}
            </option>
        `;
    });
}

function filterMasterLokasi() {
    const search =
        document.getElementById(
            "lokasi-search"
        )
        ?.value
        .toLowerCase()
        .trim();
    const status =
        document.getElementById(
            "lokasi-filter-status"
        )
        ?.value;
    const result =
        AppState.masterLokasi.filter(item => {
            const cocokNama =
                !search ||
                item.nama_industri
                    ?.toLowerCase()
                    .includes(search);
            const cocokStatus =
                !status ||
                item.status === status;
            return (
                cocokNama &&
                cocokStatus
            );
        });
    renderMasterLokasiTable(
        result
    );
}

function renderMasterLokasiTable(data = []) {
    const tbody =
        document.querySelector(
            "#table-master-lokasi tbody"
        );
    if (!tbody) return;
    if (
        $.fn.DataTable.isDataTable(
            "#table-master-lokasi"
        )
    ) {
        $("#table-master-lokasi")
            .DataTable()
            .destroy();
    }
    tbody.innerHTML = "";
    data.forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td>
                    ${item.lokasi_id}
                </td>
                <td>
                    ${item.nama_industri}
                </td>
                <td>
                    ${item.radius}
                </td>
                <td>
                    ${item.status}
                </td>
                <td>
                    <button
                        onclick="openEditLokasi('${item.lokasi_id}')"
                        class="btn btn-warning btn-sm">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    $("#table-master-lokasi")
        .DataTable({
            pageLength: 10,
            responsive: true,
            destroy: true
        });
}

async function openEditLokasi(id) {
    const lokasi =
        AppState.masterLokasi.find(
            x => x.lokasi_id === id
        );
    if (!lokasi) return;
    document.getElementById(
        "edit-lokasi-id"
    ).value =
        lokasi.lokasi_id;
    document.getElementById(
        "edit-nama-industri"
    ).value =
        lokasi.nama_industri || "";
    document.getElementById(
        "edit-alamat"
    ).value =
        lokasi.alamat || "";
    document.getElementById(
        "edit-latitude"
    ).value =
        lokasi.latitude || "";
    document.getElementById(
        "edit-longitude"
    ).value =
        lokasi.longitude || "";
    document.getElementById(
        "edit-radius"
    ).value =
        lokasi.radius || "";
    document.getElementById(
        "edit-status"
    ).value =
        lokasi.status || "Aktif";
    document
        .getElementById(
            "modal-edit-lokasi"
        )
        .classList
        .remove("hidden");
}

async function openEditLokasi(id) {
    const lokasi =
        AppState.masterLokasi.find(
            x => x.lokasi_id === id
        );
    if (!lokasi) return;
    document.getElementById(
        "edit-lokasi-id"
    ).value =
        lokasi.lokasi_id;
    document.getElementById(
        "edit-nama-industri"
    ).value =
        lokasi.nama_industri || "";
    document.getElementById(
        "edit-alamat"
    ).value =
        lokasi.alamat || "";
    document.getElementById(
        "edit-latitude"
    ).value =
        lokasi.latitude || "";
    document.getElementById(
        "edit-longitude"
    ).value =
        lokasi.longitude || "";
    document.getElementById(
        "edit-radius"
    ).value =
        lokasi.radius || "";
    document.getElementById(
        "edit-status"
    ).value =
        lokasi.status || "Aktif";
    document
        .getElementById(
            "modal-edit-lokasi"
        )
        .classList
        .remove("hidden");
}

async function saveEditLokasi() {

    try {

        showLoader("Menyimpan data...");

        await window.supabaseClient
            .from("lokasi")
            .update({
                nama_industri:
                    document.getElementById("edit-nama-industri").value,
                latitude:
                    parseFloat(
                        document.getElementById("edit-latitude").value
                    ),
                longitude:
                    parseFloat(
                        document.getElementById("edit-longitude").value
                    ),
                radius:
                    parseInt(
                        document.getElementById("edit-radius").value
                    ),
                alamat:
                    document.getElementById("edit-alamat").value,
                status:
                    document.getElementById("edit-status").value === "true"
            })
            .eq(
                "lokasi_id",
                document.getElementById("edit-lokasi-id").value
            );

        // tutup loader dulu
        hideLoader();

        await Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Data lokasi berhasil diperbarui",
            confirmButtonText: "OK",
            timer: 2000,
            timerProgressBar: true
        });

        closeEditLokasi();

        await loadMasterLokasi();

    }
    catch (error) {

        hideLoader();

        console.error(error);

        Swal.fire({
            icon: "error",
            title: "Gagal",
            text: error.message || "Terjadi kesalahan",
            confirmButtonText: "Tutup"
        });
    }
}

function closeEditLokasi() {
    document
        .getElementById(
            "modal-edit-lokasi"
        )
        .classList
        .add("hidden");
}