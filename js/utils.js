// =====================================
// HELPER SHOW TOAST
// =====================================
function showToast(message, isError = false) {
    Swal.fire({
        toast: true,
        position: "top-end",
        icon: isError ? "error" : "success",
        title: message,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
    });
}

// =====================================
// HELPER SHOW LOADER
// =====================================
function showLoader(text = "Loading...") {
  console.log(text);
}

// =====================================
// HELPER HIDE LOADER
// =====================================
function hideLoader() {}


// ===============================
// DATE HELPER
// ===============================
function parseDateID(dateStr) {
    if (!dateStr) return new Date();

    const [datePart, timePart] = dateStr.split(" ");
    const [d, m, y] = datePart.split("/");

    return new Date(`${y}-${m}-${d}T${timePart || "00:00:00"}`);
}

// =====================================
// HELPER FORMAT TODAY
// =====================================
function formatTodayID() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();

    return `${d}/${m}/${y}`;
}

// =====================================
// HELPER LIBUR
// =====================================
function isLiburBerlakuUntukLokasi(
    libur,
    lokasiId
) {
    const berlaku =
        String(
            libur?.berlaku || ""
        )
        .trim()
        .toUpperCase();
    const lokasi =
        String(
            lokasiId || ""
        )
        .trim()
        .toUpperCase();
    if (!berlaku) {
        return false;
    }
    // Berlaku untuk semua
    if (berlaku === "ALL") {
        return true;
    }
    const lokasiList =
        berlaku
        .split(",")
        .map(x =>
            x.trim().toUpperCase()
        );
    return lokasiList.includes(
        lokasi
    );
}

