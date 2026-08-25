// const JURNAL_START_DATE = "2026-08-24";
const WaliJurnal7Kaih = {
    students: [],
    journals: [],
    journalMap: new Map(),
    currentMonth: new Date(),
    filter: "all",
    initialized: false,
    async init() {
        const user = AppState.currentUser;
        if (!user) return;
        if (!this.isWaliKelas()) return;
        this.currentMonth = new Date();
        this.currentMonth.setDate(1);
        this.filter = "all";
        await this.load();
    },
    // =====================================================
    // CEK ROLE WALI KELAS
    // =====================================================
    isWaliKelas() {
        const user = AppState.currentUser;
        if (!user) return false;
        const role =
            String(user.role || "")
                .trim()
                .toLowerCase();
        return (
            role === "wali kelas" ||
            role === "wali_kelas" ||
            role === "wali"
        );
    },
    // =====================================================
    // LOAD DATA UTAMA
    // =====================================================
    async load() {
        try {
            showLoader(
                "Memuat monitoring jurnal..."
            );
            const user =
                AppState.currentUser;
            if (!user) return;
            const kategori =
                String(
                    user.kategori || ""
                ).trim();
            if (!kategori) {
                this.showEmpty(
                    "Kategori kelas Wali Kelas belum tersedia."
                );
                return;
            }
            // =================================================
            // HANYA KELAS X
            // =================================================
            if (
                !kategori
                    .toUpperCase()
                    .startsWith("X ")
            ) {
                this.showEmpty(
                    "Monitoring Jurnal 7 KAIH hanya berlaku untuk kelas X."
                );
                return;
            }
            const kelasElement =
                document.getElementById(
                    "wali-jurnal-kelas"
                );
            if (kelasElement) {
                kelasElement.textContent =
                    kategori;
            }
            // =================================================
            // LOAD SISWA DALAM KELAS
            // =================================================
            const {
                data: students,
                error: studentError
            } =
                await window.supabaseClient
                    .from("users")
                    .select(
                        "username,nama_lengkap,kategori,role"
                    )
                    .eq(
                        "kategori",
                        kategori
                    );
            if (studentError) {
                throw studentError;
            }
            this.students =
                (students || [])
                    .filter(item => {
                        const role =
                            String(
                                item.role || ""
                            )
                            .trim()
                            .toLowerCase();
                        return (
                            role === "siswa" ||
                            !item.role
                        );
                    });
            // =================================================
            // LOAD JURNAL
            // =================================================
            await this.loadJournals();
            // =================================================
            // BUILD MAP
            // =================================================
            this.buildJournalMap();
            // =================================================
            // RENDER
            // =================================================
            this.renderSummary();
            this.renderCalendar();
            this.renderWarnings();
            this.renderStudents();
            this.initialized = true;
        } catch (error) {
            console.error(
                "WaliJurnal7Kaih.load:",
                error
            );
            Swal.fire({
                icon: "error",
                title: "Gagal Memuat",
                text:
                    error.message ||
                    "Data jurnal gagal dimuat."
            });
        } finally {
            hideLoader();
        }
    },
    // =====================================================
    // LOAD JURNAL SISWA
    // =====================================================
    async loadJournals() {
        const usernames =
            this.students
                .map(item => item.username)
                .filter(Boolean);
        if (!usernames.length) {
            this.journals = [];
            return;
        }
        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("jurnal_7_kaih")
                .select(`
                    id,
                    username,
                    nama_lengkap,
                    kategori,
                    tanggal,
                    bangun,
                    ibadah,
                    olahraga,
                    makan,
                    gemar,
                    bermasyarakat,
                    tidur
                `)
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
        this.journals =
            data || [];
    },
    // =====================================================
    // BUILD JOURNAL MAP
    // =====================================================
    buildJournalMap() {
        this.journalMap =
            new Map();
        this.journals.forEach(
            journal => {
                this.journalMap.set(
                    `${journal.username}_${journal.tanggal}`,
                    journal
                );
            }
        );
    },
    // =====================================================
    // LOCAL DATE
    // =====================================================
    getLocalDate(offsetDays = 0) {
        const date =
            new Date();
        date.setHours(
            0,
            0,
            0,
            0
        );
        date.setDate(
            date.getDate() +
            offsetDays
        );
        const year =
            date.getFullYear();
        const month =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            );
        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            );
        return `${year}-${month}-${day}`;
    },
    // =====================================================
    // FORMAT TANGGAL
    // =====================================================
    formatDateLong(value) {
        if (!value) return "-";
        const [
            year,
            month,
            day
        ] =
            value.split("-");
        const date =
            new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            );
        return date.toLocaleDateString(
            "id-ID",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    },
    // =====================================================
    // CEK TANGGAL JURNAL AKTIF
    // =====================================================
    isJournalDateActive(
        dateString
    ) {
        if (!dateString) {
            return false;
        }
        // Sebelum tanggal mulai
        if (
            dateString <
            JURNAL_START_DATE
        ) {
            return false;
        }
        const date =
            new Date(
                dateString +
                "T00:00:00"
            );
        // Minggu tidak perlu jurnal
        if (
            date.getDay() === 0
        ) {
            return false;
        }
        return true;
    },
    // =====================================================
    // GET JOURNAL
    // =====================================================
    getJournal(
        username,
        date
    ) {
        return (
            this.journalMap.get(
                `${username}_${date}`
            ) || null
        );
    },
    // =====================================================
    // CEK JURNAL LENGKAP
    // =====================================================
    isComplete(journal) {
        if (!journal) {
            return false;
        }
        return Boolean(
            journal.bangun &&
            journal.ibadah !== null &&
            journal.ibadah !== undefined &&
            journal.olahraga !== null &&
            journal.olahraga !== undefined &&
            journal.makan &&
            journal.gemar &&
            journal.bermasyarakat &&
            journal.tidur
        );
    },
    // =====================================================
    // STATISTIK PER TANGGAL
    // =====================================================
    getDateStats(date) {
        if (
            !this.isJournalDateActive(
                date
            )
        ) {
            return {
                done: 0,
                missing: 0,
                total: 0,
                percentage: 0,
                inactive: true
            };
        }
        let done = 0;
        let missing = 0;
        this.students.forEach(
            student => {
                const journal =
                    this.getJournal(
                        student.username,
                        date
                    );
                if (
                    this.isComplete(
                        journal
                    )
                ) {
                    done++;
                } else {
                    missing++;
                }
            }
        );
        return {
            done,
            missing,
            total:
                this.students.length,
            percentage:
                this.students.length
                    ? Math.round(
                        (
                            done /
                            this.students.length
                        ) * 100
                    )
                    : 0,
            inactive: false
        };
    },
    // =====================================================
    // SUMMARY
    // =====================================================
    renderSummary() {
        const today =
            this.getLocalDate();
        const total =
            this.students.length;
        const stats =
            this.getDateStats(
                today
            );
        const totalElement =
            document.getElementById(
                "wali-jurnal-total-siswa"
            );
        const doneElement =
            document.getElementById(
                "wali-jurnal-sudah"
            );
        const missingElement =
            document.getElementById(
                "wali-jurnal-belum"
            );
        const percentageElement =
            document.getElementById(
                "wali-jurnal-persentase"
            );
        if (totalElement) {
            totalElement.textContent =
                total;
        }
        if (
            stats.inactive
        ) {
            if (doneElement) {
                doneElement.textContent =
                    "-";
            }
            if (missingElement) {
                missingElement.textContent =
                    "-";
            }
            if (percentageElement) {
                percentageElement.textContent =
                    "-";
            }
            return;
        }
        if (doneElement) {
            doneElement.textContent =
                stats.done;
        }
        if (missingElement) {
            missingElement.textContent =
                stats.missing;
        }
        if (percentageElement) {
            percentageElement.textContent =
                `${stats.percentage}%`;
        }
    },
    // =====================================================
    // RENDER CALENDAR
    // =====================================================
    renderCalendar() {
        const container =
            document.getElementById(
                "wali-jurnal-calendar"
            );
        const title =
            document.getElementById(
                "wali-jurnal-calendar-title"
            );
        if (!container) {
            return;
        }
        const year =
            this.currentMonth
                .getFullYear();
        const month =
            this.currentMonth
                .getMonth();
        if (title) {
            title.textContent =
                this.currentMonth
                    .toLocaleDateString(
                        "id-ID",
                        {
                            month: "long",
                            year: "numeric"
                        }
                    );
        }
        const firstDay =
            new Date(
                year,
                month,
                1
            ).getDay();
        const totalDays =
            new Date(
                year,
                month + 1,
                0
            ).getDate();
        const dayNames = [
            "Min",
            "Sen",
            "Sel",
            "Rab",
            "Kam",
            "Jum",
            "Sab"
        ];
        let html = "";
        dayNames.forEach(
            day => {
                html += `
                    <div
                        class="text-center
                               text-xs
                               font-semibold
                               text-slate-400
                               py-1"
                    >
                        ${day}
                    </div>
                `;
            }
        );
        for (
            let i = 0;
            i < firstDay;
            i++
        ) {
            html += `
                <div></div>
            `;
        }
        for (
            let day = 1;
            day <= totalDays;
            day++
        ) {
            const date =
                `${year}-${String(
                    month + 1
                ).padStart(
                    2,
                    "0"
                )}-${String(
                    day
                ).padStart(
                    2,
                    "0"
                )}`;
            const dateObj =
                new Date(
                    year,
                    month,
                    day
                );
            const isSunday =
                dateObj.getDay() === 0;
            const isBeforeStart =
                date <
                JURNAL_START_DATE;
            // =============================================
            // MINGGU / SEBELUM JURNAL DIMULAI
            // =============================================
            if (
                isSunday ||
                isBeforeStart
            ) {
                html += `
                    <div
                        class="aspect-square
                               rounded-xl
                               bg-slate-50
                               flex
                               flex-col
                               items-center
                               justify-center
                               text-xs
                               opacity-60"
                    >
                        <span
                            class="font-semibold
                                   text-slate-400"
                        >
                            ${day}
                        </span>
                        <span class="mt-1">
                            ${isSunday ? "−" : "—"}
                        </span>
                    </div>
                `;
                continue;
            }
            const stats =
                this.getDateStats(
                    date
                );
            let status =
                "⚪";
            let bg =
                "bg-slate-50";
            if (
                stats.total > 0
            ) {
                if (
                    stats.percentage >=
                    90
                ) {
                    status = "🟢";
                    bg =
                        "bg-emerald-50 hover:bg-emerald-100";
                } else if (
                    stats.percentage >=
                    70
                ) {
                    status = "🟡";
                    bg =
                        "bg-yellow-50 hover:bg-yellow-100";
                } else if (
                    stats.done > 0
                ) {
                    status = "🔴";
                    bg =
                        "bg-red-50 hover:bg-red-100";
                } else {
                    status = "🔴";
                    bg =
                        "bg-red-50 hover:bg-red-100";
                }
            }
            html += `
                <button
                    type="button"
                    onclick="WaliJurnal7Kaih.openDateModal('${date}')"
                    class="aspect-square
                           rounded-xl
                           ${bg}
                           flex
                           flex-col
                           items-center
                           justify-center
                           text-xs
                           transition"
                >
                    <span
                        class="font-semibold
                               text-slate-700"
                    >
                        ${day}
                    </span>
                    <span class="mt-1">
                        ${status}
                    </span>
                    <span
                        class="text-[9px]
                               text-slate-400
                               mt-0.5"
                    >
                        ${stats.done}/${stats.total}
                    </span>
                </button>
            `;
        }
        container.innerHTML =
            html;
    },
    // =====================================================
    // WARNING SISWA BELUM MENGISI
    // =====================================================
    renderWarnings() {
        const container =
            document.getElementById(
                "wali-jurnal-warning-list"
            );
        const count =
            document.getElementById(
                "wali-jurnal-warning-count"
            );
        if (!container) {
            return;
        }
        const today =
            this.getLocalDate();
        // =============================================
        // TANGGAL TIDAK AKTIF
        // =============================================
        if (
            !this.isJournalDateActive(
                today
            )
        ) {
            if (count) {
                count.textContent =
                    "Tidak berlaku";
            }
            container.innerHTML = `
                <div
                    class="text-center
                           py-6
                           text-slate-400"
                >
                    <div class="text-3xl mb-2">
                        📅
                    </div>
                    <p class="font-medium">
                        Jurnal tidak berlaku hari ini.
                    </p>
                    <p
                        class="text-xs
                               mt-1"
                    >
                        ${
                            today <
                            JURNAL_START_DATE
                                ? "Jurnal 7 KAIH belum dimulai."
                                : "Hari Minggu tidak perlu mengisi jurnal."
                        }
                    </p>
                </div>
            `;
            return;
        }
        // =============================================
        // CARI SISWA BELUM MENGISI
        // =============================================
        const missing =
            this.students.filter(
                student =>
                    !this.isComplete(
                        this.getJournal(
                            student.username,
                            today
                        )
                    )
            );
        if (count) {
            count.textContent =
                `${missing.length} siswa`;
        }
        if (!missing.length) {
            container.innerHTML = `
                <div
                    class="text-center
                           py-6
                           text-slate-400"
                >
                    <div class="text-3xl mb-2">
                        🎉
                    </div>
                    <p class="font-medium">
                        Semua siswa sudah mengisi jurnal hari ini.
                    </p>
                </div>
            `;
            return;
        }
        container.innerHTML =
            missing
                .map(
                    student => `
                        <div
                            class="flex
                                   items-center
                                   justify-between
                                   gap-3
                                   border
                                   rounded-xl
                                   p-3"
                        >
                            <div class="min-w-0">
                                <p
                                    class="font-semibold
                                           text-slate-800
                                           truncate"
                                >
                                    ${this.escapeHtml(
                                        student.nama_lengkap ||
                                        student.username
                                    )}
                                </p>
                                <p
                                    class="text-xs
                                           text-slate-500"
                                >
                                    ${this.escapeHtml(
                                        student.kategori ||
                                        "-"
                                    )}
                                </p>
                            </div>
                            <button
                                type="button"
                                onclick="WaliJurnal7Kaih.openStudent('${this.escapeAttribute(student.username)}')"
                                class="text-xs
                                       font-semibold
                                       text-indigo-600
                                       shrink-0"
                            >
                                Detail →
                            </button>
                        </div>
                    `
                )
                .join("");
    },
    // =====================================================
    // FILTER
    // =====================================================
    setFilter(filter) {
        this.filter =
            filter;
        document
            .querySelectorAll(
                "[data-wali-filter]"
            )
            .forEach(
                button => {
                    const active =
                        button.dataset
                            .waliFilter ===
                        filter;
                    button.classList.toggle(
                        "bg-indigo-600",
                        active
                    );
                    button.classList.toggle(
                        "text-white",
                        active
                    );
                    button.classList.toggle(
                        "bg-slate-100",
                        !active
                    );
                    button.classList.toggle(
                        "text-slate-600",
                        !active
                    );
                }
            );
        this.renderStudents();
    },
    // =====================================================
    // RENDER DAFTAR SISWA
    // =====================================================
    renderStudents() {
        const container =
            document.getElementById(
                "wali-jurnal-student-list"
            );
        if (!container) {
            return;
        }
        const today =
            this.getLocalDate();
        let students =
            [...this.students];
        students =
            students.map(
                student => {
                    const journal =
                        this.getJournal(
                            student.username,
                            today
                        );
                    return {
                        ...student,
                        journal,
                        complete:
                            this.isComplete(
                                journal
                            ),
                        streak:
                            this.calculateStreak(
                                student.username
                            )
                    };
                }
            );
        if (
            this.filter ===
            "done"
        ) {
            students =
                students.filter(
                    student =>
                        student.complete
                );
        }
        if (
            this.filter ===
            "missing"
        ) {
            students =
                students.filter(
                    student =>
                        !student.complete
                );
        }
        if (!students.length) {
            container.innerHTML = `
                <div
                    class="md:col-span-2
                           text-center
                           py-8
                           text-slate-400"
                >
                    Tidak ada siswa pada filter ini.
                </div>
            `;
            return;
        }
        container.innerHTML =
            students
                .map(
                    student => `
                        <div
                            class="border
                                   rounded-2xl
                                   p-4
                                   hover:bg-slate-50
                                   transition"
                        >
                            <div
                                class="flex
                                       items-start
                                       justify-between
                                       gap-3"
                            >
                                <div
                                    class="min-w-0"
                                >
                                    <p
                                        class="font-bold
                                               text-slate-800
                                               truncate"
                                    >
                                        ${this.escapeHtml(
                                            student.nama_lengkap ||
                                            student.username
                                        )}
                                    </p>
                                    <p
                                        class="text-xs
                                               text-slate-500
                                               mt-1"
                                    >
                                        ${this.escapeHtml(
                                            student.kategori ||
                                            "-"
                                        )}
                                    </p>
                                </div>
                                <span
                                    class="text-xs
                                           font-semibold
                                           ${
                                                student.complete
                                                    ? "text-emerald-600 bg-emerald-50"
                                                    : "text-red-600 bg-red-50"
                                           }
                                           px-2.5
                                           py-1
                                           rounded-full
                                           shrink-0"
                                >
                                    ${
                                        student.complete
                                            ? "✓ Sudah"
                                            : "Belum"
                                    }
                                </span>
                            </div>
                            <div
                                class="flex
                                       flex-wrap
                                       gap-3
                                       mt-3
                                       text-xs
                                       text-slate-500"
                            >
                                <span>
                                    🔥 Streak
                                    ${student.streak}
                                    hari
                                </span>
                                <span>
                                    ${
                                        student.journal
                                            ? `
                                                🌅
                                                ${this.escapeHtml(
                                                    student.journal.bangun ||
                                                    "-"
                                                )}
                                            `
                                            : "📖 Belum ada jurnal"
                                    }
                                </span>
                            </div>
                            <button
                                type="button"
                                onclick="WaliJurnal7Kaih.openStudent('${this.escapeAttribute(student.username)}')"
                                class="mt-3
                                       text-sm
                                       font-semibold
                                       text-indigo-600"
                            >
                                Lihat Detail
                                <i
                                    class="fas
                                           fa-arrow-right
                                           ml-1"
                                ></i>
                            </button>
                        </div>
                    `
                )
                .join("");
    },
    // =====================================================
    // STREAK
    // =====================================================
    calculateStreak(
        username
    ) {
        const dates =
            this.journals
                .filter(
                    journal =>
                        journal.username ===
                            username &&
                        this.isComplete(
                            journal
                        )
                )
                .map(
                    journal =>
                        journal.tanggal
                )
                .filter(
                    date =>
                        this.isJournalDateActive(
                            date
                        )
                )
                .sort(
                    (a, b) =>
                        b.localeCompare(a)
                );
        if (!dates.length) {
            return 0;
        }
        let current =
            this.getLocalDate();
        // Jika hari ini belum ada,
        // mulai dari hari jurnal sebelumnya.
        if (
            !dates.includes(
                current
            )
        ) {
            current =
                this.getPreviousJournalDate(
                    current
                );
        }
        let streak = 0;
        while (
            dates.includes(
                current
            )
        ) {
            streak++;
            current =
                this.getPreviousJournalDate(
                    current
                );
        }
        return streak;
    },
    // =====================================================
    // TANGGAL JURNAL SEBELUMNYA
    // MINGGU DILEWATI
    // =====================================================
    getPreviousJournalDate(
        dateString
    ) {
        const date =
            new Date(
                dateString +
                "T00:00:00"
            );
        date.setDate(
            date.getDate() - 1
        );
        while (
            date.getDay() === 0
        ) {
            date.setDate(
                date.getDate() - 1
            );
        }
        const year =
            date.getFullYear();
        const month =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            );
        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            );
        return `${year}-${month}-${day}`;
    },
    // =====================================================
    // MODAL PER TANGGAL
    // =====================================================
    openDateModal(
        date
    ) {
        if (
            !this.isJournalDateActive(
                date
            )
        ) {
            return;
        }
        const modal =
            document.getElementById(
                "modal-wali-jurnal-tanggal"
            );
        if (!modal) {
            return;
        }
        const students =
            this.students.map(
                student => {
                    const journal =
                        this.getJournal(
                            student.username,
                            date
                        );
                    return {
                        ...student,
                        journal,
                        complete:
                            this.isComplete(
                                journal
                            )
                    };
                }
            );
        const done =
            students.filter(
                item =>
                    item.complete
            );
        const missing =
            students.filter(
                item =>
                    !item.complete
            );
        const dateElement =
            document.getElementById(
                "wali-jurnal-modal-date"
            );
        const doneElement =
            document.getElementById(
                "wali-date-done"
            );
        const missingElement =
            document.getElementById(
                "wali-date-missing"
            );
        const listElement =
            document.getElementById(
                "wali-jurnal-date-list"
            );
        if (dateElement) {
            dateElement.textContent =
                this.formatDateLong(
                    date
                );
        }
        if (doneElement) {
            doneElement.textContent =
                done.length;
        }
        if (missingElement) {
            missingElement.textContent =
                missing.length;
        }
        if (listElement) {
            listElement.innerHTML =
                students
                    .map(
                        student => `
                            <div
                                class="flex
                                       items-center
                                       justify-between
                                       gap-3
                                       border
                                       rounded-xl
                                       p-3"
                            >
                                <div
                                    class="min-w-0"
                                >
                                    <p
                                        class="font-semibold
                                               text-sm
                                               text-slate-800
                                               truncate"
                                    >
                                        ${this.escapeHtml(
                                            student.nama_lengkap ||
                                            student.username
                                        )}
                                    </p>
                                    <p
                                        class="text-xs
                                               text-slate-500"
                                    >
                                        ${this.escapeHtml(
                                            student.kategori ||
                                            "-"
                                        )}
                                    </p>
                                </div>
                                <div
                                    class="flex
                                           items-center
                                           gap-2
                                           shrink-0"
                                >
                                    <span>
                                        ${
                                            student.complete
                                                ? "🟢"
                                                : "🔴"
                                        }
                                    </span>
                                    ${
                                        student.journal
                                            ? `
                                                <button
                                                    type="button"
                                                    onclick="WaliJurnal7Kaih.openJournalDetail('${this.escapeAttribute(student.journal.id)}')"
                                                    class="text-xs
                                                           font-semibold
                                                           text-indigo-600"
                                                >
                                                    Detail
                                                </button>
                                            `
                                            : ""
                                    }
                                </div>
                            </div>
                        `
                    )
                    .join("");
        }
        modal.classList.remove(
            "hidden"
        );
        modal.classList.add(
            "flex"
        );
        document.body.classList.add(
            "overflow-hidden"
        );
    },
    // =====================================================
    // OPEN DETAIL SISWA
    // =====================================================
    openStudent(
        username
    ) {
        const student =
            this.students.find(
                item =>
                    item.username ===
                    username
            );
        if (!student) {
            return;
        }
        const today =
            this.getLocalDate();
        const journal =
            this.getJournal(
                username,
                today
            );
        if (journal) {
            this.openJournalDetail(
                journal.id
            );
            return;
        }
        this.openDateModal(
            today
        );
    },
    // =====================================================
    // OPEN DETAIL JURNAL
    // =====================================================
    openJournalDetail(
        id
    ) {
        const journal =
            this.journals.find(
                item =>
                    String(item.id) ===
                    String(id)
            );
        if (!journal) {
            return;
        }
        const student =
            this.students.find(
                item =>
                    item.username ===
                    journal.username
            );
        const namaElement =
            document.getElementById(
                "wali-detail-nama"
            );
        const tanggalElement =
            document.getElementById(
                "wali-detail-tanggal"
            );
        const bangunElement =
            document.getElementById(
                "wali-detail-bangun"
            );
        const ibadahElement =
            document.getElementById(
                "wali-detail-ibadah"
            );
        const olahragaElement =
            document.getElementById(
                "wali-detail-olahraga"
            );
        const makanElement =
            document.getElementById(
                "wali-detail-makan"
            );
        const gemarElement =
            document.getElementById(
                "wali-detail-gemar"
            );
        const bermasyarakatElement =
            document.getElementById(
                "wali-detail-bermasyarakat"
            );
        const tidurElement =
            document.getElementById(
                "wali-detail-tidur"
            );
        if (namaElement) {
            namaElement.textContent =
                student?.nama_lengkap ||
                journal.nama_lengkap ||
                journal.username;
        }
        if (tanggalElement) {
            tanggalElement.textContent =
                this.formatDateLong(
                    journal.tanggal
                );
        }
        if (bangunElement) {
            bangunElement.textContent =
                journal.bangun ||
                "-";
        }
        if (ibadahElement) {
            ibadahElement.textContent =
                `${journal.ibadah ?? 0} kali`;
        }
        if (olahragaElement) {
            olahragaElement.textContent =
                `${journal.olahraga ?? 0} menit`;
        }
        if (makanElement) {
            makanElement.textContent =
                journal.makan ||
                "-";
        }
        if (gemarElement) {
            gemarElement.textContent =
                journal.gemar ||
                "-";
        }
        if (bermasyarakatElement) {
            bermasyarakatElement.textContent =
                journal.bermasyarakat ||
                "-";
        }
        if (tidurElement) {
            tidurElement.textContent =
                journal.tidur ||
                "-";
        }
        const modal =
            document.getElementById(
                "modal-wali-jurnal-detail"
            );
        if (!modal) {
            return;
        }
        modal.classList.remove(
            "hidden"
        );
        modal.classList.add(
            "flex"
        );
        document.body.classList.add(
            "overflow-hidden"
        );
    },
    // =====================================================
    // CLOSE MODAL TANGGAL
    // =====================================================
    closeDateModal() {
        const modal =
            document.getElementById(
                "modal-wali-jurnal-tanggal"
            );
        if (!modal) {
            return;
        }
        modal.classList.add(
            "hidden"
        );
        modal.classList.remove(
            "flex"
        );
        document.body.classList.remove(
            "overflow-hidden"
        );
    },
    // =====================================================
    // CLOSE MODAL DETAIL
    // =====================================================
    closeDetailModal() {
        const modal =
            document.getElementById(
                "modal-wali-jurnal-detail"
            );
        if (!modal) {
            return;
        }
        modal.classList.add(
            "hidden"
        );
        modal.classList.remove(
            "flex"
        );
        document.body.classList.remove(
            "overflow-hidden"
        );
    },
    // =====================================================
    // BULAN SEBELUMNYA
    // =====================================================
    previousMonth() {
        this.currentMonth.setMonth(
            this.currentMonth.getMonth() - 1
        );
        this.renderCalendar();
    },
    // =====================================================
    // BULAN BERIKUTNYA
    // =====================================================
    nextMonth() {
        this.currentMonth.setMonth(
            this.currentMonth.getMonth() + 1
        );
        this.renderCalendar();
    },
    // =====================================================
    // EMPTY STATE
    // =====================================================
    showEmpty(
        message
    ) {
        const container =
            document.getElementById(
                "wali-jurnal-student-list"
            );
        if (container) {
            container.innerHTML = `
                <div
                    class="md:col-span-2
                           text-center
                           py-8
                           text-slate-400"
                >
                    ${this.escapeHtml(
                        message
                    )}
                </div>
            `;
        }
    },
    // =====================================================
    // ESCAPE HTML
    // =====================================================
    escapeHtml(
        value
    ) {
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
    escapeAttribute(
        value
    ) {
        return this.escapeHtml(
            value
        );
    }
};