const KepsekKetepatanWaktu = {
	students: [],
	absensi: [],
	attendanceMap: new Map(),
	studentMap: new Map(),
	hariLibur: [],
	kalenderIndustri: null,
	currentMonth: new Date(),
	mode: "X",
	filter: "all",
	classFilter: "all",
	viewMode: "daily",
	initialized: false,
	startDate: "2026-07-20",
	locationId: "L001",
	async init() {
		const user = AppState.currentUser;
		if (!user) return;
		if (!this.isKepalaSekolah()) return;
		this.currentMonth = new Date();
		this.currentMonth.setDate(1);
		this.mode = "X";
		this.filter = "all";
		this.classFilter = "all";
		this.viewMode = "daily";
		this.setupEvents();
		await this.load();
		this.setViewMode("daily");
	},
	isKepalaSekolah() {
		const user = AppState.currentUser;
		if (!user) return false;
		const role = String(user.role || "").trim().toLowerCase();
		return role === "kepala sekolah" || role === "kepala_sekolah" || role === "kepsek" || role === "kepala";
	},
	async load() {
		try {
			showLoader("Memuat monitoring ketepatan waktu...");
			const user = AppState.currentUser;
			if (!user) return;
			if (!this.isKepalaSekolah()) return;
			await this.loadStudents();
			await this.loadKalenderIndustri();
			await this.loadHariLibur();
			await this.loadAbsensi();
			this.buildAttendanceMap();
			this.renderAll();
			this.initialized = true;
		} catch (error) {
			console.error("KepsekKetepatanWaktu.load:", error);
			Swal.fire({
				icon: "error",
				title: "Gagal Memuat",
				text: error.message || "Data ketepatan waktu gagal dimuat."
			});
		} finally {
			hideLoader();
		}
	},
	async loadStudents() {
		const { data, error } = await window.supabaseClient
			.from("users")
			.select("username,nama_lengkap,kategori,role,sesi")
			.eq("role", "siswa");
		if (error) throw error;
		this.students = (data || []).filter(student => {
			const kategori = String(student.kategori || "").trim().toUpperCase();
			return kategori.startsWith("X ") || kategori.startsWith("XI ");
		});
		this.students.sort((a, b) => {
			return String(a.kategori || "").localeCompare(String(b.kategori || ""), "id") ||
				String(a.nama_lengkap || "").localeCompare(String(b.nama_lengkap || ""), "id");
		});
		this.studentMap = new Map();
		this.students.forEach(student => {
			if (student.username) {
				this.studentMap.set(String(student.username), student);
			}
		});
        console.log("TOTAL SISWA X:", this.students.filter(student =>
            String(student.kategori || "").trim().toUpperCase().startsWith("X ")
        ).length);

        console.log("TOTAL SISWA XI:", this.students.filter(student =>
            String(student.kategori || "").trim().toUpperCase().startsWith("XI ")
        ).length);

        console.log(
            "TOTAL SISWA X + XI:",
            this.students.length
        );
	},
	async loadKalenderIndustri() {
		const { data, error } = await window.supabaseClient
			.from("kalender_industri")
			.select("id,lokasi_id,nama_industri,senin,selasa,rabu,kamis,jumat,sabtu,minggu,aktif")
			.eq("lokasi_id", this.locationId)
			.eq("aktif", true)
			.limit(1)
			.maybeSingle();
		if (error) throw error;
		this.kalenderIndustri = data || null;
	},
	async loadHariLibur() {
		const { data, error } = await window.supabaseClient
			.from("hari_libur")
			.select("id,tanggal,nama_libur,jenis,berlaku")
			.or(`berlaku.eq.${this.locationId},berlaku.eq.semua,berlaku.is.null`)
			.order("tanggal", { ascending: true });
		if (error) throw error;
		this.hariLibur = data || [];
	},
	async loadAbsensi() {
        const usernames = this.students.map(student => student.username).filter(Boolean);
        if (!usernames.length) {
            this.absensi = [];
            return;
        }
        const allData = [];
        const pageSize = 1000;
        let from = 0;
        while (true) {
            const { data, error } = await window.supabaseClient
                .from("absensi")
                .select("id,waktu,username,nama_lengkap,kategori,lokasi_id,tipe")
                .eq("lokasi_id", this.locationId)
                .eq("tipe", "Masuk")
                .gte("waktu", "2026-07-19T16:00:00.000Z")
                .in("username", usernames)
                .order("waktu", { ascending: true })
                .range(from, from + pageSize - 1);
            if (error) throw error;
            if (!data || !data.length) break;
            allData.push(...data);
            if (data.length < pageSize) break;
            from += pageSize;
        }
        this.absensi = allData;
        // console.log("TOTAL ABSENSI:", this.absensi.length);
        // console.log("WAKTU TERAKHIR:", this.absensi.slice(-5).map(item => item.waktu));
        // console.log("WITA DATE TERAKHIR:", this.absensi.slice(-5).map(item => this.getWitaDate(item.waktu)));
        // console.log("ABSENSI 22 AGUSTUS:", this.absensi.filter(item => this.getWitaDate(item.waktu) === "2026-08-22"));
    },
	buildAttendanceMap() {
        this.studentMap = new Map();
        this.students.forEach(student => {
            if (student.username) {
                this.studentMap.set(String(student.username), student);
            }
        });
        this.attendanceMap = new Map();
        this.absensi.forEach(absensi => {
            const username = String(absensi.username || "");
            if (!username) return;
            const student = this.studentMap.get(username);
            if (!student) return;
            const date = this.getWitaDate(absensi.waktu);
            if (!date || date < this.startDate) return;
            const key = `${username}_${date}`;
            if (this.attendanceMap.has(key)) return;
            const waktu = this.getWitaTime(absensi.waktu);
            const session = this.getSession(student);
            const deadline = this.getDeadline(student);
            const actualMinutes = this.getTimeMinutes(waktu);
            const deadlineMinutes = this.getDeadlineMinutes(student);
            let statusKetepatan = "Belum Absen";
            if (actualMinutes !== null) {
                statusKetepatan = actualMinutes <= deadlineMinutes ? "Tepat Waktu" : "Terlambat";
            }
            this.attendanceMap.set(key, {
                ...absensi,
                username: student.username,
                nama_lengkap: student.nama_lengkap || absensi.nama_lengkap,
                kategori: student.kategori || absensi.kategori,
                sesi: student.sesi || null,
                tanggal: date,
                waktu_wita: waktu,
                batas_waktu: deadline,
                status_ketepatan: statusKetepatan
            });
        });
        // console.log("TOTAL ATTENDANCE MAP X + XI:", this.attendanceMap.size);

        // const attendance22 = [...this.attendanceMap.values()]
        //     .filter(item => item.tanggal === "2026-08-22");

        // const attendance22X = attendance22.filter(item => {
        //     const kategori = String(item.kategori || "").trim().toUpperCase();
        //     return kategori.startsWith("X ");
        // });

        // const attendance22XI = attendance22.filter(item => {
        //     const kategori = String(item.kategori || "").trim().toUpperCase();
        //     return kategori.startsWith("XI ");
        // });
        // const duplicateMap = new Map();

        // this.absensi.forEach(item => {
        //     const date = this.getWitaDate(item.waktu);
        //     const key = `${item.username}_${date}`;

        //     duplicateMap.set(key, (duplicateMap.get(key) || 0) + 1);
        // });

        // const duplicates = [...duplicateMap.entries()]
        //     .filter(([key, count]) => count > 1);

        // console.log("DUPLIKAT ABSENSI SISWA/TANGGAL:", duplicates);
        // console.log(
        //     "JUMLAH RECORD DUPLIKAT:",
        //     duplicates.reduce((total, [, count]) => total + (count - 1), 0)
        // );

        // console.log("ATTENDANCE 22 AGUSTUS X + XI:", attendance22.length);
        // console.log("ATTENDANCE 22 AGUSTUS X:", attendance22X.length);
        // console.log("ATTENDANCE 22 AGUSTUS XI:", attendance22XI.length);
        
    },
    
	getWitaDate(value) {
		if (!value) return null;
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return null;
		const parts = new Intl.DateTimeFormat("en-CA", {
			timeZone: "Asia/Makassar",
			year: "numeric",
			month: "2-digit",
			day: "2-digit"
		}).formatToParts(date);
		const result = {};
		parts.forEach(part => {
			if (part.type !== "literal") result[part.type] = part.value;
		});
		return `${result.year}-${result.month}-${result.day}`;
	},
	getWitaTime(value) {
		if (!value) return null;
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return null;
		return new Intl.DateTimeFormat("en-GB", {
			timeZone: "Asia/Makassar",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false
		}).format(date);
	},
	getLocalDate(offsetDays = 0) {
		const now = new Date();
		const parts = new Intl.DateTimeFormat("en-CA", {
			timeZone: "Asia/Makassar",
			year: "numeric",
			month: "2-digit",
			day: "2-digit"
		}).formatToParts(now);
		const values = {};
		parts.forEach(part => {
			if (part.type !== "literal") values[part.type] = part.value;
		});
		const date = new Date(Number(values.year), Number(values.month) - 1, Number(values.day));
		date.setDate(date.getDate() + offsetDays);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	},
	formatDateLong(value) {
		if (!value) return "-";
		const [year, month, day] = value.split("-");
		const date = new Date(Number(year), Number(month) - 1, Number(day));
		return date.toLocaleDateString("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric"
		});
	},
	formatTime(value) {
		return this.getWitaTime(value) || "-";
	},
	getSession(student) {
		const sesi = String(student?.sesi || "").trim().toLowerCase();
		return sesi === "siang" ? "Siang" : "Pagi";
	},
	getDeadline(student) {
		return this.getSession(student) === "Siang" ? "12:30:00" : "07:30:00";
	},
	getDeadlineMinutes(student) {
		return this.getSession(student) === "Siang" ? 750 : 450;
	},
	getTimeMinutes(value) {
		if (!value) return null;
		const time = String(value).substring(0, 8);
		const parts = time.split(":").map(Number);
		if (parts.length < 2 || parts.some(Number.isNaN)) return null;
		return parts[0] * 60 + parts[1];
	},
	getAttendance(username, date) {
		const attendance = this.attendanceMap.get(`${username}_${date}`);
		if (attendance) return attendance;
		const student = this.studentMap.get(String(username));
		return {
			username,
			tanggal: date,
			sesi: student?.sesi || null,
			status_ketepatan: "Belum Absen"
		};
	},
	getHoliday(date) {
		return this.hariLibur.find(item => {
			if (item.tanggal !== date) return false;
			const berlaku = String(item.berlaku || "").trim().toLowerCase();
			return berlaku === this.locationId.toLowerCase() || berlaku === "semua" || berlaku === "all" || !berlaku;
		}) || null;
	},
	isHariAktif(date) {
		if (!date || date < this.startDate) return false;
		const [year, month, day] = date.split("-").map(Number);
		const dateObj = new Date(year, month - 1, day);
		const dayIndex = dateObj.getDay();
		if (dayIndex === 0) return false;
		if (this.getHoliday(date)) return false;
		if (!this.kalenderIndustri) return true;
		const dayFields = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
		const field = dayFields[dayIndex];
		return this.kalenderIndustri[field] === true;
	},
	isActiveDate(date) {
		return this.isHariAktif(date);
	},
	getAttendanceStatus(student, date) {
		if (!student || !date) {
			return {
				status: "Belum Absen",
				attendance: null,
				session: "-",
				deadline: "-"
			};
		}
		if (!this.isHariAktif(date)) {
			return {
				status: "Tidak Aktif",
				attendance: null,
				session: this.getSession(student),
				deadline: this.getDeadline(student)
			};
		}
		const attendance = this.attendanceMap.get(`${student.username}_${date}`);
		const session = this.getSession(student);
		const deadline = this.getDeadline(student);
		if (!attendance) {
			return {
				status: "Belum Absen",
				attendance: null,
				session,
				deadline,
				time: null
			};
		}
		const time = attendance.waktu_wita || this.getWitaTime(attendance.waktu);
		const actualMinutes = this.getTimeMinutes(time);
		const deadlineMinutes = this.getDeadlineMinutes(student);
		return {
			status: actualMinutes !== null && actualMinutes <= deadlineMinutes ? "Tepat Waktu" : "Terlambat",
			attendance,
			session,
			deadline,
			time
		};
	},
	getActiveDatesInMonth() {
		const year = this.currentMonth.getFullYear();
		const month = this.currentMonth.getMonth();
		const totalDays = new Date(year, month + 1, 0).getDate();
		const today = this.getLocalDate();
		const dates = [];
		for (let day = 1; day <= totalDays; day++) {
			const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
			if (date > today) continue;
			if (this.isHariAktif(date)) dates.push(date);
		}
		return dates;
	},
	getModeStudents() {
		return this.students.filter(student => {
			const kategori = String(student.kategori || "").trim().toUpperCase();
			if (this.mode === "X") return kategori.startsWith("X ");
			if (this.mode === "XI") return kategori.startsWith("XI ");
			return false;
		});
	},
	getStudentsByMode() {
		return this.getModeStudents();
	},
	getFilteredStudents() {
		let students = [...this.getModeStudents()];
		if (this.classFilter !== "all") {
			students = students.filter(student => String(student.kategori || "").trim() === String(this.classFilter).trim());
		}
		return students;
	},
	getFilteredStudentsByDate(date) {
		let students = this.getModeStudents().map(student => {
			const result = this.getAttendanceStatus(student, date);
			return {
				...student,
				attendance: result.attendance,
				status: result.status,
				session: result.session,
				deadline: result.deadline,
				time: result.time
			};
		});
		if (this.classFilter !== "all") {
			students = students.filter(student => String(student.kategori || "").trim() === String(this.classFilter).trim());
		}
		if (this.filter === "tepat") {
			students = students.filter(student => student.status === "Tepat Waktu");
		} else if (this.filter === "terlambat") {
			students = students.filter(student => student.status === "Terlambat");
		} else if (this.filter === "belum") {
			students = students.filter(student => student.status === "Belum Absen");
		}
		return students;
	},
	getDateStats(date) {
        const students = this.getStudentsByMode();
        if (!this.isActiveDate(date)) {
            return {
                date,
                total: students.length,
                tepatWaktu: 0,
                terlambat: 0,
                belumAbsen: 0,
                sudahAbsen: 0,
                percentage: 0,
                aktif: false
            };
        }
        let tepatWaktu = 0;
        let terlambat = 0;
        let belumAbsen = 0;
        students.forEach(student => {
            const result = this.getAttendanceStatus(student, date);
            if (result.status === "Tepat Waktu") {
                tepatWaktu++;
            } else if (result.status === "Terlambat") {
                terlambat++;
            } else {
                belumAbsen++;
            }
        });
        const total = students.length;
        const sudahAbsen = tepatWaktu + terlambat;
        const percentage = total ? Math.round((tepatWaktu / total) * 100) : 0;
        return {
            date,
            total,
            tepatWaktu,
            terlambat,
            belumAbsen,
            sudahAbsen,
            percentage,
            aktif: true
        };
    },
	getClassDateStats(category, date) {
		const students = this.getModeStudents().filter(student => student.kategori === category);
		let tepat = 0;
		let terlambat = 0;
		let belum = 0;
		students.forEach(student => {
			const result = this.getAttendanceStatus(student, date);
			if (result.status === "Tepat Waktu") tepat++;
			else if (result.status === "Terlambat") terlambat++;
			else if (result.status === "Belum Absen") belum++;
		});
		const total = students.length;
		const sudahAbsen = tepat + terlambat;
		const percentage = total ? Math.round((tepat / total) * 100) : 0;
		return {
			category,
			date,
			total,
			tepatWaktu: tepat,
			terlambat,
			belumAbsen: belum,
			sudahAbsen,
			percentage
		};
	},
	getMonthlyStudentStats(username) {
		const dates = this.getActiveDatesInMonth();
		const student = this.studentMap.get(String(username));
		let tepat = 0;
		let terlambat = 0;
		let belum = 0;
		dates.forEach(date => {
			const result = this.getAttendanceStatus(student, date);
			if (result.status === "Tepat Waktu") tepat++;
			else if (result.status === "Terlambat") terlambat++;
			else if (result.status === "Belum Absen") belum++;
		});
		const total = dates.length;
		const percentage = total ? Math.round((tepat / total) * 100) : 0;
		return {
			total,
			tepat,
			terlambat,
			belum,
			percentage
		};
	},
	getMonthlyStats() {
		const students = this.getFilteredStudents();
		const dates = this.getActiveDatesInMonth();
		let tepat = 0;
		let terlambat = 0;
		let belum = 0;
		students.forEach(student => {
			dates.forEach(date => {
				const result = this.getAttendanceStatus(student, date);
				if (result.status === "Tepat Waktu") tepat++;
				else if (result.status === "Terlambat") terlambat++;
				else if (result.status === "Belum Absen") belum++;
			});
		});
		const total = tepat + terlambat + belum;
		const percentage = total ? Math.round((tepat / total) * 100) : 0;
		return {
			students: students.length,
			activeDays: dates.length,
			tepat,
			terlambat,
			belum,
			total,
			percentage
		};
	},
	getMonthlyClassStats(category) {
		const students = this.getModeStudents().filter(student => student.kategori === category);
		const dates = this.getActiveDatesInMonth();
		let tepat = 0;
		let terlambat = 0;
		let belum = 0;
		students.forEach(student => {
			dates.forEach(date => {
				const result = this.getAttendanceStatus(student, date);
				if (result.status === "Tepat Waktu") tepat++;
				else if (result.status === "Terlambat") terlambat++;
				else if (result.status === "Belum Absen") belum++;
			});
		});
		const total = tepat + terlambat + belum;
		return {
			students: students.length,
			activeDays: dates.length,
			tepat,
			terlambat,
			belum,
			total,
			percentage: total ? Math.round((tepat / total) * 100) : 0
		};
	},
	renderAll() {
		this.renderModeButtons();
		this.renderViewButtons();
		this.renderClassFilter();
		this.renderDaily();
		this.renderMonthly();
	},
	renderModeButtons() {
		document.querySelectorAll("[data-kepsek-ketepatan-mode]").forEach(button => {
			const active = button.dataset.kepsekKetepatanMode === this.mode;
			button.classList.toggle("bg-indigo-600", active);
			button.classList.toggle("text-white", active);
			button.classList.toggle("bg-slate-100", !active);
			button.classList.toggle("text-slate-600", !active);
		});
	},
	renderViewButtons() {
		document.querySelectorAll("[data-kepsek-ketepatan-view-mode]").forEach(button => {
			const active = button.dataset.kepsekKetepatanViewMode === this.viewMode;
			button.classList.toggle("bg-indigo-600", active);
			button.classList.toggle("text-white", active);
			button.classList.toggle("bg-slate-100", !active);
			button.classList.toggle("text-slate-600", !active);
		});
	},
	renderClassFilter() {
		const select = document.getElementById("kepsek-ketepatan-filter-kelas");
		if (!select) return;
		const students = this.getModeStudents();
		const categories = [...new Set(students.map(student => String(student.kategori || "").trim()).filter(Boolean))]
			.sort((a, b) => a.localeCompare(b, "id"));
		if (this.classFilter !== "all" && !categories.includes(this.classFilter)) {
			this.classFilter = "all";
		}
		select.innerHTML = `
			<option value="all">Semua Kelas</option>
			${categories.map(category => `
				<option value="${this.escapeAttribute(category)}">${this.escapeHtml(category)}</option>
			`).join("")}
		`;
		select.value = this.classFilter;
	},
	renderDaily() {
		this.renderSummary();
		this.renderClassSummary();
		this.renderCalendar();
		this.renderStudents();
	},
	renderSummary() {
		const today = this.getLocalDate();
		const stats = this.getDateStats(today);
		const totalElement = document.getElementById("kepsek-ketepatan-total-siswa");
		const tepatElement = document.getElementById("kepsek-ketepatan-tepat");
		const terlambatElement = document.getElementById("kepsek-ketepatan-terlambat");
		const belumElement = document.getElementById("kepsek-ketepatan-belum");
		const percentageElement = document.getElementById("kepsek-ketepatan-persentase");
		const progressElement = document.getElementById("kepsek-ketepatan-progress");
		if (totalElement) totalElement.textContent = stats.total;
		if (tepatElement) tepatElement.textContent = stats.tepatWaktu;
		if (terlambatElement) terlambatElement.textContent = stats.terlambat;
		if (belumElement) belumElement.textContent = stats.belumAbsen;
		if (percentageElement) percentageElement.textContent = `${stats.percentage}%`;
		if (progressElement) progressElement.style.width = `${stats.percentage}%`;
	},
	renderClassSummary() {
		const container = document.getElementById("kepsek-ketepatan-class-summary");
		if (!container) return;
		const today = this.getLocalDate();
		const students = this.getModeStudents();
		const categories = [...new Set(students.map(student => String(student.kategori || "").trim()).filter(Boolean))]
			.sort((a, b) => a.localeCompare(b, "id"));
		if (!categories.length) {
			container.innerHTML = `
				<div class="md:col-span-2 lg:col-span-3 text-center py-6 text-slate-400">
					Belum ada data kelas ${this.escapeHtml(this.mode)}.
				</div>
			`;
			return;
		}
		container.innerHTML = categories.map(category => {
			const classStudents = students.filter(student => String(student.kategori || "").trim() === category);
			let tepat = 0;
			let terlambat = 0;
			let belum = 0;
			classStudents.forEach(student => {
				const result = this.getAttendanceStatus(student, today);
				if (result.status === "Tepat Waktu") tepat++;
				else if (result.status === "Terlambat") terlambat++;
				else if (result.status === "Belum Absen") belum++;
			});
			const total = classStudents.length;
			const percentage = total ? Math.round((tepat / total) * 100) : 0;
			let badge = "bg-red-50 text-red-600";
			if (percentage >= 90) badge = "bg-emerald-50 text-emerald-600";
			else if (percentage >= 70) badge = "bg-yellow-50 text-yellow-600";
			return `
				<button type="button" onclick="KepsekKetepatanWaktu.selectClass('${this.escapeAttribute(category)}')" class="text-left border rounded-2xl p-4 hover:bg-slate-50 transition">
					<div class="flex items-center justify-between gap-3">
						<div class="min-w-0">
							<p class="font-bold text-slate-800 truncate">${this.escapeHtml(category)}</p>
							<p class="text-xs text-slate-500 mt-1">${total} siswa · ${tepat} tepat · ${terlambat} terlambat</p>
						</div>
						<span class="${badge} px-2.5 py-1 rounded-full text-xs font-bold shrink-0">${percentage}%</span>
					</div>
					<div class="grid grid-cols-3 gap-2 mt-3">
						<div class="bg-emerald-50 rounded-xl p-2">
							<p class="text-[10px] text-slate-500">Tepat</p>
							<p class="text-sm font-bold text-emerald-600">${tepat}</p>
						</div>
						<div class="bg-red-50 rounded-xl p-2">
							<p class="text-[10px] text-slate-500">Terlambat</p>
							<p class="text-sm font-bold text-red-600">${terlambat}</p>
						</div>
						<div class="bg-orange-50 rounded-xl p-2">
							<p class="text-[10px] text-slate-500">Belum</p>
							<p class="text-sm font-bold text-orange-600">${belum}</p>
						</div>
					</div>
					<div class="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
						<div class="h-full bg-indigo-500 rounded-full" style="width:${percentage}%"></div>
					</div>
				</button>
			`;
		}).join("");
	},
	selectClass(category) {
		this.classFilter = String(category || "").trim() || "all";
		const select = document.getElementById("kepsek-ketepatan-filter-kelas");
		if (select) select.value = this.classFilter;
		this.renderSummary();
		this.renderCalendar();
		this.renderStudents();
		if (this.viewMode === "monthly") {
			this.renderMonthly();
		}
	},
	renderCalendar() {
		const container = document.getElementById("kepsek-ketepatan-calendar");
		const title = document.getElementById("kepsek-ketepatan-calendar-title");
		if (!container) return;
		const year = this.currentMonth.getFullYear();
		const month = this.currentMonth.getMonth();
		if (title) {
			title.textContent = this.currentMonth.toLocaleDateString("id-ID", {
				month: "long",
				year: "numeric"
			});
		}
		const firstDay = new Date(year, month, 1).getDay();
		const totalDays = new Date(year, month + 1, 0).getDate();
		const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
		let html = "";
		dayNames.forEach(day => {
			html += `<div class="text-center text-xs font-semibold text-slate-400 py-1">${day}</div>`;
		});
		for (let i = 0; i < firstDay; i++) {
			html += `<div></div>`;
		}
		for (let day = 1; day <= totalDays; day++) {
			const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
			const dateObj = new Date(year, month, day);
			const isSunday = dateObj.getDay() === 0;
			const holiday = this.getHoliday(date);
			const isFuture = date > this.getLocalDate();
			if (date < this.startDate || isSunday || holiday || isFuture || !this.isHariAktif(date)) {
				let label = "−";
				if (holiday) label = "Libur";
				else if (date < this.startDate) label = "−";
				else if (isFuture) label = "−";
				html += `
					<div class="aspect-square rounded-xl bg-slate-50 flex flex-col items-center justify-center text-xs opacity-60">
						<span class="font-semibold text-slate-400">${day}</span>
						<span class="mt-1 text-[9px]">${label}</span>
					</div>
				`;
				continue;
			}
			const stats = this.getDateStats(date);
			let status = "⚪";
			let bg = "bg-slate-50 hover:bg-slate-100";
			if (stats.total > 0) {
				if (stats.percentage >= 90) {
					status = "🟢";
					bg = "bg-emerald-50 hover:bg-emerald-100";
				} else if (stats.percentage >= 70) {
					status = "🟡";
					bg = "bg-yellow-50 hover:bg-yellow-100";
				} else if (stats.tepatWaktu > 0 || stats.terlambat > 0) {
					status = "🔴";
					bg = "bg-red-50 hover:bg-red-100";
				}
			}
			html += `
				<button type="button" onclick="KepsekKetepatanWaktu.openDateDetail('${date}')" class="aspect-square rounded-xl ${bg} flex flex-col items-center justify-center text-xs transition">
					<span class="font-semibold text-slate-700">${day}</span>
					<span class="mt-1">${status}</span>
					<span class="text-[9px] text-slate-400 mt-0.5">${stats.tepatWaktu}/${stats.total}</span>
				</button>
			`;
		}
		container.innerHTML = html;
	},
	setFilter(filter) {
		this.filter = filter;
		document.querySelectorAll("[data-kepsek-ketepatan-filter]").forEach(button => {
			const active = button.dataset.kepsekKetepatanFilter === filter;
			button.classList.toggle("bg-indigo-600", active);
			button.classList.toggle("text-white", active);
			button.classList.toggle("bg-slate-100", !active);
			button.classList.toggle("text-slate-600", !active);
		});
		this.renderStudents();
	},
	setClassFilter(category) {
		this.classFilter = String(category || "").trim() || "all";
		this.renderClassFilter();
		const select = document.getElementById("kepsek-ketepatan-filter-kelas");
		if (select) select.value = this.classFilter;
		this.renderSummary();
		this.renderCalendar();
		this.renderStudents();
		if (this.viewMode === "monthly") {
			this.renderMonthly();
		}
	},
	renderStudents() {
		const container = document.getElementById("kepsek-ketepatan-student-list");
		if (!container) return;
		const today = this.getLocalDate();
		let students = this.getFilteredStudents().map(student => {
			const result = this.getAttendanceStatus(student, today);
			return {
				...student,
				attendance: result.attendance,
				status: result.status,
				session: result.session,
				deadline: result.deadline,
				time: result.time
			};
		});
		if (this.filter === "tepat") students = students.filter(student => student.status === "Tepat Waktu");
		if (this.filter === "terlambat") students = students.filter(student => student.status === "Terlambat");
		if (this.filter === "belum") students = students.filter(student => student.status === "Belum Absen");
		if (!students.length) {
			container.innerHTML = `
				<div class="md:col-span-2 lg:col-span-3 text-center py-8 text-slate-400">
					Tidak ada siswa pada filter ini.
				</div>
			`;
			return;
		}
		container.innerHTML = students.map(student => {
			let badge = "text-orange-600 bg-orange-50";
			let icon = "🟠";
			if (student.status === "Tepat Waktu") {
				badge = "text-emerald-600 bg-emerald-50";
				icon = "🟢";
			} else if (student.status === "Terlambat") {
				badge = "text-red-600 bg-red-50";
				icon = "🔴";
			}
			return `
				<div class="border rounded-2xl p-4 hover:bg-slate-50 transition">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="font-bold text-slate-800 truncate">${this.escapeHtml(student.nama_lengkap || student.username)}</p>
							<p class="text-xs text-slate-500 mt-1">${this.escapeHtml(student.kategori || "-")}</p>
						</div>
						<span class="${badge} px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
							${icon} ${this.escapeHtml(student.status)}
						</span>
					</div>
					<div class="grid grid-cols-2 gap-2 mt-3 text-xs">
						<div class="bg-slate-50 rounded-xl p-2">
							<p class="text-slate-400">Sesi</p>
							<p class="font-semibold text-slate-700 mt-0.5">${this.escapeHtml(student.session)}</p>
						</div>
						<div class="bg-slate-50 rounded-xl p-2">
							<p class="text-slate-400">Batas</p>
							<p class="font-semibold text-slate-700 mt-0.5">${this.escapeHtml(student.deadline)}</p>
						</div>
					</div>
					<div class="flex items-center justify-between gap-3 mt-3 text-xs">
						<span class="text-slate-500">
							${student.attendance ? `🕐 ${this.escapeHtml(student.time)}` : "Belum ada absensi masuk"}
						</span>
						${student.attendance ? `
							<button type="button" onclick="KepsekKetepatanWaktu.openStudentDetail('${this.escapeAttribute(student.username)}')" class="font-semibold text-indigo-600">
								Detail
								<i class="fas fa-arrow-right ml-1"></i>
							</button>
						` : ""}
					</div>
				</div>
			`;
		}).join("");
	},
	renderMonthly() {
		this.renderMonthlySummary();
		this.renderMonthlyClassSummary();
		this.renderMonthlyStudents();
	},
	renderMonthlySummary() {
		const stats = this.getMonthlyStats();
		const title = document.getElementById("kepsek-ketepatan-monthly-title");
		const totalElement = document.getElementById("kepsek-ketepatan-monthly-total-siswa");
		const tepatElement = document.getElementById("kepsek-ketepatan-monthly-tepat");
		const terlambatElement = document.getElementById("kepsek-ketepatan-monthly-terlambat");
		const belumElement = document.getElementById("kepsek-ketepatan-monthly-belum");
		const percentageElement = document.getElementById("kepsek-ketepatan-monthly-persentase");
		const progressElement = document.getElementById("kepsek-ketepatan-monthly-progress");
		const activeDaysElement = document.getElementById("kepsek-ketepatan-monthly-hari-aktif");
		if (title) {
			title.textContent = this.currentMonth.toLocaleDateString("id-ID", {
				month: "long",
				year: "numeric"
			});
		}
		if (totalElement) totalElement.textContent = stats.students;
		if (tepatElement) tepatElement.textContent = stats.tepat;
		if (terlambatElement) terlambatElement.textContent = stats.terlambat;
		if (belumElement) belumElement.textContent = stats.belum;
		if (percentageElement) percentageElement.textContent = `${stats.percentage}%`;
		if (progressElement) progressElement.style.width = `${stats.percentage}%`;
		if (activeDaysElement) activeDaysElement.textContent = `${stats.activeDays} hari aktif`;
	},
	renderMonthlyClassSummary() {
		const container = document.getElementById("kepsek-ketepatan-monthly-class-summary");
		if (!container) return;
		const categories = [...new Set(this.getModeStudents().map(student => String(student.kategori || "").trim()).filter(Boolean))]
			.sort((a, b) => a.localeCompare(b, "id"));
		if (!categories.length) {
			container.innerHTML = `
				<div class="md:col-span-2 lg:col-span-3 text-center py-6 text-slate-400">
					Belum ada data kelas ${this.escapeHtml(this.mode)}.
				</div>
			`;
			return;
		}
		container.innerHTML = categories.map(category => {
			const stats = this.getMonthlyClassStats(category);
			let badge = "bg-red-50 text-red-600";
			if (stats.percentage >= 90) badge = "bg-emerald-50 text-emerald-600";
			else if (stats.percentage >= 70) badge = "bg-yellow-50 text-yellow-600";
			return `
				<div class="border rounded-2xl p-4">
					<div class="flex items-center justify-between gap-3">
						<div class="min-w-0">
							<p class="font-bold text-slate-800 truncate">${this.escapeHtml(category)}</p>
							<p class="text-xs text-slate-500 mt-1">${stats.students} siswa · ${stats.activeDays} hari aktif</p>
						</div>
						<span class="${badge} px-2.5 py-1 rounded-full text-xs font-bold shrink-0">${stats.percentage}%</span>
					</div>
					<div class="grid grid-cols-3 gap-2 mt-3">
						<div class="bg-emerald-50 rounded-xl p-2">
							<p class="text-[10px] text-slate-500">Tepat</p>
							<p class="text-sm font-bold text-emerald-600">${stats.tepat}</p>
						</div>
						<div class="bg-red-50 rounded-xl p-2">
							<p class="text-[10px] text-slate-500">Terlambat</p>
							<p class="text-sm font-bold text-red-600">${stats.terlambat}</p>
						</div>
						<div class="bg-orange-50 rounded-xl p-2">
							<p class="text-[10px] text-slate-500">Belum</p>
							<p class="text-sm font-bold text-orange-600">${stats.belum}</p>
						</div>
					</div>
					<div class="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
						<div class="h-full bg-indigo-500 rounded-full" style="width:${stats.percentage}%"></div>
					</div>
				</div>
			`;
		}).join("");
	},
	renderMonthlyStudents() {
        const container = document.getElementById("kepsek-ketepatan-monthly-student-list");
        const table = document.getElementById("kepsek-ketepatan-monthly-student-table");
        if (!container || !table) return;
        // Hancurkan DataTables lama jika sudah pernah dibuat
        if (this.monthlyStudentDataTable) {
            this.monthlyStudentDataTable.destroy();
            this.monthlyStudentDataTable = null;
        }
        const students = this.getFilteredStudents();
        if (!students.length) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-slate-400">
                        Belum ada data siswa.
                    </td>
                </tr>
            `;
            return;
        }
        const rows = students.map((student) => {
            const stats = this.getMonthlyStudentStats(student.username);

            let badge = "bg-red-50 text-red-600";

            if (stats.percentage >= 90) {
                badge = "bg-emerald-50 text-emerald-600";
            } else if (stats.percentage >= 70) {
                badge = "bg-yellow-50 text-yellow-600";
            }

            return `
                <tr>
                    <td class="px-4 py-3 text-slate-500"></td>

                    <td class="px-4 py-3">
                        <div class="font-semibold text-slate-800">
                            ${this.escapeHtml(student.nama_lengkap || student.username)}
                        </div>
                        <div class="text-xs text-slate-400">
                            ${this.escapeHtml(student.username)}
                        </div>
                    </td>

                    <td class="px-4 py-3 text-slate-600">
                        ${this.escapeHtml(student.kategori || "-")}
                    </td>

                    <td class="px-4 py-3 text-center text-slate-600">
                        ${stats.total}
                    </td>

                    <td class="px-4 py-3 text-center font-semibold text-emerald-600">
                        ${stats.tepat}
                    </td>

                    <td class="px-4 py-3 text-center font-semibold text-red-600">
                        ${stats.terlambat}
                    </td>

                    <td class="px-4 py-3 text-center font-semibold text-orange-600">
                        ${stats.belum}
                    </td>

                    <td class="px-4 py-3 text-center" data-order="${stats.percentage}">
                        <span class="${badge} px-2.5 py-1 rounded-full text-xs font-bold">
                            ${stats.percentage}%
                        </span>
                    </td>
                </tr>
            `;
        });
        container.innerHTML = rows.join("");
        // Inisialisasi DataTables
        this.monthlyStudentDataTable = new DataTable(
            "#kepsek-ketepatan-monthly-student-table",
            {
                pageLength: 10,
                lengthMenu: [
                    [10, 25, 50, 100],
                    [10, 25, 50, 100]
                ],
                searching: true,
                ordering: true,
                paging: true,
                info: true,
                order: [[7, "desc"]],
                columnDefs: [
                    {
                        targets: 0,
                        orderable: false,
                        searchable: false
                    },
                    {
                        targets: [3, 4, 5, 6, 7],
                        type: "num"
                    }
                ],
                drawCallback: function () {
                    const api = this.api();
                    const start = api.page.info().start;
                    api.rows({
                        page: "current"
                    }).every(function (rowIndex, tableLoop, rowLoop) {
                        const row = this.node();
                        if (row) {
                            const nomor = start + rowLoop + 1;
                            const cell = row.querySelector("td:first-child");
                            if (cell) {
                                cell.textContent = nomor;
                            }
                        }
                    });
                },
                language: {
                    search: "Cari:",
                    searchPlaceholder: "Cari siswa...",
                    lengthMenu: "Tampilkan _MENU_ siswa",
                    info: "Menampilkan _START_ - _END_ dari _TOTAL_ siswa",
                    infoEmpty: "Tidak ada data",
                    infoFiltered: "(difilter dari _MAX_ siswa)",
                    zeroRecords: "Data siswa tidak ditemukan",
                    emptyTable: "Belum ada data siswa",
                    paginate: {
                        first: "Awal",
                        last: "Akhir",
                        next: "›",
                        previous: "‹"
                    }
                }
            }
        );
    },
	setMode(mode) {
		if (mode !== "X" && mode !== "XI") return;
		this.mode = mode;
		this.classFilter = "all";
		this.filter = "all";
		this.renderModeButtons();
		this.renderClassFilter();
		this.resetFilterButtons();
		this.renderDaily();
		this.renderMonthly();
	},
	resetFilterButtons() {
		document.querySelectorAll("[data-kepsek-ketepatan-filter]").forEach(button => {
			const active = button.dataset.kepsekKetepatanFilter === "all";
			button.classList.toggle("bg-indigo-600", active);
			button.classList.toggle("text-white", active);
			button.classList.toggle("bg-slate-100", !active);
			button.classList.toggle("text-slate-600", !active);
		});
	},
	setViewMode(mode) {
		if (mode !== "daily" && mode !== "monthly") return;
		this.viewMode = mode;
		const dailyView = document.getElementById("kepsek-ketepatan-daily-view");
		const monthlyView = document.getElementById("kepsek-ketepatan-monthly-view");
		if (dailyView) dailyView.classList.toggle("hidden", mode !== "daily");
		if (monthlyView) monthlyView.classList.toggle("hidden", mode !== "monthly");
		this.renderViewButtons();
		if (mode === "daily") {
			this.renderDaily();
		} else {
			this.renderMonthly();
		}
	},
	async openDateDetail(date) {
		if (!this.isHariAktif(date)) return;
		const students = this.getFilteredStudents().map(student => {
			const result = this.getAttendanceStatus(student, date);
			return {
				...student,
				...result
			};
		});
		const tepat = students.filter(student => student.status === "Tepat Waktu");
		const terlambat = students.filter(student => student.status === "Terlambat");
		const belum = students.filter(student => student.status === "Belum Absen");
		const rows = students.map(student => {
			let badge = "🟠 Belum Absen";
			if (student.status === "Tepat Waktu") badge = "🟢 Tepat Waktu";
			else if (student.status === "Terlambat") badge = "🔴 Terlambat";
			return `
				<div class="flex items-center justify-between gap-3 border rounded-xl p-3">
					<div class="min-w-0">
						<p class="font-semibold text-sm text-slate-800 truncate">${this.escapeHtml(student.nama_lengkap || student.username)}</p>
						<p class="text-xs text-slate-500">${this.escapeHtml(student.kategori || "-")} · ${this.escapeHtml(student.session)}</p>
					</div>
					<div class="text-right shrink-0">
						<p class="text-xs font-semibold">${badge}</p>
						<p class="text-[10px] text-slate-400 mt-1">${student.time ? this.escapeHtml(student.time) : `Batas ${this.escapeHtml(student.deadline)}`}</p>
					</div>
				</div>
			`;
		}).join("");
		Swal.fire({
			title: `Kehadiran ${this.formatDateLong(date)}`,
			html: `
				<div class="text-left">
					<div class="grid grid-cols-3 gap-2 mb-4">
						<div class="bg-emerald-50 rounded-xl p-3 text-center">
							<p class="text-xs text-slate-500">Tepat</p>
							<p class="text-lg font-bold text-emerald-600">${tepat.length}</p>
						</div>
						<div class="bg-red-50 rounded-xl p-3 text-center">
							<p class="text-xs text-slate-500">Terlambat</p>
							<p class="text-lg font-bold text-red-600">${terlambat.length}</p>
						</div>
						<div class="bg-orange-50 rounded-xl p-3 text-center">
							<p class="text-xs text-slate-500">Belum</p>
							<p class="text-lg font-bold text-orange-600">${belum.length}</p>
						</div>
					</div>
					<div class="max-h-[50vh] overflow-y-auto space-y-2">
						${rows}
					</div>
				</div>
			`,
			width: 700,
			confirmButtonText: "Tutup"
		});
	},
	openStudentDetail(username) {
		const student = this.studentMap.get(String(username));
		if (!student) return;
		const today = this.getLocalDate();
		const result = this.getAttendanceStatus(student, today);
		const attendance = result.attendance;
		const status = result.status;
		const badge = status === "Tepat Waktu" ? "🟢 Tepat Waktu" : status === "Terlambat" ? "🔴 Terlambat" : "🟠 Belum Absen";
		Swal.fire({
			title: this.escapeHtml(student.nama_lengkap || student.username),
			html: `
				<div class="text-left space-y-3">
					<div class="bg-slate-50 rounded-xl p-4">
						<p class="text-xs text-slate-400">Kelas</p>
						<p class="font-semibold text-slate-700">${this.escapeHtml(student.kategori || "-")}</p>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div class="bg-slate-50 rounded-xl p-4">
							<p class="text-xs text-slate-400">Sesi</p>
							<p class="font-semibold text-slate-700">${this.escapeHtml(result.session)}</p>
						</div>
						<div class="bg-slate-50 rounded-xl p-4">
							<p class="text-xs text-slate-400">Batas Waktu</p>
							<p class="font-semibold text-slate-700">${this.escapeHtml(result.deadline)} WITA</p>
						</div>
					</div>
					<div class="bg-slate-50 rounded-xl p-4">
						<p class="text-xs text-slate-400">Status Hari Ini</p>
						<p class="font-bold text-slate-700 mt-1">${badge}</p>
					</div>
					<div class="bg-slate-50 rounded-xl p-4">
						<p class="text-xs text-slate-400">Waktu Absensi</p>
						<p class="font-semibold text-slate-700">${attendance ? `${this.escapeHtml(result.time)} WITA` : "Belum melakukan absensi masuk"}</p>
					</div>
				</div>
			`,
			confirmButtonText: "Tutup"
		});
	},
	setupEvents() {
		document.querySelectorAll("[data-kepsek-ketepatan-mode]").forEach(button => {
			button.addEventListener("click", () => {
				this.setMode(button.dataset.kepsekKetepatanMode);
			});
		});
		document.querySelectorAll("[data-kepsek-ketepatan-view-mode]").forEach(button => {
			button.addEventListener("click", () => {
				this.setViewMode(button.dataset.kepsekKetepatanViewMode);
			});
		});
		const classFilter = document.getElementById("kepsek-ketepatan-filter-kelas");
		if (classFilter) {
			classFilter.addEventListener("change", event => {
				this.setClassFilter(event.target.value);
			});
		}
		document.querySelectorAll("[data-kepsek-ketepatan-filter]").forEach(button => {
			button.addEventListener("click", () => {
				this.setFilter(button.dataset.kepsekKetepatanFilter);
			});
		});
		const previousButton = document.getElementById("kepsek-ketepatan-previous-month");
		if (previousButton) {
			previousButton.addEventListener("click", () => {
				this.previousMonth();
			});
		}
		const nextButton = document.getElementById("kepsek-ketepatan-next-month");
		if (nextButton) {
			nextButton.addEventListener("click", () => {
				this.nextMonth();
			});
		}
	},
	previousMonth() {
		this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
		if (this.viewMode === "daily") {
			this.renderCalendar();
		} else {
			this.renderMonthly();
		}
	},
	nextMonth() {
		this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
		if (this.viewMode === "daily") {
			this.renderCalendar();
		} else {
			this.renderMonthly();
		}
	},
	showEmpty(message) {
		const container = document.getElementById("kepsek-ketepatan-student-list");
		if (!container) return;
		container.innerHTML = `
			<div class="md:col-span-2 lg:col-span-3 text-center py-8 text-slate-400">
				${this.escapeHtml(message)}
			</div>
		`;
	},
	escapeHtml(value) {
		return String(value ?? "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	},
	escapeAttribute(value) {
		return this.escapeHtml(value);
	}
};