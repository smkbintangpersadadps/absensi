const VotingOsisSettingsService = {
	pemilu: null,
	loading: false,
	init() {
		this.load();
	},
	async load() {
		const container = document.getElementById('voting-osis-settings-container');
		if (!container) return;
		this.renderLoading(container);
		try {
			const { data, error } = await supabase
				.from('pemilu_osis')
				.select(`
					id,
					nama,
					tahun_ajaran,
					tanggal_mulai,
					jam_mulai,
					tanggal_selesai,
					jam_selesai,
					status,
					tampilkan_hasil,
					created_at,
					updated_at
				`)
				.order('created_at', { ascending: false })
				.limit(1)
				.maybeSingle();
			if (error) throw error;
			this.pemilu = data;
			this.render(container);
		} catch (error) {
			console.error('Gagal memuat pengaturan pemilihan:', error);
			container.innerHTML = `
				<div class="bg-white rounded-3xl shadow-sm border border-red-100 p-6">
					<div class="flex items-start gap-4">
						<div class="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xl shrink-0">
							⚠️
						</div>
						<div class="flex-1">
							<h3 class="font-bold text-slate-800">Gagal Memuat Pengaturan</h3>
							<p class="text-sm text-slate-500 mt-1">${this.escapeHtml(error.message || 'Terjadi kesalahan.')}</p>
							<button type="button" onclick="VotingOsisSettingsService.load()" class="mt-4 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition">
								🔄 Coba Lagi
							</button>
						</div>
					</div>
				</div>
			`;
		}
	},
	renderLoading(container) {
		container.innerHTML = `
			<div class="space-y-4 animate-pulse">
				<div class="h-32 bg-slate-200 rounded-3xl"></div>
				<div class="h-96 bg-slate-200 rounded-3xl"></div>
			</div>
		`;
	},
	render(container) {
		const p = this.pemilu;
		container.innerHTML = `
			<div class="space-y-5">
				<div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-6 sm:p-7 shadow-lg">
					<div class="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10"></div>
					<div class="absolute -right-20 bottom-0 w-52 h-52 rounded-full bg-white/5"></div>
					<div class="relative">
						<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-xs font-bold backdrop-blur-sm">
							<span>⚙️</span>
							<span>PENGATURAN PEMILIHAN</span>
						</div>
						<h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-4">Pengaturan Pemilihan Ketua OSIS</h1>
						<p class="text-blue-100 text-sm mt-2 max-w-2xl">
							Atur jadwal, status pemilihan, dan pengaturan tampilan hasil suara untuk siswa.
						</p>
					</div>
				</div>
				<div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
					<div class="px-5 py-4 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
						<div>
							<h2 class="font-extrabold text-slate-800">Informasi Pemilihan</h2>
							<p class="text-xs text-slate-500 mt-1">Data utama pemilihan Ketua OSIS.</p>
						</div>
						${this.renderStatusBadge(p?.status)}
					</div>
					<form id="form-voting-osis-settings" class="p-5 sm:p-6">
						<div class="space-y-5">
							<div>
								<label for="osis-setting-nama" class="block text-sm font-bold text-slate-700 mb-2">
									Nama Pemilihan
								</label>
								<input
									type="text"
									id="osis-setting-nama"
									value="${this.escapeAttribute(p?.nama || '')}"
									placeholder="Contoh: Pemilihan Ketua OSIS 2026/2027"
									class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
									required
								>
							</div>
							<div>
								<label for="osis-setting-tahun" class="block text-sm font-bold text-slate-700 mb-2">
									Tahun Ajaran
								</label>
								<input
									type="text"
									id="osis-setting-tahun"
									value="${this.escapeAttribute(p?.tahun_ajaran || '')}"
									placeholder="Contoh: 2026/2027"
									class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
									required
								>
							</div>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div class="rounded-2xl bg-blue-50/60 border border-blue-100 p-4">
									<div class="flex items-center gap-2 mb-4">
										<div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
											🟢
										</div>
										<div>
											<h3 class="text-sm font-extrabold text-slate-800">Mulai Pemilihan</h3>
											<p class="text-xs text-slate-500">Waktu siswa mulai dapat memilih.</p>
										</div>
									</div>
									<div class="space-y-3">
										<div>
											<label for="osis-setting-tanggal-mulai" class="block text-xs font-bold text-slate-600 mb-1.5">
												Tanggal Mulai
											</label>
											<input
												type="date"
												id="osis-setting-tanggal-mulai"
												value="${this.escapeAttribute(p?.tanggal_mulai || '')}"
												class="w-full px-3.5 py-3 rounded-xl border border-blue-100 bg-white text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
												required
											>
										</div>
										<div>
											<label for="osis-setting-jam-mulai" class="block text-xs font-bold text-slate-600 mb-1.5">
												Jam Mulai
											</label>
											<input
												type="time"
												id="osis-setting-jam-mulai"
												value="${this.escapeAttribute(this.normalizeTime(p?.jam_mulai))}"
												class="w-full px-3.5 py-3 rounded-xl border border-blue-100 bg-white text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
												required
											>
										</div>
									</div>
								</div>
								<div class="rounded-2xl bg-red-50/60 border border-red-100 p-4">
									<div class="flex items-center gap-2 mb-4">
										<div class="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
											🔴
										</div>
										<div>
											<h3 class="text-sm font-extrabold text-slate-800">Selesai Pemilihan</h3>
											<p class="text-xs text-slate-500">Waktu siswa tidak dapat memilih lagi.</p>
										</div>
									</div>
									<div class="space-y-3">
										<div>
											<label for="osis-setting-tanggal-selesai" class="block text-xs font-bold text-slate-600 mb-1.5">
												Tanggal Selesai
											</label>
											<input
												type="date"
												id="osis-setting-tanggal-selesai"
												value="${this.escapeAttribute(p?.tanggal_selesai || '')}"
												class="w-full px-3.5 py-3 rounded-xl border border-red-100 bg-white text-sm text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
												required
											>
										</div>
										<div>
											<label for="osis-setting-jam-selesai" class="block text-xs font-bold text-slate-600 mb-1.5">
												Jam Selesai
											</label>
											<input
												type="time"
												id="osis-setting-jam-selesai"
												value="${this.escapeAttribute(this.normalizeTime(p?.jam_selesai))}"
												class="w-full px-3.5 py-3 rounded-xl border border-red-100 bg-white text-sm text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
												required
											>
										</div>
									</div>
								</div>
							</div>
							<div class="rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:p-5">
								<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
									<div class="flex items-start gap-3">
										<div class="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
											📊
										</div>
										<div>
											<h3 class="text-sm font-extrabold text-slate-800">Tampilkan Hasil Suara</h3>
											<p class="text-xs text-slate-500 mt-1 leading-5">
												Jika aktif, siswa dapat melihat hasil suara sementara selama pemilihan berlangsung.
											</p>
										</div>
									</div>
									<label class="relative inline-flex items-center cursor-pointer shrink-0">
										<input
											type="checkbox"
											id="osis-setting-tampilkan-hasil"
											class="sr-only peer"
											${p?.tampilkan_hasil ? 'checked' : ''}
										>
										<div class="w-12 h-7 bg-slate-300 rounded-full peer peer-focus:ring-4 peer-focus:ring-violet-100 peer-checked:bg-violet-600 transition"></div>
										<div class="absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm transition peer-checked:translate-x-5"></div>
									</label>
								</div>
								<div id="osis-setting-hasil-info" class="mt-4">
									${this.renderResultInfo(Boolean(p?.tampilkan_hasil))}
								</div>
							</div>
							<div>
								<label for="osis-setting-status" class="block text-sm font-bold text-slate-700 mb-2">
									Status Pemilihan
								</label>
								<select
									id="osis-setting-status"
									class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								>
									<option value="draft" ${p?.status === 'draft' ? 'selected' : ''}>📝 Draft</option>
									<option value="aktif" ${p?.status === 'aktif' ? 'selected' : ''}>🟢 Aktif</option>
									<option value="selesai" ${p?.status === 'selesai' ? 'selected' : ''}>🔴 Selesai</option>
								</select>
								<p class="text-xs text-slate-500 mt-2">
									Status <strong>Aktif</strong> hanya dapat digunakan jika jadwal pemilihan valid.
								</p>
							</div>
						</div>
						<div class="mt-7 pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:justify-end">
							<button type="button" onclick="VotingOsisSettingsService.resetForm()" class="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition">
								↩️ Reset
							</button>
							<button type="submit" id="btn-simpan-voting-osis-settings" class="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-blue-100 hover:from-blue-700 hover:to-indigo-700 transition">
								💾 Simpan Pengaturan
							</button>
						</div>
					</form>
				</div>
				${this.renderCurrentInfo(p)}
			</div>
		`;
		this.bindEvents();
	},
	renderStatusBadge(status) {
		const config = {
			draft: {
				className: 'bg-slate-100 text-slate-600 border-slate-200',
				icon: '📝',
				label: 'Draft'
			},
			aktif: {
				className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
				icon: '🟢',
				label: 'Aktif'
			},
			selesai: {
				className: 'bg-red-50 text-red-700 border-red-200',
				icon: '🔴',
				label: 'Selesai'
			}
		};
		const item = config[status] || config.draft;
		return `
			<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${item.className} text-xs font-extrabold">
				<span>${item.icon}</span>
				<span>${item.label}</span>
			</span>
		`;
	},
	renderResultInfo(enabled) {
		if (enabled) {
			return `
				<div class="flex items-start gap-3 rounded-xl bg-violet-50 border border-violet-100 p-3">
					<span class="text-lg">👁️</span>
					<p class="text-xs text-violet-700 leading-5">
						<strong>Hasil suara ditampilkan.</strong>
						Siswa dapat melihat perolehan suara sementara selama fitur ini aktif.
					</p>
				</div>
			`;
		}
		return `
			<div class="flex items-start gap-3 rounded-xl bg-slate-100 border border-slate-200 p-3">
				<span class="text-lg">🔒</span>
				<p class="text-xs text-slate-600 leading-5">
					<strong>Hasil suara disembunyikan.</strong>
					Siswa tidak dapat melihat hasil suara sementara.
				</p>
			</div>
		`;
	},
	renderCurrentInfo(p) {
		if (!p) {
			return `
				<div class="bg-amber-50 border border-amber-100 rounded-2xl p-4">
					<div class="flex items-start gap-3">
						<span class="text-xl">ℹ️</span>
						<div>
							<h3 class="font-bold text-amber-800 text-sm">Belum Ada Pemilihan</h3>
							<p class="text-xs text-amber-700 mt-1">
								Belum ditemukan data pemilihan Ketua OSIS.
							</p>
						</div>
					</div>
				</div>
			`;
		}
		return `
			<div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
				<div class="flex items-center gap-3 mb-4">
					<div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
						📋
					</div>
					<div>
						<h3 class="font-extrabold text-slate-800">Ringkasan Pemilihan</h3>
						<p class="text-xs text-slate-500 mt-0.5">Konfigurasi yang sedang digunakan.</p>
					</div>
				</div>
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<div class="rounded-2xl bg-slate-50 p-4">
						<p class="text-[11px] text-slate-500 font-semibold">Status</p>
						<div class="mt-2">${this.renderStatusBadge(p.status)}</div>
					</div>
					<div class="rounded-2xl bg-blue-50 p-4">
						<p class="text-[11px] text-slate-500 font-semibold">Mulai</p>
						<p class="text-sm font-bold text-blue-700 mt-2">${this.formatDate(p.tanggal_mulai)}</p>
						<p class="text-xs text-blue-600 mt-1">${this.normalizeTime(p.jam_mulai)} WITA</p>
					</div>
					<div class="rounded-2xl bg-red-50 p-4">
						<p class="text-[11px] text-slate-500 font-semibold">Selesai</p>
						<p class="text-sm font-bold text-red-700 mt-2">${this.formatDate(p.tanggal_selesai)}</p>
						<p class="text-xs text-red-600 mt-1">${this.normalizeTime(p.jam_selesai)} WITA</p>
					</div>
					<div class="rounded-2xl bg-violet-50 p-4">
						<p class="text-[11px] text-slate-500 font-semibold">Hasil Suara</p>
						<p class="text-sm font-bold ${p.tampilkan_hasil ? 'text-violet-700' : 'text-slate-500'} mt-2">
							${p.tampilkan_hasil ? 'Ditampilkan' : 'Disembunyikan'}
						</p>
					</div>
				</div>
			</div>
		`;
	},
	bindEvents() {
		const form = document.getElementById('form-voting-osis-settings');
		const toggle = document.getElementById('osis-setting-tampilkan-hasil');
		const info = document.getElementById('osis-setting-hasil-info');
		if (form) {
			form.addEventListener('submit', event => {
				event.preventDefault();
				this.save();
			});
		}
		if (toggle && info) {
			toggle.addEventListener('change', () => {
				info.innerHTML = this.renderResultInfo(toggle.checked);
			});
		}
	},
	async save() {
		if (this.loading) return;
		if (!this.pemilu?.id) {
			await Swal.fire({
				icon: 'warning',
				title: 'Data Tidak Ditemukan',
				text: 'Data pemilihan belum tersedia.'
			});
			return;
		}
		const nama = document.getElementById('osis-setting-nama')?.value.trim();
		const tahunAjaran = document.getElementById('osis-setting-tahun')?.value.trim();
		const tanggalMulai = document.getElementById('osis-setting-tanggal-mulai')?.value;
		const jamMulai = document.getElementById('osis-setting-jam-mulai')?.value;
		const tanggalSelesai = document.getElementById('osis-setting-tanggal-selesai')?.value;
		const jamSelesai = document.getElementById('osis-setting-jam-selesai')?.value;
		const status = document.getElementById('osis-setting-status')?.value;
		const tampilkanHasil = document.getElementById('osis-setting-tampilkan-hasil')?.checked || false;
		if (!nama || !tahunAjaran || !tanggalMulai || !jamMulai || !tanggalSelesai || !jamSelesai) {
			await Swal.fire({
				icon: 'warning',
				title: 'Data Belum Lengkap',
				text: 'Silakan lengkapi seluruh pengaturan pemilihan.'
			});
			return;
		}
		try {
			this.loading = true;
			const button = document.getElementById('btn-simpan-voting-osis-settings');
			if (button) {
				button.disabled = true;
				button.innerHTML = '⏳ Menyimpan...';
			}
			const { data: validation, error: validationError } = await supabase.rpc(
				'validate_osis_pemilu_config',
				{
					p_tanggal_mulai: tanggalMulai,
					p_jam_mulai: jamMulai,
					p_tanggal_selesai: tanggalSelesai,
					p_jam_selesai: jamSelesai
				}
			);
			if (validationError) throw validationError;
			if (!validation?.success) {
				throw new Error(validation?.message || 'Jadwal pemilihan tidak valid.');
			}
			if (status === 'aktif') {
				const now = new Date();
				const mulai = this.createWitaDate(tanggalMulai, jamMulai);
				const selesai = this.createWitaDate(tanggalSelesai, jamSelesai);
				if (now < mulai) {
					await Swal.fire({
						icon: 'warning',
						title: 'Belum Memasuki Jadwal',
						text: 'Status Aktif tidak dapat digunakan sebelum waktu mulai pemilihan.'
					});
					return;
				}
				if (now > selesai) {
					await Swal.fire({
						icon: 'warning',
						title: 'Jadwal Sudah Berakhir',
						text: 'Status Aktif tidak dapat digunakan karena waktu pemilihan sudah berakhir.'
					});
					return;
				}
			}
			const { data, error } = await supabase
				.from('pemilu_osis')
				.update({
					nama,
					tahun_ajaran: tahunAjaran,
					tanggal_mulai: tanggalMulai,
					jam_mulai: jamMulai,
					tanggal_selesai: tanggalSelesai,
					jam_selesai: jamSelesai,
					status,
					tampilkan_hasil: tampilkanHasil,
					updated_at: new Date().toISOString()
				})
				.eq('id', this.pemilu.id)
				.select()
				.single();
			if (error) throw error;
			this.pemilu = data;
			await Swal.fire({
				icon: 'success',
				title: 'Berhasil Disimpan',
				text: 'Pengaturan pemilihan berhasil diperbarui.',
				confirmButtonColor: '#4f46e5'
			});
			this.render(document.getElementById('voting-osis-settings-container'));
		} catch (error) {
			console.error('Gagal menyimpan pengaturan:', error);
			await Swal.fire({
				icon: 'error',
				title: 'Gagal Menyimpan',
				text: error.message || 'Terjadi kesalahan saat menyimpan pengaturan.',
				confirmButtonColor: '#4f46e5'
			});
		} finally {
			this.loading = false;
			const button = document.getElementById('btn-simpan-voting-osis-settings');
			if (button) {
				button.disabled = false;
				button.innerHTML = '💾 Simpan Pengaturan';
			}
		}
	},
	resetForm() {
		if (!this.pemilu) return;
		const nama = document.getElementById('osis-setting-nama');
		const tahun = document.getElementById('osis-setting-tahun');
		const tanggalMulai = document.getElementById('osis-setting-tanggal-mulai');
		const jamMulai = document.getElementById('osis-setting-jam-mulai');
		const tanggalSelesai = document.getElementById('osis-setting-tanggal-selesai');
		const jamSelesai = document.getElementById('osis-setting-jam-selesai');
		const status = document.getElementById('osis-setting-status');
		const tampilkanHasil = document.getElementById('osis-setting-tampilkan-hasil');
		const info = document.getElementById('osis-setting-hasil-info');
		if (nama) nama.value = this.pemilu.nama || '';
		if (tahun) tahun.value = this.pemilu.tahun_ajaran || '';
		if (tanggalMulai) tanggalMulai.value = this.pemilu.tanggal_mulai || '';
		if (jamMulai) jamMulai.value = this.normalizeTime(this.pemilu.jam_mulai);
		if (tanggalSelesai) tanggalSelesai.value = this.pemilu.tanggal_selesai || '';
		if (jamSelesai) jamSelesai.value = this.normalizeTime(this.pemilu.jam_selesai);
		if (status) status.value = this.pemilu.status || 'draft';
		if (tampilkanHasil) tampilkanHasil.checked = Boolean(this.pemilu.tampilkan_hasil);
		if (info) info.innerHTML = this.renderResultInfo(Boolean(this.pemilu.tampilkan_hasil));
	},
	createWitaDate(date, time) {
		return new Date(`${date}T${time}:00+08:00`);
	},
	normalizeTime(value) {
		if (!value) return '';
		return String(value).substring(0, 5);
	},
	formatDate(value) {
		if (!value) return '-';
		try {
			const date = new Date(`${value}T00:00:00+08:00`);
			return date.toLocaleDateString('id-ID', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
				timeZone: 'Asia/Makassar'
			});
		} catch (error) {
			return value;
		}
	},
	escapeHtml(value) {
		return String(value ?? '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	},
	escapeAttribute(value) {
		return this.escapeHtml(value);
	}
};
window.VotingOsisSettingsService = VotingOsisSettingsService;