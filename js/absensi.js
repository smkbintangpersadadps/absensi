// ===============================
// ABSENSI
// ===============================

let currentLocation = null;
let currentStream = null;
let capturedPhoto = null;
let statusPhoto = null;


// ===============================
// START CAMERA
// ===============================
async function startCamera() {
    try {
        const video = document.getElementById("kamera-video");

        if (!video) return;

        stopCamera();

        currentStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user"
            }
        });

        video.srcObject = currentStream;

    } catch (error) {
        console.error(error);
        showToast("Tidak bisa mengakses kamera", true);
    }
}


// ===============================
// STOP CAMERA
// ===============================
function stopCamera() {
    if (!currentStream) return;

    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
}

async function loadUserLocation() {

    try {

        const user = AppState.currentUser;

        if (!user?.lokasiId) {
            throw new Error("Lokasi PKL belum diatur");
        }

        const { data, error } =
            await window.supabaseClient
                .from("lokasi")
                .select("*")
                .eq("lokasi_id", user.lokasiId)
                .single();

        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error("Data lokasi tidak ditemukan");
        }

        AppState.currentUserLocation = {

            lokasiId: data.lokasi_id,

            namaIndustri: data.nama_industri,

            lat: Number(data.latitude),

            lng: Number(data.longitude),

            radius: Number(data.radius),

            alamat: data.alamat

        };

        const lokasiEl =
            document.getElementById("lokasi-industri");

        if (lokasiEl) {
            lokasiEl.innerText =
                data.nama_industri || "-";
        }

        console.log(
            "Lokasi berhasil dimuat:",
            AppState.currentUserLocation
        );

    }
    catch (error) {

        console.error(
            "Load lokasi gagal:",
            error
        );

        showToast(
            error.message ||
            "Gagal memuat lokasi PKL",
            true
        );

    }

}

function startGPS() {
    if (!navigator.geolocation) {
        showToast("Browser tidak mendukung GPS", true);
        return;
    }

    if (!AppState.currentUserLocation) {
        showToast("Lokasi PKL belum tersedia", true);
        return;
    }

    document.getElementById("gps-status").innerText = "Mengambil lokasi...";

    navigator.geolocation.getCurrentPosition(
        (position) => {

            AppState.currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            const distance = calculateDistance(
                AppState.currentLocation.lat,
                AppState.currentLocation.lng,
                AppState.currentUserLocation.lat,
                AppState.currentUserLocation.lng
            );

            document.getElementById("gps-status").innerText = "Aktif";

            document.getElementById("gps-distance").innerText =
                `${Math.round(distance)} meter`

        },
        () => {
            showToast("Gagal mendapatkan lokasi", true);
            document.getElementById("gps-status").innerText = "Gagal";
        },
        {
            enableHighAccuracy: true
        }
    );
}


// ===============================
// HITUNG JARAK (HAVERSINE)
// ===============================
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function toRad(value) {
    return value * Math.PI / 180;
}


// ===============================
// SNAPSHOT
// ===============================
function takeSnapshot() {
    const video = document.getElementById("kamera-video");
    const canvas = document.getElementById("kamera-canvas");
    const preview = document.getElementById("kamera-preview");

    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    capturedPhoto = canvas.toDataURL("image/jpeg", 0.8);

    preview.src = capturedPhoto;

    video.classList.add("hidden-page");
    preview.classList.remove("hidden-page");

    document.getElementById("btn-snap")
        .classList.add("hidden-page");

    document.getElementById("btn-retake")
        .classList.remove("hidden-page");
}


// ===============================
// RETAKE
// ===============================
function retakeSnapshot() {
    capturedPhoto = null;

    document.getElementById("kamera-video")
        .classList.remove("hidden-page");

    document.getElementById("kamera-preview")
        .classList.add("hidden-page");

    document.getElementById("btn-snap")
        .classList.remove("hidden-page");

    document.getElementById("btn-retake")
        .classList.add("hidden-page");
}


