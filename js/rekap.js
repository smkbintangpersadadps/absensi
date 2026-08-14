async function getRekapBulanan({
    mode,
    user,
    bulan,
    tahun,
    filterKategori = "ALL"
}) {

    try {

        let siswa = [];

        // =====================================
        // AMBIL SISWA
        // =====================================

        if (mode === "wali") {

            const {
                data,
                error
            } = await window.supabaseClient
                .from("users")
                .select(`
                    username,
                    nama_lengkap,
                    kategori
                `)
                .eq("role", "siswa")
                .eq(
                    "kategori",
                    user.kategori
                );

            if (error) throw error;

            siswa = data || [];
        }

        else if (mode === "pembimbing") {

            const {
                data,
                error
            } = await window.supabaseClient
                .from("users")
                .select(`
                    username,
                    nama_lengkap,
                    kategori
                `)
                .eq("role", "siswa")
                .eq(
                    "p_id",
                    user.pId
                );

            if (error) throw error;

            siswa = data || [];
        }

        else {

            // ============================
            // Ambil semua kategori dulu
            // ============================

            const {
                data: allKategoriData,
                error: kategoriError
            } = await window.supabaseClient
                .from("users")
                .select("kategori")
                .eq("role", "siswa");

            if (kategoriError) {
                throw kategoriError;
            }

            const kategoriList = [
                ...new Set(
                    (allKategoriData || [])
                        .map(s => s.kategori)
                        .filter(Boolean)
                )
            ].sort();

            // simpan global
            AppState.kategoriRekapBulanan =
                kategoriList;

            // ============================
            // Ambil data siswa sesuai filter
            // ============================

            let query =
                window.supabaseClient
                    .from("users")
                    .select(`
                        username,
                        nama_lengkap,
                        kategori
                    `)
                    .eq("role", "siswa");

            if (
                filterKategori &&
                filterKategori !== "ALL"
            ) {

                query =
                    query.eq(
                        "kategori",
                        filterKategori
                    );
            }

            const {
                data,
                error
            } = await query;

            if (error) throw error;

            siswa = data || [];
        }

        // =====================================
        // TANGGAL
        // =====================================

        const jumlahHari =
            new Date(
                tahun,
                bulan,
                0
            ).getDate();

        const startDate =
            `${tahun}-${String(bulan).padStart(2, "0")}-01`;

        const endDate =
            `${tahun}-${String(bulan).padStart(2, "0")}-${String(jumlahHari).padStart(2, "0")}`;

        const usernames =
            siswa.map(
                s => s.username
            );

        if (!usernames.length) {

            return {
                rekap: [],
                jumlahHari
            };
        }

        // =====================================
        // ABSENSI
        // =====================================

        const {
            data: absensiData,
            error: absensiError
        } = await window.supabaseClient
            .from("absensi")
            .select(`
                username,
                waktu,
                tipe
            `)
            .in(
                "username",
                usernames
            )
            .gte(
                "waktu",
                `${startDate}T00:00:00`
            )
            .lte(
                "waktu",
                `${endDate}T23:59:59`
            );

        if (absensiError) {
            throw absensiError;
        }

        // =====================================
        // STATUS HARIAN
        // =====================================

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
            .gte(
                "tanggal",
                startDate
            )
            .lte(
                "tanggal",
                endDate
            );

        if (statusError) {
            throw statusError;
        }

        // =====================================
        // MAP ABSENSI
        // =====================================

        const absensiMap = {};

        (absensiData || []).forEach(a => {

            const tanggal =
                String(a.waktu)
                .substring(0, 10);

            const key =
                `${a.username}_${tanggal}`;

            if (
                a.tipe === "Masuk"
            ) {

                absensiMap[key] = true;
            }
        });

        // =====================================
        // MAP STATUS
        // =====================================

        const statusMap = {};

        (statusData || []).forEach(s => {

            const key =
                `${s.username}_${s.tanggal}`;

            statusMap[key] = s;

        });

        // =====================================
        // GENERATE REKAP
        // =====================================

        const rekap =
            siswa.map(siswaItem => {

                const harian = [];

                let totalHadir = 0;
                let totalDayOff = 0;
                let totalIzin = 0;
                let totalSakit = 0;
                let totalPending = 0;
                let totalBelum = 0;

                for (
                    let hari = 1;
                    hari <= jumlahHari;
                    hari++
                ) {

                    const tanggal =
                        `${tahun}-${String(bulan).padStart(2, "0")}-${String(hari).padStart(2, "0")}`;

                    const key =
                        `${siswaItem.username}_${tanggal}`;

                    let kode = "-";
                    let label = "Belum";

                    // =====================
                    // HADIR
                    // =====================

                    if (
                        absensiMap[key]
                    ) {

                        kode = "MP";
                        label = "Masuk & Pulang";

                        totalHadir++;
                    }

                    // =====================
                    // STATUS
                    // =====================

                    else if (
                        statusMap[key]
                    ) {

                        const status =
                            statusMap[key];

                        const approval =
                            String(
                                status.approval || ""
                            )
                            .trim()
                            .toLowerCase();

                        if (
                            approval === "pending"
                        ) {

                            kode = "PD";
                            label = "Pending";

                            totalPending++;
                        }

                        else if (
                            approval === "approved"
                        ) {

                            switch (
                                String(status.status || "")
                            ) {

                                case "Izin":

                                    kode = "I";
                                    label = "Izin";

                                    totalIzin++;

                                    break;

                                case "Sakit":

                                    kode = "S";
                                    label = "Sakit";

                                    totalSakit++;

                                    break;

                                case "Day Off":

                                    kode = "D";
                                    label = "Day Off";

                                    totalDayOff++;

                                    break;

                                default:

                                    totalBelum++;

                                    break;
                            }
                        }

                        else {

                            totalBelum++;
                        }
                    }

                    // =====================
                    // BELUM
                    // =====================

                    else {

                        totalBelum++;
                    }

                    harian.push({
                        kode,
                        label
                    });
                }

                return {

                    nama:
                        siswaItem.nama_lengkap,

                    kategori:
                        siswaItem.kategori,

                    harian,

                    totalHadir,
                    totalDayOff,
                    totalIzin,
                    totalSakit,
                    totalPending,
                    totalBelum
                };

            });

        // =====================================
        // KATEGORI FILTER KEPSEK
        // =====================================

        const kategoriList =
            AppState.kategoriRekapBulanan || [];

        return {

            rekap,
            jumlahHari,
            kategoriList

        };

    }
    catch (error) {

        console.error(
            "getRekapBulanan:",
            error
        );

        throw error;
    }
}

