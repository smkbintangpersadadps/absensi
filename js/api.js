// ===============================
// API SERVICE
// ===============================

const ApiService = {

    async call(payload) {

        const action = payload.action;

        try {

            switch (action) {

                // ===============================
                // LOGIN (SUPABASE)
                // ===============================
                case "login":
                    return await this.loginSupabase(payload);

                // ===============================
                // SETTINGS (SUPABASE)
                // ===============================
                case "get_settings":
                    return await this.getSettingsSupabase();

                // ===============================
                // ACTION LAIN MASIH KE GAS
                // ===============================
                default:
                    return await this.callGas(payload);
            }

        } catch (error) {

            console.error("API Error:", error);
            throw error;

        }

    },

    // ==========================================
    // LOGIN SUPABASE
    // ==========================================
    async loginSupabase(payload) {

        const { data, error } = await window.supabaseClient
            .from("users")
            .select("*")
            .eq("username", payload.username)
            .eq("password", payload.password)
            .single();

        if (error || !data) {
            throw new Error("Username atau password salah");
        }

        return {
            id: data.id,
            username: data.username,
            role: data.role,
            nama: data.nama_lengkap,
            kategori: data.kategori,
            lokasiId: data.lokasi_id,
            parentId: data.parent_id,
            pId: data.p_id
        };

    },

    // ==========================================
    // SETTINGS SUPABASE
    // ==========================================
    async getSettingsSupabase() {

        const { data, error } = await window.supabaseClient
            .from("settings")
            .select("*");

        if (error) {
            throw error;
        }

        const settings = {};

        data.forEach(row => {
            settings[row.setting_name] = row.value;
        });

        return {
            lat: parseFloat(settings.lat || 0),
            lng: parseFloat(settings.lng || 0),
            radius: parseInt(settings.radius || 0)
        };

    },

    // ==========================================
    // FALLBACK KE GAS
    // ==========================================
    async callGas(payload) {

        if (CONFIG.IS_PREVIEW) {
            return this.mock(payload);
        }

        const response = await fetch(CONFIG.GAS_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const text = await response.text();

        console.log("=== RAW RESPONSE ===");
        console.log(text);

        const result = JSON.parse(text);

        if (result.status === "success") {
            return result.data;
        }

        throw new Error(result.message);

    },

    // ==========================================
    // MOCK DATA
    // ==========================================
    async mock(payload) {

        return new Promise((resolve, reject) => {

            setTimeout(() => {

                const action = payload.action;

                try {

                    switch (action) {

                        case "login":

                            const user = DummyData.users.find(
                                u =>
                                u.username === payload.username &&
                                u.password === payload.password
                            );

                            if (!user) {
                                throw new Error(
                                    "Username atau password salah"
                                );
                            }

                            resolve({
                                username: user.username,
                                role: user.role,
                                nama: user.nama,
                                kategori: user.kategori,
                                lokasiId: user.lokasiId || "L001"
                            });

                            break;

                        case "get_settings":

                            resolve(AppState.appSettings);

                            break;

                        default:

                            throw new Error(
                                "Mock action tidak ditemukan"
                            );

                    }

                } catch (err) {

                    reject(err);

                }

            }, 300);

        });

    }

};