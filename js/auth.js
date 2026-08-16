// ===============================
// AUTH.JS (PRODUCTION READY)
// ===============================
window.AppState = window.AppState || {
    currentUser: null,
    appSettings: null,
    riwayat: []
};

// ===============================
// LOGIN
// ===============================
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("login-username")?.value?.trim();
    const password = document.getElementById("login-password")?.value?.trim();
    if (!username || !password) {
        showToast("Username dan password wajib diisi", true);
        return;
    }
    try {
        // ===============================
        // SHOW LOADER
        // ===============================
        showLoading();
        // ===============================
        // API LOGIN
        // ===============================
        const user = await ApiService.call({
            action: "login",
            username,
            password
        });
        const settings = await ApiService.call({
            action: "get_settings"
        });
        // ===============================
        // SET APP STATE
        // ===============================
        AppState.currentUser = user;
        AppState.appSettings = {
            lat: parseFloat(settings?.lat || 0),
            lng: parseFloat(settings?.lng || 0),
            radius: parseInt(settings?.radius || 0)
        };
        // ===============================
        // SAVE SESSION
        // ===============================
        localStorage.setItem("absen_user", JSON.stringify(AppState.currentUser));
        localStorage.setItem("absen_settings", JSON.stringify(AppState.appSettings));
        // ===============================
        // BUILD UI
        // ===============================
        const remember =
        document.getElementById("remember-username")?.checked;
        if (remember) {
            localStorage.setItem(
                "remember_username",
                username
            );
        } else {
            localStorage.removeItem(
                "remember_username"
            );
        }
        Swal.fire({
            icon: "success",
            title: "Login Berhasil",
            text: `Selamat datang, ${user.nama}`,
            timer: 2000,
            showConfirmButton: false,
            timerProgressBar: true    // opsional: bar timer
        }).then(() => {
            startSessionTimer();
            setupUserInterface?.();
        });
        
    } catch (error) {
        console.error("Login error:", error);
        showToast(error.message || "Login gagal", true);
    } finally {
        hideLoading();
    }
}

function logout() {
    Swal.fire({
        title: "Keluar dari aplikasi?",
        text: "Sesi login Anda akan diakhiri.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, Logout",
        cancelButtonText: "Batal",
        confirmButtonColor: "#ef4444"
    }).then((result) => {
        if (result.isConfirmed) {
            // STOP SESSION TIMER
            stopSessionTimer?.();
            AppState.currentUser = null;
            AppState.currentUserLocation = null;
            AppState.currentLocation = null;
            localStorage.removeItem("absen_user");
            localStorage.removeItem("absen_settings");
            if (typeof stopCamera === "function") {
                stopCamera();
            }
            document.getElementById("login-form")?.reset();
            Swal.fire({
                icon: "success",
                title: "Berhasil Logout",
                timer: 2000,
                showConfirmButton: false,
                timerProgressBar: true    // opsional: bar timer
            }).then(() => {
                navigateTo("page-login");
                loadRememberedUsername?.();
            });
        }
    });
}

// ===============================
// REMEMBER USERNAME
// ===============================
function loadRememberedUsername() {
    const savedUsername = localStorage.getItem("remember_username");
    if (savedUsername) {
        const usernameInput = document.getElementById("login-username");
        const rememberCheck = document.getElementById("remember-username");
        if (usernameInput) usernameInput.value = savedUsername;
        if (rememberCheck) rememberCheck.checked = true;
    }
}

// ===============================
// RESTORE SESSION
// ===============================
function restoreSession() {
    try {
        const savedUser = localStorage.getItem("absen_user");
        const savedSettings = localStorage.getItem("absen_settings");
        if (!savedUser) {
            navigateTo("page-login");
            return;
        }
        AppState.currentUser = JSON.parse(savedUser);
        if (savedSettings) {
            AppState.appSettings = JSON.parse(savedSettings);
        }
        if (typeof setupUserInterface === "function") {
            setupUserInterface();
        }
    } catch (error) {
        console.error("Restore session error:", error);
        localStorage.removeItem("absen_user");
        localStorage.removeItem("absen_settings");
        navigateTo("page-login");
    }
}