// ===============================
// RESET ABSENSI
// ===============================
function resetAbsensi() {

    capturedPhoto = null;

    const video = document.getElementById("kamera-video");
    const preview = document.getElementById("kamera-preview");

    // reset UI kamera
    video?.classList.remove("hidden-page");
    preview?.classList.add("hidden-page");

    document.getElementById("btn-snap")?.classList.remove("hidden-page");
    document.getElementById("btn-retake")?.classList.add("hidden-page");

    // reset status GPS (optional)
    document.getElementById("gps-status").innerText = "";
    document.getElementById("gps-distance").innerText = "";
}

const buttons = document.querySelectorAll(".absen-btn");

buttons.forEach(btn => {

    btn.addEventListener("click", () => {

        buttons.forEach(b => {
            b.classList.remove(
                "active-masuk",
                "active-pulang"
            );
        });

        const value = btn.dataset.value;

        if (value === "Masuk") {
            btn.classList.add("active-masuk");
        } else {
            btn.classList.add("active-pulang");
        }

        document.getElementById("absen-tipe").value =
            value;
    });

});

async function submitAbsensi() {

    const user = AppState.currentUser;

    if (!user) {
        showToast("User tidak ditemukan", true);
        return;
    }

    if (!capturedPhoto) {
        showToast("Ambil foto dulu", true);
        return;
    }

    if (!AppState.currentLocation) {
        showToast("Lokasi belum aktif", true);
        return;
    }

    if (!AppState.currentUserLocation) {
        showToast("Lokasi PKL belum tersedia", true);
        return;
    }

    const tipe =
        document.getElementById("absen-tipe").value;

    if (!tipe) {
        showToast("Pilih tipe absensi", true);
        return;
    }

    // ===============================
    // VALIDASI ABSEN PULANG
    // WAJIB SUDAH ABSEN MASUK
    // ===============================

    if (tipe === "Pulang") {

        const today =
            new Date()
                .toISOString()
                .split("T")[0];

        const {
            data: absenMasuk,
            error: masukError
        } = await window.supabaseClient
            .from("absensi")
            .select("id,waktu")
            .eq("username", user.username)
            .eq("tipe", "Masuk")
            .gte("waktu", `${today}T00:00:00`)
            .lte("waktu", `${today}T23:59:59`)
            .limit(1);

        if (masukError) {
            throw masukError;
        }

        if (!absenMasuk || absenMasuk.length === 0) {

            Swal.fire({
                icon: "warning",
                title: "Absen Masuk Belum Ada",
                text: "Anda harus melakukan Absen Masuk terlebih dahulu sebelum Absen Pulang."
            });

            return;
        }
    }

    const jarak = calculateDistance(
        AppState.currentLocation.lat,
        AppState.currentLocation.lng,
        AppState.currentUserLocation.lat,
        AppState.currentUserLocation.lng
    );

    if (jarak > AppState.currentUserLocation.radius) {

        showToast(
            `Anda berada di luar radius absensi (${Math.round(jarak)} m)`,
            true
        );

        return;
    }

    if (window.__isSubmittingAbsensi) return;

    window.__isSubmittingAbsensi = true;

    try {

        // ===============================
        // CEK DUPLIKAT HARI INI
        // ===============================

        const today =
            new Date().toISOString().split("T")[0];

        const {
            data: existing,
            error: cekError
        } = await window.supabaseClient
            .from("absensi")
            .select("id")
            .eq("username", user.username)
            .eq("tipe", tipe)
            .gte("waktu", `${today}T00:00:00`)
            .lte("waktu", `${today}T23:59:59`);

        if (cekError) {
            throw cekError;
        }

        if (existing.length > 0) {

            showToast(
                `Anda sudah melakukan absen ${tipe} hari ini`,
                true
            );

            return;
        }

        // ===============================
        // UPLOAD FOTO
        // ===============================

        showLoader("Upload foto...");

        const fotoUrl =
            await uploadFotoAbsensi(
                capturedPhoto,
                user.username
            );

        // ===============================
        // SIMPAN ABSENSI
        // ===============================

        showLoader("Menyimpan absensi...");

        const mapsUrl =
            `https://www.google.com/maps?q=${AppState.currentLocation.lat},${AppState.currentLocation.lng}`;

        const now = new Date().toISOString();

        const {
            error: insertError
        } = await window.supabaseClient
            .from("absensi")
            .insert([{
                username: user.username,
                nama_lengkap: user.nama,
                kategori: user.kategori,
                lokasi_id: user.lokasiId,
                nama_industri: AppState.currentUserLocation.namaIndustri,
                tipe: tipe,
                foto_url: fotoUrl,
                latitude: AppState.currentLocation.lat,
                longitude: AppState.currentLocation.lng,
                jarak: Math.round(jarak),
                maps_url: mapsUrl
            }]);

        if (insertError) {
            throw insertError;
        }

        Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: `Absen ${tipe} berhasil disimpan`,
            timer: 2000,
            showConfirmButton: false
        });

        resetAbsensi();

        stopCamera?.();

        setTimeout(() => {
            goToDashboardByRole();
        }, 1500);

    }
    catch (error) {

        console.error(
            "Submit absensi error:",
            error
        );

        showToast(
            error.message ||
            "Gagal menyimpan absensi",
            true
        );

    }
    finally {

        hideLoader();

        window.__isSubmittingAbsensi = false;
    }
}
// =====================================================
// CEK HARI AKTIF PKL
// =====================================================
// =====================================
// CEK HARI AKTIF PKL
// =====================================
async function checkHariAktifPKL(user) {

    try {

        const today =
            new Date();

        const tanggal =
            today.toISOString()
            .split("T")[0];

        const namaHari =
            [
                "minggu",
                "senin",
                "selasa",
                "rabu",
                "kamis",
                "jumat",
                "sabtu"
            ][today.getDay()];

        const lokasiId =
            String(
                user.lokasiId || ""
            )
            .trim()
            .toUpperCase();

        // =====================================
        // HARI LIBUR
        // =====================================

        const {
            data: liburData,
            error: liburError
        } = await window.supabaseClient
            .from("hari_libur")
            .select("*")
            .eq(
                "tanggal",
                tanggal
            );

        if (liburError) {
            throw liburError;
        }

        const liburAktif =
            (liburData || [])
            .find(item =>
                isLiburBerlakuUntukLokasi(
                    item,
                    lokasiId
                )
            );

        if (liburAktif) {

            return {

                aktif: false,

                jenis:
                    "LIBUR_NASIONAL",

                namaLibur:
                    liburAktif.nama_libur,

                message:
                    liburAktif.nama_libur
            };
        }

        // =====================================
        // KALENDER INDUSTRI
        // =====================================

        const {
            data: kalender,
            error: kalenderError
        } = await window.supabaseClient
            .from("kalender_industri")
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

        if (!kalender) {

            return {
                aktif: true
            };
        }

        const hariAktif =
            kalender[namaHari];

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

                message:
                    `${kalender.nama_industri} libur pada hari ${namaHari}`
            };
        }

        return {
            aktif: true
        };

    }
    catch (error) {

        console.error(
            "checkHariAktifPKL:",
            error
        );

        return {
            aktif: true
        };
    }
}

