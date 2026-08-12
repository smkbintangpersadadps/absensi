async function uploadFotoAbsensi(base64, username) {

    const blob = await (await fetch(base64)).blob();

    const fileName =
        `${username}_${Date.now()}.jpg`;

    const { error } =
        await window.supabaseClient.storage
            .from("absensi")
            .upload(fileName, blob);

    if (error) {
        throw error;
    }

    const { data } =
        window.supabaseClient.storage
            .from("absensi")
            .getPublicUrl(fileName);

    return data.publicUrl;
}

async function uploadFotoStatus(base64Image, username) {

    if (!base64Image) return null;

    const fileName =
        `${username}_${Date.now()}.jpg`;

    const response =
        await fetch(base64Image);

    const blob =
        await response.blob();

    const { error } =
        await window.supabaseClient
            .storage
            .from("status-harian")
            .upload(
                fileName,
                blob,
                {
                    contentType: "image/jpeg",
                    upsert: true
                }
            );

    if (error) {
        throw error;
    }

    const {
        data
    } = window.supabaseClient
        .storage
        .from("status-harian")
        .getPublicUrl(fileName);

    return data.publicUrl;
}