// ===============================
// UI SETUP ROLE
// ===============================
function setupUserInterface() {
    const user = AppState.currentUser;
    if (!user) {
        navigateTo("page-login");
        return;
    }
    // ===============================
    // ROLE MAP
    // ===============================
    const roleMap = {
        admin: "Administrator",
        wali: "Wali / Pembimbing",
        siswa: "Siswa",
        kepsek: "Kepala Sekolah"
    };
    const roleLabel = roleMap[user.role] || user.role;
    // ===============================
    // SAFE DOM HELPERS
    // ===============================
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    };
    const setShow = (id, show) => {
        const el = document.getElementById(id);
        if (!el) return;
        show ? el.classList.remove("hidden-page") : el.classList.add("hidden-page");
    };
    // ===============================
    // SIDEBAR (DESKTOP)
    // ===============================
    setText("nav-user-name", user.nama);
    const avatarDesktop = document.getElementById("nav-user-avatar-desktop");
        if (avatarDesktop) {
            avatarDesktop.innerText = user.nama?.charAt(0)?.toUpperCase() || "U";
        }
    setText("nav-user-role", `Level : ${roleLabel}`);
    const kategoriEl = document.getElementById("nav-user-kategori");
    if (kategoriEl) {
        if (user.kategori && user.kategori !== "-") {
            kategoriEl.innerText = `Kelas : ${user.kategori}`;
            kategoriEl.classList.remove("hidden-page");
        } else {
            kategoriEl.classList.add("hidden-page");
        }
    }
    // ===============================
    // MOBILE HEADER
    // ===============================
    setText("nav-user-name-mobile", user.nama);
    setText("nav-user-role-mobile", roleLabel);
    const avatarEl = document.getElementById("nav-user-avatar");
    if (avatarEl) {
        avatarEl.innerText = user.nama?.charAt(0)?.toUpperCase() || "U";
    }
    // ===============================
    // MENU BUILDER (ROLE BASED)
    // ===============================
    if (typeof buildMenu === "function") {
        buildMenu(user);
    }
    buildMobileBottomMenu?.(user);
    // ===============================
    // ROUTING BY ROLE
    // ===============================
    switch (user.role) {
        case "admin":
            navigateTo("page-admin-dashboard");
            break;
        case "wali":
            showLoader("Memuat data siswa...");
            navigateTo("page-wali-dashboard");
            break;
        case "siswa":
            pilihModeSiswaOrtu();
            break;  
        case "kepsek":
            showLoader("Memuat dashboard kepala sekolah...");
            navigateTo("page-kepsek-dashboard");
            break;
        default:
            showToast("Role tidak dikenali", true);
            logout();
            break;
    }
}

// ===============================
// SHOW LOADING
// ===============================
function showLoading() {
  document
    .getElementById("loadingOverlay")
    .classList.add("show");
}

// ===============================
// HIDE CAMERA
// ===============================
function hideLoading() {
  document
    .getElementById("loadingOverlay")
    .classList.remove("show");
}

// ===============================
// SHOW LOADER
// ===============================
function showLoader(text = "Memeriksa data...") {
    const overlay = document.getElementById("loadingOverlay");
    const textEl = document.querySelector("#loadingOverlay .loading-text");
    if (textEl) {
        textEl.innerText = text;
    }
    if (overlay) {
        overlay.classList.add("show");
    }
}

// ===============================
// HIDE LOADER
// ===============================
function hideLoader() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
        overlay.classList.remove("show");
    }
}

// ===============================
// TOGGLE PASSWORD
// ===============================
function togglePassword() {
    const input = document.getElementById("login-password");
    const icon = document.getElementById("toggle-password-icon");
    if (!input || !icon) return;
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}

// ===============================
// CHANGE PASSWORD
// ===============================
async function loadProfile() {
    const user = AppState.currentUser;
    if (!user) return;
    document.getElementById("profile-nama").innerText =
        user.nama || "-";
    document.getElementById("profile-role").innerText =
        user.kategori || "-";
    document.getElementById("profile-username").innerText =
        user.username || "-";
    document.getElementById("profile-lokasi").innerText =
        AppState.currentUserLocation?.namaIndustri || "-";
    // default
    document.getElementById("profile-pembimbing").innerText =
        "Memuat...";
    try {
        const {
            data: guru,
            error
        } = await window.supabaseClient
            .from("guru")
            .select("nama_lengkap")
            .eq("p_id", user.pId)
            .maybeSingle();
        if (!error && guru) {
            document.getElementById(
                "profile-pembimbing"
            ).innerText =
                guru.nama_lengkap;
        } else {
            document.getElementById(
                "profile-pembimbing"
            ).innerText =
                "-";
        }
    } catch (err) {
        console.error(err);
        document.getElementById(
            "profile-pembimbing"
        ).innerText =
            "-";
    }
}

// ===============================
// SHOW PASSWORD
// ===============================
function showChangePassword(){
    document
        .getElementById("modal-change-password")
        .classList.remove("hidden-page");

}