async function initAbsenForm() {

    const user = AppState.currentUser;

    if (!user) return;

    try {

        showLoader(
            "Memeriksa status hari ini..."
        );

        // =====================================
        // CEK HARI AKTIF PKL
        // =====================================

        const hariAktif =
            await checkHariAktifPKL(user);

        if (!hariAktif.aktif) {

            hideLoader();

            // ==========================
            // LIBUR NASIONAL
            // ==========================

            if (
                hariAktif.jenis ===
                "LIBUR_NASIONAL"
            ) {

                await Swal.fire({

                    icon: "info",

                    title:
                        "Absensi Dinonaktifkan",

                    html: `

                        <div class="text-center">

                            <div class="mb-3">
                                <i
                                    class="fa-solid fa-calendar-xmark text-red-500"
                                    style="font-size:60px">
                                </i>
                            </div>

                            <div class="bg-red-50 border border-red-200 rounded-xl p-4">

                                <div class="text-slate-500 text-sm mt-2">
                                    Tanggal ${formatTanggalIndonesia(new Date())}
                                </div>

                                <div class="font-bold text-red-700 mb-2">
                                    Hari Libur Nasional
                                </div>

                                <div class="text-slate-700">
                                    ${hariAktif.namaLibur}
                                </div>

                            </div>

                            <p class="mt-3 text-sm text-slate-500">
                                Absensi tidak dapat dilakukan
                                pada hari libur.
                            </p>

                        </div>

                    `,

                    confirmButtonText:
                        "Kembali ke Dashboard",

                    confirmButtonColor:
                        "#4F46E5"
                });
            }

            // ==========================
            // LIBUR INDUSTRI
            // ==========================

            else if (
                hariAktif.jenis ===
                "LIBUR_INDUSTRI"
            ) {

                await Swal.fire({

                    icon: "warning",

                    title:
                        "Absensi Dinonaktifkan",

                    html: `

                        <div class="text-center">

                            <div class="mb-3">
                                <i
                                    class="fa-solid fa-building-circle-xmark text-orange-500"
                                    style="font-size:60px">
                                </i>
                            </div>

                            <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">

                                <div class="font-bold text-orange-700 mb-2">
                                    Hari Libur Industri
                                </div>

                                <div class="text-slate-700">
                                    ${hariAktif.namaIndustri}
                                </div>

                            </div>

                            <p class="mt-3 text-sm text-slate-500">
                                Industri libur pada hari
                                <b>${hariAktif.namaHari.toUpperCase()}</b>
                            </p>

                        </div>

                    `,

                    confirmButtonText:
                        "Kembali ke Dashboard",

                    confirmButtonColor:
                        "#4F46E5"
                });
            }

            stopCamera?.();

            if (window.watchPositionId) {

                navigator.geolocation.clearWatch(
                    window.watchPositionId
                );
            }

            navigateTo(
                "page-user-dashboard"
            );

            return;
        }

        const today =
            new Date()
                .toISOString()
                .split("T")[0];

        // =====================================
        // CEK STATUS HARIAN
        // =====================================

        const {
            data: statusHarian,
            error
        } = await window.supabaseClient
            .from("status_harian")
            .select("*")
            .eq(
                "username",
                user.username
            )
            .eq(
                "tanggal",
                today
            )
            .maybeSingle();

        if (error) {

            throw error;
        }

        if (statusHarian) {

            const approval =
                String(
                    statusHarian.approval || ""
                )
                .trim()
                .toLowerCase();

            if (
                approval === "pending" ||
                approval === "approved"
            ) {

                hideLoader();

                await Swal.fire({

                    icon: "info",

                    title:
                        "Absensi Dinonaktifkan",

                    html: `

                        <div class="text-left">

                            <p class="mb-2">
                                Status Hari Ini :
                            </p>

                            <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-3">

                                <div class="font-bold text-indigo-700">
                                    ${statusHarian.status}
                                </div>

                                <div class="text-sm text-slate-600 mt-1">
                                    Approval :
                                    <b>${statusHarian.approval}</b>
                                </div>

                                ${
                                    statusHarian.keterangan
                                    ? `
                                        <div class="mt-2 text-sm">
                                            ${statusHarian.keterangan}
                                        </div>
                                    `
                                    : ""
                                }

                            </div>

                        </div>

                    `,

                    confirmButtonText:
                        "Kembali ke Dashboard",

                    confirmButtonColor:
                        "#4F46E5"
                });

                navigateTo(
                    "page-user-dashboard"
                );

                return;
            }
        }

        // =====================================
        // LOAD ABSENSI
        // =====================================

        await loadUserLocation();

        startCamera();

        startGPS();

        pageCleanup = () => {

            stopCamera?.();

            if (
                window.watchPositionId
            ) {

                navigator.geolocation.clearWatch(
                    window.watchPositionId
                );
            }
        };

    }
    catch (error) {

        console.error(
            "Init absen error:",
            error
        );

        showToast(
            "Gagal membuka halaman absensi",
            true
        );
    }
    finally {

        hideLoader();
    }
}

// ===============================
// CLEANUP ABSENSI PAGE
// ===============================
PageLifecycle.onLeave["page-user-absen"] = () => {
    stopCamera?.();

    // optional reset state biar bersih
    currentLocation = null;
    capturedPhoto = null;
};

function goToDashboardByRole() {
    const role = AppState.currentUser?.role;

    const map = {
        admin: "page-admin-dashboard",
        wali: "page-wali-dashboard",
        siswa: "page-user-dashboard"
    };

    navigateTo(map[role] || "page-user-dashboard");
}