function getRekapBadgeClass(kode) {
    switch (String(kode || "").trim().toUpperCase()) {
        case "MP":
            return "rekap-mp";

        case "M":
            return "rekap-m";

        case "P":
            return "rekap-p";

        case "D":
            return "rekap-dayoff";

        case "I":
            return "rekap-izin";

        case "S":
            return "rekap-sakit";

        case "L":
            return "rekap-libur";

        case "LA":
            return "rekap-lupa";
        
        case "W":
            return "rekap-wfh";
        
        case "ML":
            return "rekap-ml";

        case "PD":
            return "rekap-pending";

        default:
            return "rekap-kosong";
    }
}

function renderRekapKategoriFilter(kategoriList, selected = "ALL") {
    const select = document.getElementById("rekap-kategori");
    if (!select) return;

    select.innerHTML = `
        <option value="ALL">Semua Kelas</option>
        ${kategoriList.map(k => `
            <option value="${k}" ${selected === k ? "selected" : ""}>
                ${k}
            </option>
        `).join("")}
    `;
}

const RekapBulananService = {

    async init(useLoader = true) {

        const now = new Date();
        const user = AppState.currentUser;

        if (!user) return;

        const role =
            String(user.role || "")
            .trim()
            .toLowerCase();

        const bulanEl =
            document.getElementById("rekap-bulan");

        const tahunEl =
            document.getElementById("rekap-tahun");

        const modeEl =
            document.getElementById("rekap-mode");

        const kategoriWrapper =
            document.getElementById("rekap-kategori-wrapper");

        if (bulanEl) {
            bulanEl.value =
                now.getMonth() + 1;
        }

        if (tahunEl && !tahunEl.value) {
            tahunEl.value =
                now.getFullYear();
        }

        if (role === "kepsek") {

            if (modeEl) {
                modeEl.value = "kepsek";
                modeEl.closest("div")
                    ?.classList
                    .add("hidden");
            }

            kategoriWrapper
                ?.classList
                .remove("hidden");

        } else {

            if (modeEl) {

                modeEl.closest("div")
                    ?.classList
                    .remove("hidden");

                modeEl.value =
                    AppState.monitoringMode ||
                    "wali";
            }

            kategoriWrapper
                ?.classList
                .add("hidden");
        }

        await this.load(useLoader);
    },

    async load(useLoader = false) {

    try {

        const user =
            AppState.currentUser;

        if (!user) return;

        if (useLoader) {
            showLoader(
                "Memuat rekap bulanan..."
            );
        }

        const data =
            await this.getData();

        // simpan hasil terakhir
        AppState.lastRekapBulanan =
            data;

        const role =
            String(user.role || "")
            .trim()
            .toLowerCase();

        const filterKategori =
            document.getElementById(
                "rekap-kategori"
            )?.value || "ALL";

        if (
            role === "kepsek" &&
            typeof renderRekapKategoriFilter === "function"
        ) {

            renderRekapKategoriFilter(
                data.kategoriList || [],
                filterKategori
            );
        }

        this.render(data);

    }
        catch (error) {

            console.error(
                "RekapBulananService:",
                error
            );

            showToast(
                "Gagal memuat rekap bulanan",
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

        const role =
            String(user.role || "")
            .trim()
            .toLowerCase();

        const now = new Date();

        const bulan =
            Number(
                document.getElementById("rekap-bulan")?.value
            ) || (now.getMonth() + 1);

        const tahun =
            Number(
                document.getElementById("rekap-tahun")?.value
            ) || now.getFullYear();

        const mode =
            role === "kepsek"
                ? "kepsek"
                : document.getElementById(
                    "rekap-mode"
                )?.value || "wali";

        const filterKategori =
            document.getElementById(
                "rekap-kategori"
            )?.value || "ALL";

        return await getRekapBulanan({
            bulan,
            tahun,
            mode,
            filterKategori,
            user
        });
    },

    render(data) {

        const rekap =
            data.rekap || [];

        const jumlahHari =
            data.jumlahHari || 31;

        const head =
            document.getElementById(
                "rekap-head"
            );

        const body =
            document.getElementById(
                "rekap-body"
            );

        const empty =
            document.getElementById(
                "rekap-empty"
            );

        const wrapper =
            document.getElementById(
                "rekap-table-wrapper"
            );

        if (!head || !body) return;

        if (
            $.fn.DataTable.isDataTable(
                "#rekap-table"
            )
        ) {
            $("#rekap-table")
                .DataTable()
                .clear()
                .destroy();
        }

        if (empty) {

            empty.classList.add(
                "hidden"
            );

            empty.innerHTML = "";
        }

        if (wrapper) {

            wrapper.classList.remove(
                "hidden"
            );
        }

        if (!rekap.length) {

            if (wrapper) {
                wrapper.classList.add(
                    "hidden"
                );
            }

            if (empty) {

                empty.classList.remove(
                    "hidden"
                );

                empty.innerHTML = `
                    Tidak ada data siswa untuk mode ini.
                `;
            }

            return;
        }

        let tanggalHeader = "";

        for (
            let i = 1;
            i <= jumlahHari;
            i++
        ) {

            tanggalHeader += `
                <th class="rekap-day-col">
                    <div class="rekap-day-title">
                        ${i}
                    </div>
                </th>
            `;
        }

        head.innerHTML = `
            <tr>
                <th style="min-width:220px">
                    Nama
                </th>

                <th style="min-width:140px">
                    Kelas
                </th>

                ${tanggalHeader}

                <th>Hadir</th>
                <th>Day Off</th>
                <th>Izin</th>
                <th>Sakit</th>
                <th>Pending</th>
                <th>Belum</th>
            </tr>
        `;

        body.innerHTML =
            rekap.map(r => {

                const hariCells =
                    (r.harian || [])
                    .map(h => `
                        <td class="text-center">
                            <span
                                class="rekap-badge ${getRekapBadgeClass(h.kode)}"
                                title="${h.label}">
                                ${h.kode}
                            </span>
                        </td>
                    `)
                    .join("");

                return `
                    <tr>

                        <td class="font-medium whitespace-nowrap">
                            ${r.nama || "-"}
                        </td>

                        <td class="whitespace-nowrap">
                            ${r.kategori || "-"}
                        </td>

                        ${hariCells}

                        <td class="text-center font-bold text-green-700">
                            ${r.totalHadir || 0}
                        </td>

                        <td class="text-center font-bold text-amber-700">
                            ${r.totalDayOff || 0}
                        </td>

                        <td class="text-center font-bold text-indigo-700">
                            ${r.totalIzin || 0}
                        </td>

                        <td class="text-center font-bold text-red-700">
                            ${r.totalSakit || 0}
                        </td>

                        <td class="text-center font-bold text-orange-700">
                            ${r.totalPending || 0}
                        </td>

                        <td class="text-center font-bold text-slate-500">
                            ${r.totalBelum || 0}
                        </td>

                    </tr>
                `;

            }).join("");

        $("#rekap-table").DataTable({

            pageLength: 10,

            lengthMenu: [
                10,
                25,
                50,
                100
            ],

            ordering: true,
            searching: true,
            scrollX: true,
            autoWidth: true,
            destroy: true,

            columnDefs: [
                {
                    targets: [0, 1],
                    orderable: true
                },
                {
                    targets: "_all",
                    orderable: false
                }
            ],

            language: {

                search: "Cari:",

                lengthMenu:
                    "Tampilkan _MENU_ data",

                info:
                    "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",

                zeroRecords:
                    "Data tidak ditemukan",

                infoEmpty:
                    "Tidak ada data",

                paginate: {
                    next: "›",
                    previous: "‹"
                }
            }
        });
    }
};

async function generateRekapPDF() {

    const data =
        AppState.lastRekapBulanan;

    if (!data) {

        showToast(
            "Data rekap belum tersedia",
            true
        );

        return;
    }

    const { jsPDF } =
        window.jspdf;

    const doc =
        new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a3"
        });

    const pageWidth =
        doc.internal.pageSize.getWidth();

    const rekap =
        data.rekap || [];

    const jumlahHari =
        data.jumlahHari || 31;

    const bulanAngka =
        document.getElementById("rekap-bulan")?.value;

    const tahun =
        document.getElementById("rekap-tahun")?.value || "";

    const mode =
        document.getElementById("rekap-mode")?.value || "wali";

    const namaBulan =
        getNamaBulan(bulanAngka);

    const namaPenanggungJawab =
        AppState.currentUser?.nama ||
        AppState.currentUser?.namaLengkap ||
        "-";

    const logo =
        document.getElementById(
            "logo-sekolah"
        );

    // =====================================
    // HEADER
    // =====================================

    try {

        if (
            logo &&
            logo.complete
        ) {

            const canvas =
                document.createElement(
                    "canvas"
                );

            canvas.width =
                logo.naturalWidth;

            canvas.height =
                logo.naturalHeight;

            const ctx =
                canvas.getContext(
                    "2d"
                );

            ctx.drawImage(
                logo,
                0,
                0
            );

            const logoBase64 =
                canvas.toDataURL(
                    "image/png"
                );

            doc.addImage(
                logoBase64,
                "PNG",
                pageWidth / 2 - 12,
                8,
                24,
                24
            );
        }

    }
    catch (err) {

        console.log(
            "Logo gagal dimuat"
        );
    }

    doc.setFontSize(16);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "SMK BINTANG PERSADA DENPASAR",
        pageWidth / 2,
        40,
        {
            align: "center"
        }
    );

    doc.setFontSize(13);

    doc.text(
        `Rekap Absensi Bulanan Periode ${namaBulan} ${tahun}`,
        pageWidth / 2,
        47,
        {
            align: "center"
        }
    );

    // =====================================
    // HEADER TABLE
    // =====================================

    const head = [[

        "No",

        "Nama",

        "Kelas",

        ...Array.from(
            {
                length:
                    jumlahHari
            },
            (_, i) =>
                String(i + 1)
        ),

        "H",
        "D",
        "I",
        "S",
        "PD",
        "B"

    ]];

    // =====================================
    // BODY TABLE
    // =====================================

    const body =
        rekap.map(
            (
                r,
                index
            ) => [

                index + 1,

                r.nama || "",

                r.kategori || "",

                ...(r.harian || [])
                .map(
                    h => h.kode
                ),

                r.totalHadir || 0,

                r.totalDayOff || 0,

                r.totalIzin || 0,

                r.totalSakit || 0,

                r.totalPending || 0,

                r.totalBelum || 0

            ]
        );

    // =====================================
    // COLUMN STYLE
    // =====================================

    const columnStyles = {

        0: {
            cellWidth: 8,
            halign: "center"
        },

        1: {
            cellWidth: 45,
            halign: "left"
        },

        2: {
            cellWidth: 25
        }

    };

    for (
        let i = 3;
        i < (3 + jumlahHari);
        i++
    ) {

        columnStyles[i] = {
            cellWidth: 8,
            halign: "center"
        };
    }

    const startRekap =
        3 + jumlahHari;

    columnStyles[startRekap] = {
        cellWidth: 10
    };

    columnStyles[startRekap + 1] = {
        cellWidth: 10
    };

    columnStyles[startRekap + 2] = {
        cellWidth: 10
    };

    columnStyles[startRekap + 3] = {
        cellWidth: 10
    };

    columnStyles[startRekap + 4] = {
        cellWidth: 10
    };

    columnStyles[startRekap + 5] = {
        cellWidth: 10
    };

    // =====================================
    // TABLE
    // =====================================

    doc.autoTable({

        startY: 55,

        theme: "grid",

        head,

        body,

        columnStyles,

        styles: {

            fontSize: 6,

            halign: "center",

            valign: "middle",

            lineColor: [0, 0, 0],

            lineWidth: 0.1

        },

        headStyles: {

            fillColor: [230, 230, 230],

            textColor: [0, 0, 0],

            fontStyle: "bold",

            lineColor: [0, 0, 0],

            lineWidth: 0.2

        },

        alternateRowStyles: {

            fillColor: [240, 247, 255]

        },

        didParseCell:
            function (
                dataCell
            ) {

                if (
                    dataCell.section !==
                    "body"
                ) return;

                const value =
                    String(
                        dataCell.cell.raw || ""
                    )
                    .trim()
                    .toUpperCase();

                switch (
                    value
                ) {

                    case "MP":
                        dataCell.cell.styles.textColor =
                            [22, 163, 74];
                        break;

                    case "M":
                        dataCell.cell.styles.textColor =
                            [34, 197, 94];
                        break;

                    case "P":
                        dataCell.cell.styles.textColor =
                            [14, 165, 233];
                        break;

                    case "D":
                        dataCell.cell.styles.textColor =
                            [245, 158, 11];
                        break;

                    case "I":
                        dataCell.cell.styles.textColor =
                            [99, 102, 241];
                        break;

                    case "S":
                        dataCell.cell.styles.textColor =
                            [239, 68, 68];
                        break;

                    case "L":
                        dataCell.cell.styles.textColor =
                            [107, 114, 128];
                        break;

                    case "LA":
                        dataCell.cell.styles.textColor =
                            [59, 130, 246];
                        break;

                    case "W":
                        dataCell.cell.styles.textColor =
                            [99, 102, 241];
                        break;

                    case "ML":
                        dataCell.cell.styles.textColor =
                            [168, 85, 247];
                        break;

                    case "PD":
                        dataCell.cell.styles.textColor =
                            [217, 119, 6];
                        break;
                }

            }

    });

    // =====================================
    // FOOTER
    // =====================================

    const finalY =
        doc.lastAutoTable.finalY + 20;

    doc.setFontSize(10);

    doc.text(
        "Keterangan: MP=Masuk Pulang | M=Masuk | P=Pulang | D=Day Off | I=Izin | S=Sakit | L=Libur | LA=Lupa Absen | W=WFH | ML=Masuk Terlambat | PD=Pending",
        14,
        doc.lastAutoTable.finalY + 10
    );

    doc.text(
        "Denpasar, " +
        new Date()
        .toLocaleDateString(
            "id-ID"
        ),
        300,
        finalY
    );

    doc.text(
        mode ===
        "pembimbing"
            ? "Pembimbing PKL"
            : "Wali Kelas",
        40,
        finalY + 10
    );

    doc.text(
        "Kepala Sekolah",
        300,
        finalY + 10
    );

    doc.text(
        `(${namaPenanggungJawab})`,
        40,
        finalY + 35
    );

    doc.text(
        "( Ida Ayu Ary Pradnyawati, S.Pd., M.Pd. )",
        300,
        finalY + 35
    );

    // =====================================
    // SAVE
    // =====================================

    const modeLabel =
        mode ===
        "pembimbing"
            ? "Pembimbing"
            : "Wali";

    doc.save(
        `Rekap_${modeLabel}_${namaBulan}_${tahun}.pdf`
    );

}

function getNamaBulan(bulan) {

    const bulanIndonesia = [
        "",
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"
    ];

    return bulanIndonesia[
        Number(bulan)
    ] || bulan;
}