// ===============================
// CLOSE FORM PASSWORD
// ===============================
function closeChangePassword(){
    document
        .getElementById("modal-change-password")
        .classList.add("hidden-page");
    [
        "old-password",
        "new-password",
        "confirm-password"
    ].forEach(id=>{
        document.getElementById(id).value="";
    });
    checkPasswordStrength();
}

// ===============================
// CHANGE PASSWORD
// ===============================
async function changePassword() {
    const user = AppState.currentUser;
    if (!user) return;
    const oldPassword =
        document.getElementById("old-password")
        .value.trim();
    const newPassword =
        document.getElementById("new-password")
        .value.trim();
    const confirmPassword =
        document.getElementById("confirm-password")
        .value.trim();
    // ======================
    // VALIDASI
    // ======================
    if (!oldPassword) {
        showToast("Masukkan password lama.", true);
        return;
    }
    if (newPassword.length < 6) {
        showToast(
            "Password baru minimal 6 karakter.",
            true
        );
        return;
    }
    if (newPassword !== confirmPassword) {
        showToast(
            "Konfirmasi password tidak sama.",
            true
        );
        return;
    }
    if (oldPassword === newPassword) {
        showToast(
            "Password baru harus berbeda dengan password lama.",
            true
        );
        return;
    }
    const btn =
        document.getElementById(
            "btn-change-password"
        );
    btn.disabled = true;
    btn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin mr-2"></i>
        Menyimpan...
    `;
    try {
        showLoader(
            "Mengubah password..."
        );
        // ======================
        // CEK PASSWORD LAMA
        // ======================
        const {
            data: userDb,
            error: cekError
        } = await window.supabaseClient
            .from("users")
            .select("password")
            .eq(
                "username",
                user.username
            )
            .single();
        if (cekError) {
            throw cekError;
        }
        if (
            !userDb ||
            userDb.password !== oldPassword
        ) {
            throw new Error(
                "Password lama tidak sesuai."
            );
        }
        // ======================
        // UPDATE PASSWORD
        // ======================
        const {
            error: updateError
        } = await window.supabaseClient
            .from("users")
            .update({
                password: newPassword
            })
            .eq(
                "username",
                user.username
            );
        if (updateError) {
            throw updateError;
        }
        // tutup loader dulu
        hideLoader();
        closeChangePassword();
        await Swal.fire({
            icon: "success",
            title: "Password Berhasil Diubah",
            text:
                "Silakan login kembali menggunakan password baru.",
            confirmButtonText:
                "Login Ulang",
            confirmButtonColor:
                "#4f46e5",
            allowOutsideClick:
                false
        });
        logout();
    }
    catch (err) {
        console.error(
            "Change Password Error:",
            err
        );
        hideLoader();
        showToast(
            err.message ||
            "Gagal mengubah password",
            true
        );
    }
    finally {
        resetChangePasswordButton();
    }
}

// ===============================
// SHOW PASSWORD
// ===============================
function togglePasswords(id, btn){
    const input=document.getElementById(id);
    const icon=btn.querySelector("i");
    if(input.type==="password"){
        input.type="text";
        icon.className="fa-solid fa-eye-slash";
    }else{
        input.type="password";
        icon.className="fa-solid fa-eye";
    }
}

// ===============================
// CHECK PASSWORD
// ===============================
function checkPasswordStrength(){
    const input=document.getElementById("new-password");
    const bar=document.getElementById("password-strength-bar");
    const text=document.getElementById("password-strength-text");
    const pass=input.value;
    let score=0;
    if(pass.length>=6) score++;
    if(/[A-Z]/.test(pass)) score++;
    if(/[0-9]/.test(pass)) score++;
    if(/[!@#$%^&*]/.test(pass)) score++;
    const widths=["0%","25%","50%","75%","100%"];
    const colors=[
        "bg-gray-300",
        "bg-red-500",
        "bg-orange-500",
        "bg-yellow-500",
        "bg-green-500"
    ];
    const labels=[
        "Minimal 6 karakter",
        "Lemah",
        "Sedang",
        "Baik",
        "Sangat Kuat"
    ];
    bar.style.width=widths[score];
    bar.className=
        `h-full rounded-full transition-all duration-300 ${colors[score]}`;
    text.innerHTML=labels[score];
}

// ===============================
// RESET CHANGE PASSWORD
// ===============================
function resetChangePasswordButton(){
    const btn = document.getElementById("btn-change-password");
    if(!btn) return;
    btn.disabled = false;
    btn.innerHTML = "Simpan Password";
}