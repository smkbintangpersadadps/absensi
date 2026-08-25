const KepsekJurnal7Kaih = {
	students: [],
	journals: [],
	journalMap: new Map(),
	currentMonth: new Date(),
	filter: "all",
	classFilter: "all",
	viewMode: "daily",
	initialized: false,
	async init() {
		const user = AppState.currentUser;
		if (!user) return;
		if (!this.isKepalaSekolah()) return;
		this.currentMonth = new Date();
		this.currentMonth.setDate(1);
		this.filter = "all";
		this.classFilter = "all";
		this.viewMode = "daily";
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
			showLoader("Memuat monitoring jurnal...");
			const user = AppState.currentUser;
			if (!user) return;
			const { data: students, error: studentError } = await window.supabaseClient.from("users").select("username,nama_lengkap,kategori,role").like("kategori", "X %");
			if (studentError) throw studentError;
			this.students = (students || []).filter(student => {
				const role = String(student.role || "").trim().toLowerCase();
				return role === "siswa" || !student.role;
			});
			this.students.sort((a, b) => String(a.kategori || "").localeCompare(String(b.kategori || ""), "id") || String(a.nama_lengkap || "").localeCompare(String(b.nama_lengkap || ""), "id"));
			this.renderClassFilter();
			await this.loadJournals();
			this.buildJournalMap();
			this.renderSummary();
			this.renderClassSummary();
			this.renderCalendar();
			this.renderStudents();
			this.renderMonthly();
			this.initialized = true;
		} catch (error) {
			console.error("KepsekJurnal7Kaih.load:", error);
			Swal.fire({
				icon: "error",
				title: "Gagal Memuat",
				text: error.message || "Data jurnal gagal dimuat."
			});
		} finally {
			hideLoader();
		}
	},
	async loadJournals() {
		const usernames = this.students.map(student => student.username).filter(Boolean);
		if (!usernames.length) {
			this.journals = [];
			return;
		}
		const { data, error } = await window.supabaseClient.from("jurnal_7_kaih").select(`
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
		`).in("username", usernames).order("tanggal", { ascending: false });
		if (error) throw error;
		this.journals = data || [];
	},
	buildJournalMap() {
		this.journalMap = new Map();
		this.journals.forEach(journal => {
			this.journalMap.set(`${journal.username}_${journal.tanggal}`, journal);
		});
	},
	getLocalDate(offsetDays = 0) {
		const date = new Date();
		date.setHours(0, 0, 0, 0);
		date.setDate(date.getDate() + offsetDays);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
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
	getJournal(username, date) {
		return this.journalMap.get(`${username}_${date}`) || null;
	},
	isComplete(journal) {
		if (!journal) return false;
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
	getDateStats(date) {
		let done = 0;
		let missing = 0;
		this.students.forEach(student => {
			const journal = this.getJournal(student.username, date);
			if (this.isComplete(journal)) {
				done++;
			} else {
				missing++;
			}
		});
		return {
			done,
			missing,
			total: this.students.length,
			percentage: this.students.length ? Math.round((done / this.students.length) * 100) : 0
		};
	},
	renderSummary() {
		const today = this.getLocalDate();
		const stats = this.getDateStats(today);
		const total = this.students.length;
		const totalElement = document.getElementById("kepsek-jurnal-total-siswa");
		const doneElement = document.getElementById("kepsek-jurnal-sudah");
		const missingElement = document.getElementById("kepsek-jurnal-belum");
		const percentageElement = document.getElementById("kepsek-jurnal-persentase");
		if (totalElement) totalElement.textContent = total;
		if (doneElement) doneElement.textContent = stats.done;
		if (missingElement) missingElement.textContent = stats.missing;
		if (percentageElement) percentageElement.textContent = `${stats.percentage}%`;
	},
	renderClassFilter() {
		const select = document.getElementById("kepsek-jurnal-filter-kelas");
		if (!select) return;
		const categories = [...new Set(this.students.map(student => student.kategori).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));
		select.innerHTML = `
			<option value="all">Semua Kelas</option>
			${categories.map(category => `
				<option value="${this.escapeAttribute(category)}">${this.escapeHtml(category)}</option>
			`).join("")}
		`;
		select.value = this.classFilter;
	},
	renderClassSummary() {
		const container = document.getElementById("kepsek-jurnal-class-summary");
		if (!container) return;
		const today = this.getLocalDate();
		const categories = [...new Set(this.students.map(student => student.kategori).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));
		if (!categories.length) {
			container.innerHTML = `
				<div class="text-center py-6 text-slate-400">
					Belum ada data kelas X.
				</div>
			`;
			return;
		}
		container.innerHTML = categories.map(category => {
			const students = this.students.filter(student => student.kategori === category);
			const done = students.filter(student => this.isComplete(this.getJournal(student.username, today))).length;
			const total = students.length;
			const percentage = total ? Math.round((done / total) * 100) : 0;
			let badge = "bg-red-50 text-red-600";
			if (percentage >= 90) badge = "bg-emerald-50 text-emerald-600";
			else if (percentage >= 70) badge = "bg-yellow-50 text-yellow-600";
			return `
				<button type="button" onclick="KepsekJurnal7Kaih.selectClass('${this.escapeAttribute(category)}')" class="text-left border rounded-2xl p-4 hover:bg-slate-50 transition">
					<div class="flex items-center justify-between gap-3">
						<div class="min-w-0">
							<p class="font-bold text-slate-800 truncate">${this.escapeHtml(category)}</p>
							<p class="text-xs text-slate-500 mt-1">${done} dari ${total} siswa</p>
						</div>
						<span class="${badge} px-2.5 py-1 rounded-full text-xs font-bold shrink-0">${percentage}%</span>
					</div>
					<div class="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
						<div class="h-full bg-indigo-500 rounded-full" style="width:${percentage}%"></div>
					</div>
				</button>
			`;
		}).join("");
	},
	selectClass(category) {
		this.classFilter = category;
		const select = document.getElementById("kepsek-jurnal-filter-kelas");
		if (select) select.value = category;
		this.renderStudents();
	},
	renderCalendar() {
		const container = document.getElementById("kepsek-jurnal-calendar");
		const title = document.getElementById("kepsek-jurnal-calendar-title");
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
			html += `
				<div class="text-center text-xs font-semibold text-slate-400 py-1">${day}</div>
			`;
		});
		for (let i = 0; i < firstDay; i++) {
			html += `<div></div>`;
		}
		for (let day = 1; day <= totalDays; day++) {
			const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
			const dateObj = new Date(year, month, day);
			const isSunday = dateObj.getDay() === 0;
			if (isSunday) {
				html += `
					<div class="aspect-square rounded-xl bg-slate-50 flex flex-col items-center justify-center text-xs opacity-60">
						<span class="font-semibold text-slate-400">${day}</span>
						<span class="mt-1">−</span>
					</div>
				`;
				continue;
			}
			const stats = this.getDateStats(date);
			let status = "⚪";
			let bg = "bg-slate-50";
			if (stats.total > 0) {
				if (stats.percentage >= 90) {
					status = "🟢";
					bg = "bg-emerald-50 hover:bg-emerald-100";
				} else if (stats.percentage >= 70) {
					status = "🟡";
					bg = "bg-yellow-50 hover:bg-yellow-100";
				} else if (stats.done > 0) {
					status = "🔴";
					bg = "bg-red-50 hover:bg-red-100";
				}
			}
			html += `
				<button type="button" onclick="KepsekJurnal7Kaih.openDateModal('${date}')" class="aspect-square rounded-xl ${bg} flex flex-col items-center justify-center text-xs transition">
					<span class="font-semibold text-slate-700">${day}</span>
					<span class="mt-1">${status}</span>
					<span class="text-[9px] text-slate-400 mt-0.5">${stats.done}/${stats.total}</span>
				</button>
			`;
		}
		container.innerHTML = html;
	},
	setFilter(filter) {
		this.filter = filter;
		document.querySelectorAll("[data-kepsek-filter]").forEach(button => {
			const active = button.dataset.kepsekFilter === filter;
			button.classList.toggle("bg-indigo-600", active);
			button.classList.toggle("text-white", active);
			button.classList.toggle("bg-slate-100", !active);
			button.classList.toggle("text-slate-600", !active);
		});
		this.renderStudents();
	},
	setClassFilter(category) {
		this.classFilter = category;
		this.renderStudents();
	},
	renderStudents() {
		const container = document.getElementById("kepsek-jurnal-student-list");
		if (!container) return;
		const today = this.getLocalDate();
		let students = [...this.students];
		if (this.classFilter !== "all") {
			students = students.filter(student => student.kategori === this.classFilter);
		}
		students = students.map(student => {
			const journal = this.getJournal(student.username, today);
			return {
				...student,
				journal,
				complete: this.isComplete(journal),
				streak: this.calculateStreak(student.username)
			};
		});
		if (this.filter === "done") students = students.filter(student => student.complete);
		if (this.filter === "missing") students = students.filter(student => !student.complete);
		if (!students.length) {
			container.innerHTML = `
				<div class="md:col-span-2 lg:col-span-3 text-center py-8 text-slate-400">
					Tidak ada siswa pada filter ini.
				</div>
			`;
			return;
		}
		container.innerHTML = students.map(student => `
			<div class="border rounded-2xl p-4 hover:bg-slate-50 transition">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="font-bold text-slate-800 truncate">${this.escapeHtml(student.nama_lengkap || student.username)}</p>
						<p class="text-xs text-slate-500 mt-1">${this.escapeHtml(student.kategori || "-")}</p>
					</div>
					<span class="text-xs font-semibold ${student.complete ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"} px-2.5 py-1 rounded-full shrink-0">
						${student.complete ? "✓ Sudah" : "Belum"}
					</span>
				</div>
				<div class="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
					<span>🔥 Streak ${student.streak} hari</span>
					<span>${student.journal ? `🌅 ${this.escapeHtml(student.journal.bangun || "-")}` : "📖 Belum ada jurnal"}</span>
				</div>
				<button type="button" onclick="KepsekJurnal7Kaih.openStudent('${this.escapeAttribute(student.username)}')" class="mt-3 text-sm font-semibold text-indigo-600">
					Lihat Detail
					<i class="fas fa-arrow-right ml-1"></i>
				</button>
			</div>
		`).join("");
	},
	calculateStreak(username) {
		const dates = this.journals.filter(journal => journal.username === username && this.isComplete(journal)).map(journal => journal.tanggal).sort((a, b) => b.localeCompare(a));
		if (!dates.length) return 0;
		let current = this.getLocalDate();
		if (!dates.includes(current)) current = this.getPreviousJournalDate(current);
		let streak = 0;
		while (dates.includes(current)) {
			streak++;
			current = this.getPreviousJournalDate(current);
		}
		return streak;
	},
	getPreviousJournalDate(dateString) {
		const date = new Date(dateString + "T00:00:00");
		date.setDate(date.getDate() - 1);
		while (date.getDay() === 0) date.setDate(date.getDate() - 1);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	},
	getActiveDatesInMonth() {
		const year = this.currentMonth.getFullYear();
		const month = this.currentMonth.getMonth();
		const totalDays = new Date(year, month + 1, 0).getDate();
		const dates = [];
		for (let day = 1; day <= totalDays; day++) {
			const date = new Date(year, month, day);
			if (date.getDay() !== 0) {
				const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
				dates.push(dateString);
			}
		}
		return dates;
	},
	getMonthlyStudentStats(username) {
		const dates = this.getActiveDatesInMonth();
		const today = this.getLocalDate();
		const currentYear = this.currentMonth.getFullYear();
		const currentMonth = this.currentMonth.getMonth();
		const isCurrentMonth = currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth();
		const activeDates = isCurrentMonth ? dates.filter(date => date <= today) : dates;
		let done = 0;
		let missing = 0;
		activeDates.forEach(date => {
			const journal = this.getJournal(username, date);
			if (this.isComplete(journal)) {
				done++;
			} else {
				missing++;
			}
		});
		const total = activeDates.length;
		const percentage = total ? Math.round((done / total) * 100) : 0;
		return {
			total,
			done,
			missing,
			percentage
		};
	},
	getMonthlyStats() {
		const dates = this.getActiveDatesInMonth();
		const today = this.getLocalDate();
		const currentYear = this.currentMonth.getFullYear();
		const currentMonth = this.currentMonth.getMonth();
		const isCurrentMonth = currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth();
		const activeDates = isCurrentMonth ? dates.filter(date => date <= today) : dates;
		let done = 0;
		let missing = 0;
		this.students.forEach(student => {
			activeDates.forEach(date => {
				const journal = this.getJournal(student.username, date);
				if (this.isComplete(journal)) {
					done++;
				} else {
					missing++;
				}
			});
		});
		const total = done + missing;
		const percentage = total ? Math.round((done / total) * 100) : 0;
		return {
			students: this.students.length,
			activeDays: activeDates.length,
			done,
			missing,
			total,
			percentage
		};
	},
	getMonthlyClassStats(category) {
		const students = this.students.filter(student => student.kategori === category);
		const dates = this.getActiveDatesInMonth();
		const today = this.getLocalDate();
		const currentYear = this.currentMonth.getFullYear();
		const currentMonth = this.currentMonth.getMonth();
		const isCurrentMonth = currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth();
		const activeDates = isCurrentMonth ? dates.filter(date => date <= today) : dates;
		let done = 0;
		let missing = 0;
		students.forEach(student => {
			activeDates.forEach(date => {
				const journal = this.getJournal(student.username, date);
				if (this.isComplete(journal)) {
					done++;
				} else {
					missing++;
				}
			});
		});
		const total = done + missing;
		return {
			students: students.length,
			activeDays: activeDates.length,
			done,
			missing,
			total,
			percentage: total ? Math.round((done / total) * 100) : 0
		};
	},
	renderMonthly() {
		this.renderMonthlySummary();
		this.renderMonthlyClassSummary();
		this.renderMonthlyStudents();
	},
	renderMonthlySummary() {
		const stats = this.getMonthlyStats();
		const title = document.getElementById("kepsek-jurnal-monthly-title");
		const totalElement = document.getElementById("kepsek-jurnal-monthly-total-siswa");
		const doneElement = document.getElementById("kepsek-jurnal-monthly-sudah");
		const missingElement = document.getElementById("kepsek-jurnal-monthly-belum");
		const percentageElement = document.getElementById("kepsek-jurnal-monthly-persentase");
		if (title) {
			title.textContent = this.currentMonth.toLocaleDateString("id-ID", {
				month: "long",
				year: "numeric"
			});
		}
		if (totalElement) totalElement.textContent = stats.students;
		if (doneElement) doneElement.textContent = stats.done;
		if (missingElement) missingElement.textContent = stats.missing;
		if (percentageElement) percentageElement.textContent = `${stats.percentage}%`;
	},
	renderMonthlyClassSummary() {
		const container = document.getElementById("kepsek-jurnal-monthly-class-summary");
		if (!container) return;
		const categories = [...new Set(this.students.map(student => student.kategori).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));
		if (!categories.length) {
			container.innerHTML = `
				<div class="text-center py-6 text-slate-400">
					Belum ada data kelas X.
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
					<div class="grid grid-cols-2 gap-2 mt-3">
						<div class="bg-emerald-50 rounded-xl p-2">
							<p class="text-[10px] text-slate-500">Sudah</p>
							<p class="text-sm font-bold text-emerald-600">${stats.done}</p>
						</div>
						<div class="bg-red-50 rounded-xl p-2">
							<p class="text-[10px] text-slate-500">Belum</p>
							<p class="text-sm font-bold text-red-600">${stats.missing}</p>
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
		const table = document.getElementById("kepsek-jurnal-monthly-table");
		const container = document.getElementById("kepsek-jurnal-monthly-student-list");
		if (!table || !container) return;
		if ($.fn.DataTable.isDataTable("#kepsek-jurnal-monthly-table")) {
			$("#kepsek-jurnal-monthly-table").DataTable().clear().destroy();
		}
		container.innerHTML = "";
		if (!this.students.length) {
			container.innerHTML = `
				<tr>
					<td colspan="7" class="text-center py-8 text-slate-400">Belum ada data siswa.</td>
				</tr>
			`;
			return;
		}
		const rows = this.students.map((student, index) => {
			const stats = this.getMonthlyStudentStats(student.username);
			let badge = "bg-red-50 text-red-600";
			if (stats.percentage >= 90) {
				badge = "bg-emerald-50 text-emerald-600";
			} else if (stats.percentage >= 70) {
				badge = "bg-yellow-50 text-yellow-600";
			}
			return [
				index + 1,
				`
					<div class="font-semibold text-slate-800">
						${this.escapeHtml(student.nama_lengkap || student.username)}
					</div>
					<div class="text-xs text-slate-400">
						${this.escapeHtml(student.username)}
					</div>
				`,
				this.escapeHtml(student.kategori || "-"),
				stats.total,
				stats.done,
				stats.missing,
				`
					<span class="${badge} px-2.5 py-1 rounded-full text-xs font-bold">
						${stats.percentage}%
					</span>
				`
			];
		});
		$("#kepsek-jurnal-monthly-table").DataTable({
			data: rows,
			columns: [
				{
					title: "No",
					className: "text-left px-4 py-3",
					orderable: true
				},
				{
					title: "Nama Siswa",
					className: "px-4 py-3"
				},
				{
					title: "Kelas",
					className: "px-4 py-3"
				},
				{
					title: "Hari Aktif",
					className: "text-center px-4 py-3"
				},
				{
					title: "Sudah",
					className: "text-center px-4 py-3"
				},
				{
					title: "Belum",
					className: "text-center px-4 py-3"
				},
				{
					title: "Kepatuhan",
					className: "text-center px-4 py-3",
					type: "num",
					render: function(data, type) {
						if (type === "sort" || type === "type") {
							return parseFloat(
								String(data).replace(/<[^>]*>/g, "").replace("%", "")
							) || 0;
						}
						return data;
					}
				}
			],
			order: [[1, "asc"]],
			pageLength: 10,
			lengthMenu: [
				[10, 25, 50, 100, -1],
				[10, 25, 50, 100, "Semua"]
			],
			responsive: false,
			autoWidth: false,
			language: {
				search: "Cari:",
				lengthMenu: "Tampilkan _MENU_ siswa",
				info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ siswa",
				infoEmpty: "Tidak ada data siswa",
				zeroRecords: "Siswa tidak ditemukan",
				emptyTable: "Belum ada data siswa",
				paginate: {
					first: "Awal",
					last: "Akhir",
					next: "Berikutnya",
					previous: "Sebelumnya"
				}
			},
			columnDefs: [
				{
					targets: 0,
					orderable: false,
					searchable: false
				}
			],
			drawCallback: function() {
				const api = this.api();
				const pageInfo = api.page.info();
				api.column(0, {
					page: "current"
				}).nodes().each(function(cell, i) {
					cell.innerHTML = pageInfo.start + i + 1;
				});
			}
		});
	},
	setViewMode(mode) {
		if (mode !== "daily" && mode !== "monthly") return;
		this.viewMode = mode;
		const dailyView = document.getElementById("kepsek-jurnal-daily-view");
		const monthlyView = document.getElementById("kepsek-jurnal-monthly-view");
		if (dailyView) dailyView.classList.toggle("hidden", mode !== "daily");
		if (monthlyView) monthlyView.classList.toggle("hidden", mode !== "monthly");
		document.querySelectorAll("[data-kepsek-view-mode]").forEach(button => {
			const active = button.dataset.kepsekViewMode === mode;
			button.classList.toggle("bg-indigo-600", active);
			button.classList.toggle("text-white", active);
			button.classList.toggle("bg-slate-100", !active);
			button.classList.toggle("text-slate-600", !active);
		});
		if (mode === "daily") {
			this.renderSummary();
			this.renderClassSummary();
			this.renderCalendar();
			this.renderStudents();
		} else {
			this.renderMonthly();
		}
	},
	openDateModal(date) {
		const modal = document.getElementById("modal-kepsek-jurnal-tanggal");
		if (!modal) return;
		const students = this.students.map(student => {
			const journal = this.getJournal(student.username, date);
			return {
				...student,
				journal,
				complete: this.isComplete(journal)
			};
		});
		const done = students.filter(item => item.complete);
		const missing = students.filter(item => !item.complete);
		const dateElement = document.getElementById("kepsek-jurnal-modal-date");
		const doneElement = document.getElementById("kepsek-date-done");
		const missingElement = document.getElementById("kepsek-date-missing");
		const listElement = document.getElementById("kepsek-jurnal-date-list");
		if (dateElement) dateElement.textContent = this.formatDateLong(date);
		if (doneElement) doneElement.textContent = done.length;
		if (missingElement) missingElement.textContent = missing.length;
		if (listElement) {
			listElement.innerHTML = students.map(student => `
				<div class="flex items-center justify-between gap-3 border rounded-xl p-3">
					<div class="min-w-0">
						<p class="font-semibold text-sm text-slate-800 truncate">${this.escapeHtml(student.nama_lengkap || student.username)}</p>
						<p class="text-xs text-slate-500">${this.escapeHtml(student.kategori || "-")}</p>
					</div>
					<div class="flex items-center gap-2 shrink-0">
						<span>${student.complete ? "🟢" : "🔴"}</span>
						${student.journal ? `
							<button type="button" onclick="KepsekJurnal7Kaih.openJournalDetail('${student.journal.id}')" class="text-xs font-semibold text-indigo-600">Detail</button>
						` : ""}
					</div>
				</div>
			`).join("");
		}
		modal.classList.remove("hidden");
		modal.classList.add("flex");
		document.body.classList.add("overflow-hidden");
	},
	openStudent(username) {
		const student = this.students.find(item => item.username === username);
		if (!student) return;
		const today = this.getLocalDate();
		const journal = this.getJournal(username, today);
		if (journal) {
			this.openJournalDetail(journal.id);
			return;
		}
		this.openDateModal(today);
	},
	openJournalDetail(id) {
		const journal = this.journals.find(item => String(item.id) === String(id));
		if (!journal) return;
		const student = this.students.find(item => item.username === journal.username);
		const namaElement = document.getElementById("kepsek-detail-nama");
		const kategoriElement = document.getElementById("kepsek-detail-kategori");
		const tanggalElement = document.getElementById("kepsek-detail-tanggal");
		const bangunElement = document.getElementById("kepsek-detail-bangun");
		const ibadahElement = document.getElementById("kepsek-detail-ibadah");
		const olahragaElement = document.getElementById("kepsek-detail-olahraga");
		const makanElement = document.getElementById("kepsek-detail-makan");
		const gemarElement = document.getElementById("kepsek-detail-gemar");
		const bermasyarakatElement = document.getElementById("kepsek-detail-bermasyarakat");
		const tidurElement = document.getElementById("kepsek-detail-tidur");
		if (namaElement) namaElement.textContent = student?.nama_lengkap || journal.nama_lengkap || journal.username;
		if (kategoriElement) kategoriElement.textContent = student?.kategori || journal.kategori || "-";
		if (tanggalElement) tanggalElement.textContent = this.formatDateLong(journal.tanggal);
		if (bangunElement) bangunElement.textContent = journal.bangun || "-";
		if (ibadahElement) ibadahElement.textContent = `${journal.ibadah ?? 0} kali`;
		if (olahragaElement) olahragaElement.textContent = `${journal.olahraga ?? 0} menit`;
		if (makanElement) makanElement.textContent = journal.makan || "-";
		if (gemarElement) gemarElement.textContent = journal.gemar || "-";
		if (bermasyarakatElement) bermasyarakatElement.textContent = journal.bermasyarakat || "-";
		if (tidurElement) tidurElement.textContent = journal.tidur || "-";
		const modal = document.getElementById("modal-kepsek-jurnal-detail");
		if (!modal) return;
		modal.classList.remove("hidden");
		modal.classList.add("flex");
		document.body.classList.add("overflow-hidden");
	},
	closeDateModal() {
		const modal = document.getElementById("modal-kepsek-jurnal-tanggal");
		if (!modal) return;
		modal.classList.add("hidden");
		modal.classList.remove("flex");
		document.body.classList.remove("overflow-hidden");
	},
	closeDetailModal() {
		const modal = document.getElementById("modal-kepsek-jurnal-detail");
		if (!modal) return;
		modal.classList.add("hidden");
		modal.classList.remove("flex");
		document.body.classList.remove("overflow-hidden");
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
		const container = document.getElementById("kepsek-jurnal-student-list");
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