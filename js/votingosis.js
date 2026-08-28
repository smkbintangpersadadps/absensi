const VotingOsisService = {
	pemilu: null,
	kandidat: [],
	status: null,
	initialized: false,
	async init() {
		if (this.initialized) {
			await this.refresh();
			return;
		}
		this.initialized = true;
		await this.refresh();
	},
	async refresh() {
		try {
			await this.loadPemilu();
			if (!this.pemilu) {
				this.renderNoPemilu();
				return;
			}
			await this.loadKandidat();
			await this.loadStatus();
			this.render();
		} catch (error) {
			console.error('VotingOsisService.refresh error:', error);
			this.renderError(error.message || 'Gagal memuat data voting');
		}
	},
	async loadPemilu() {
        
		const { data, error } = await window.supabaseClient
			.from('pemilu_osis')
			.select('*')
			.eq('status', 'aktif')
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle();
		if (error) throw error;
		this.pemilu = data;
	},
	async loadKandidat() {
		if (!this.pemilu) {
			this.kandidat = [];
			return;
		}
		const { data, error } = await window.supabaseClient
			.from('kandidat_osis')
			.select('*')
			.eq('pemilu_id', this.pemilu.id)
			.eq('status', true)
			.order('nomor_urut', { ascending: true });
		if (error) throw error;
		this.kandidat = data || [];
	},
	async loadStatus() {
		this.status = null;
		const username = this.getUsername();
		if (!username || !this.pemilu) return;
		const { data, error } = await window.supabaseClient
			.from('dpt_osis')
			.select('id,username,nama,kelas,sudah_memilih,waktu_memilih')
			.eq('pemilu_id', this.pemilu.id)
			.ilike('username', username)
			.maybeSingle();
		if (error) throw error;
		this.status = data;
	},
	getUsername() {
		const user = window.AppState?.currentUser || {};
		return String(
			user.username ||
			user.Username ||
			user.user_name ||
			user.userName ||
			''
		).trim();
	},
	render() {
		const container = document.getElementById('voting-osis-container');
		if (!container) return;
		if (!this.pemilu) {
			this.renderNoPemilu();
			return;
		}
		if (!this.status) {
			container.innerHTML = `
				<div class="bg-white rounded-2xl border border-slate-200 p-6 text-center">
					<div class="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-2xl">⚠️</div>
					<h3 class="mt-4 font-bold text-slate-800">Anda Tidak Terdaftar</h3>
					<p class="mt-2 text-sm text-slate-500">Akun Anda tidak terdaftar sebagai pemilih pada pemilihan ini.</p>
				</div>
			`;
			return;
		}
		if (this.status.sudah_memilih) {
			this.renderAlreadyVoted();
			return;
		}
		this.renderVotingForm();
	},
	renderVotingForm() {
		const container = document.getElementById('voting-osis-container');
		if (!container) return;
		container.innerHTML = `
			<div class="space-y-5">
				<div class="bg-white rounded-2xl border border-slate-200 p-5">
					<div class="flex items-start gap-4">
						<div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl shrink-0">🗳️</div>
						<div class="min-w-0">
							<h2 class="text-lg font-bold text-slate-800">${this.escapeHtml(this.pemilu.nama)}</h2>
							<p class="text-sm text-slate-500 mt-1">Tahun Ajaran ${this.escapeHtml(this.pemilu.tahun_ajaran)}</p>
						</div>
					</div>
					${this.pemilu.deskripsi ? `<p class="text-sm text-slate-600 mt-4">${this.escapeHtml(this.pemilu.deskripsi)}</p>` : ''}
					<div class="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-4">
						<p class="text-sm text-blue-800 font-medium">Silakan pilih satu kandidat yang menurut Anda paling tepat untuk menjadi Ketua OSIS.</p>
						<p class="text-xs text-blue-600 mt-1">Pilihan Anda akan direkam sebagai satu suara.</p>
					</div>
				</div>
				<div>
					<div class="flex items-center justify-between mb-3">
						<div>
							<h3 class="font-bold text-slate-800">Daftar Kandidat</h3>
							<p class="text-xs text-slate-500 mt-1">${this.kandidat.length} kandidat tersedia</p>
						</div>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						${this.kandidat.map(kandidat => this.renderCandidateCard(kandidat)).join('')}
					</div>
				</div>
			</div>
		`;
	},
	renderCandidateCard(kandidat) {
		const foto = kandidat.foto_url
			? `<img src="${this.escapeAttribute(kandidat.foto_url)}" alt="${this.escapeAttribute(kandidat.nama)}" class="w-full h-full object-cover">`
			: `<div class="w-full h-full flex items-center justify-center text-5xl bg-slate-100">👤</div>`;
		return `
			<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
				<div class="aspect-[4/3] bg-slate-100 overflow-hidden">
					${foto}
				</div>
				<div class="p-4">
					<div class="flex items-center justify-between gap-3">
						<span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">NO. ${String(kandidat.nomor_urut).padStart(2, '0')}</span>
						<span class="text-xs text-slate-400">${this.escapeHtml(kandidat.kelas || '')}</span>
					</div>
					<h4 class="font-bold text-slate-800 mt-3">${this.escapeHtml(kandidat.nama)}</h4>
					<div class="grid grid-cols-2 gap-2 mt-4">
						<button type="button" onclick="VotingOsisService.showProfile('${this.escapeAttribute(kandidat.id)}')" class="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">Lihat Profil</button>
						<button type="button" onclick="VotingOsisService.confirmVote('${this.escapeAttribute(kandidat.id)}')" class="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">Pilih</button>
					</div>
				</div>
			</div>
		`;
	},
	showProfile(kandidatId) {
		const kandidat = this.kandidat.find(item => item.id === kandidatId);
		if (!kandidat) return;
		const modal = document.getElementById('voting-osis-modal');
		if (!modal) return;
		const foto = kandidat.foto_url
			? `<img src="${this.escapeAttribute(kandidat.foto_url)}" alt="${this.escapeAttribute(kandidat.nama)}" class="w-28 h-28 rounded-2xl object-cover mx-auto">`
			: `<div class="w-28 h-28 rounded-2xl bg-slate-100 flex items-center justify-center text-5xl mx-auto">👤</div>`;
		modal.innerHTML = `
			<div class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
				<div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
					<div class="p-5 border-b border-slate-200 flex items-center justify-between">
						<h3 class="font-bold text-slate-800">Profil Kandidat</h3>
						<button type="button" onclick="VotingOsisService.closeModal()" class="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-500">✕</button>
					</div>
					<div class="p-5">
						${foto}
						<div class="text-center mt-4">
							<span class="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">KANDIDAT ${String(kandidat.nomor_urut).padStart(2, '0')}</span>
							<h4 class="text-xl font-bold text-slate-800 mt-2">${this.escapeHtml(kandidat.nama)}</h4>
							${kandidat.kelas ? `<p class="text-sm text-slate-500">${this.escapeHtml(kandidat.kelas)}</p>` : ''}
						</div>
						<div class="space-y-4 mt-6">
							${this.renderProfileSection('Visi', kandidat.visi)}
							${this.renderProfileSection('Misi', kandidat.misi)}
							${this.renderProfileSection('Program Unggulan', kandidat.program_unggulan)}
						</div>
						<button type="button" onclick="VotingOsisService.closeModal();VotingOsisService.confirmVote('${this.escapeAttribute(kandidat.id)}')" class="w-full mt-6 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">Pilih Kandidat Ini</button>
					</div>
				</div>
			</div>
		`;
		modal.classList.remove('hidden');
	},
	renderProfileSection(title, value) {
		if (!value) return '';
		return `
			<div>
				<h5 class="text-sm font-bold text-slate-800">${this.escapeHtml(title)}</h5>
				<div class="mt-2 text-sm text-slate-600 whitespace-pre-line">${this.escapeHtml(value)}</div>
			</div>
		`;
	},
	confirmVote(kandidatId) {
		const kandidat = this.kandidat.find(item => item.id === kandidatId);
		if (!kandidat) return;
		const modal = document.getElementById('voting-osis-modal');
		if (!modal) return;
		modal.innerHTML = `
			<div class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
				<div class="bg-white rounded-2xl shadow-xl w-full max-w-md">
					<div class="p-6 text-center">
						<div class="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-3xl">🗳️</div>
						<h3 class="text-xl font-bold text-slate-800 mt-4">Konfirmasi Pilihan</h3>
						<p class="text-sm text-slate-500 mt-2">Anda akan memilih:</p>
						<div class="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
							<div class="text-xs text-slate-500">Kandidat ${String(kandidat.nomor_urut).padStart(2, '0')}</div>
							<div class="font-bold text-slate-800 mt-1">${this.escapeHtml(kandidat.nama)}</div>
						</div>
						<p class="text-xs text-red-500 mt-4">Pilihan tidak dapat diubah setelah dikonfirmasi.</p>
						<div class="grid grid-cols-2 gap-3 mt-6">
							<button type="button" onclick="VotingOsisService.closeModal()" class="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold">Batal</button>
							<button type="button" onclick="VotingOsisService.submitVote('${this.escapeAttribute(kandidat.id)}')" class="px-4 py-3 rounded-xl bg-blue-600 text-white font-bold">Ya, Saya Memilih</button>
						</div>
					</div>
				</div>
			</div>
		`;
		modal.classList.remove('hidden');
	},
	async submitVote(kandidatId) {
		const username = this.getUsername();
		if (!username) {
			this.showAlert('error', 'Akun siswa tidak ditemukan.');
			return;
		}
		if (!this.pemilu) {
			this.showAlert('error', 'Pemilihan tidak ditemukan.');
			return;
		}
		try {
			this.closeModal();
			showLoader("Memuat monitoring jurnal...");
			const { data, error } = await window.supabaseClient.rpc('submit_osis_vote', {
				p_pemilu_id: this.pemilu.id,
				p_kandidat_id: kandidatId,
				p_username: username
			});
			if (error) throw error;
			if (!data?.success) {
				throw new Error(data?.message || 'Voting gagal.');
			}
			await this.loadStatus();
			hideLoader();
			this.renderAlreadyVoted(true);
		} catch (error) {
			console.error('Voting gagal:', error);
			hideLoader();
			this.showAlert('error', error.message || 'Gagal menyimpan suara.');
		}
	},
	renderAlreadyVoted(showSuccess = false) {
		const container = document.getElementById('voting-osis-container');
		if (!container) return;
		container.innerHTML = `
			<div class="bg-white rounded-2xl border border-green-200 p-6 text-center">
				<div class="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center text-3xl">✓</div>
				<h2 class="text-xl font-bold text-slate-800 mt-4">${showSuccess ? 'Suara Berhasil Direkam' : 'Anda Sudah Memilih'}</h2>
				<p class="text-sm text-slate-500 mt-2">Terima kasih telah menggunakan hak pilih Anda dalam Pemilihan Ketua OSIS.</p>
				<div class="mt-5 rounded-xl bg-green-50 border border-green-100 p-4">
					<p class="text-sm text-green-700 font-medium">Hak pilih Anda sudah digunakan.</p>
					<p class="text-xs text-green-600 mt-1">Anda tidak dapat melakukan voting kembali.</p>
				</div>
			</div>
		`;
	},
	renderNoPemilu() {
		const container = document.getElementById('voting-osis-container');
		if (!container) return;
		container.innerHTML = `
			<div class="bg-white rounded-2xl border border-slate-200 p-6 text-center">
				<div class="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-2xl">🗳️</div>
				<h3 class="mt-4 font-bold text-slate-800">Belum Ada Pemilihan</h3>
				<p class="mt-2 text-sm text-slate-500">Saat ini belum ada Pemilihan Ketua OSIS yang sedang berlangsung.</p>
			</div>
		`;
	},
	renderError(message) {
		const container = document.getElementById('voting-osis-container');
		if (!container) return;
		container.innerHTML = `
			<div class="bg-white rounded-2xl border border-red-200 p-6 text-center">
				<div class="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center text-2xl">⚠️</div>
				<h3 class="mt-4 font-bold text-slate-800">Gagal Memuat Voting</h3>
				<p class="mt-2 text-sm text-slate-500">${this.escapeHtml(message)}</p>
				<button type="button" onclick="VotingOsisService.refresh()" class="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">Coba Lagi</button>
			</div>
		`;
	},
	showLoading() {
		const modal = document.getElementById('voting-osis-modal');
		if (!modal) return;
		modal.innerHTML = `
			<div class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
				<div class="bg-white rounded-2xl shadow-xl p-6 text-center w-full max-w-sm">
					<div class="w-12 h-12 mx-auto border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
					<p class="font-semibold text-slate-800 mt-4">Menyimpan suara...</p>
					<p class="text-xs text-slate-500 mt-1">Mohon jangan menutup halaman.</p>
				</div>
			</div>
		`;
		modal.classList.remove('hidden');
	},
	hideLoading() {
		this.closeModal();
	},
	closeModal() {
		const modal = document.getElementById('voting-osis-modal');
		if (!modal) return;
		modal.innerHTML = '';
		modal.classList.add('hidden');
	},
	showAlert(type, message) {
		if (typeof Swal !== 'undefined') {
			Swal.fire({
				icon: type,
				text: message,
				confirmButtonText: 'OK'
			});
			return;
		}
		alert(message);
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
		return String(value ?? '')
			.replace(/\\/g, '\\\\')
			.replace(/'/g, "\\'")
			.replace(/"/g, '&quot;');
	}
};
window.VotingOsisService = VotingOsisService;

const VotingOsisAdminService = {
	pemilu: null,
	stats: null,
	kandidat: [],
	kelas: [],
	initialized: false,
	loading: false,
	async init() {
		if (this.initialized) {
			await this.refresh();
			return;
		}
		this.initialized = true;
		await this.refresh();
	},
	async refresh() {
		showLoader("Memuat data pemilu...");
		try {
			await this.loadPemilu();
			if (!this.pemilu) {
				this.renderNoPemilu();
				return;
			}
			await Promise.all([
				this.loadStats(),
				this.loadKandidat(),
				this.loadKelas()
			]);
			this.render();
		} catch (error) {
			console.error('VotingOsisAdminService.refresh error:', error);
			this.renderError(error.message || 'Gagal memuat dashboard voting');
		} finally {
			hideLoader();
		}
	},
	async loadPemilu() {
		const { data, error } = await window.supabaseClient
			.from('pemilu_osis')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle();
		if (error) throw error;
		this.pemilu = data;
	},
	async loadStats() {
		const { data, error } = await window.supabaseClient.rpc(
			'get_osis_dashboard_stats',
			{
				p_pemilu_id: this.pemilu.id
			}
		);
		if (error) throw error;
		this.stats = data || {
			total_dpt: 0,
			sudah_memilih: 0,
			belum_memilih: 0,
			total_suara: 0,
			partisipasi: 0
		};
	},
	async loadKandidat() {
		const { data, error } = await window.supabaseClient.rpc(
			'get_osis_vote_recap',
			{
				p_pemilu_id: this.pemilu.id
			}
		);
		if (error) throw error;
		this.kandidat = data || [];
	},
	async loadKelas() {
		const { data, error } = await window.supabaseClient.rpc(
			'get_osis_class_recap',
			{
				p_pemilu_id: this.pemilu.id
			}
		);
		if (error) throw error;
		this.kelas = data || [];
	},
	render() {
		const container = document.getElementById('voting-osis-admin-container');
		if (!container) return;
		container.innerHTML = `
			<div class="space-y-5">
				${this.renderHeader()}
				${this.renderStats()}
				<div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
					${this.renderCandidateRecap()}
					${this.renderClassRecap()}
				</div>
			</div>
		`;
	},
	renderHeader() {
		const status = this.pemilu.status;
		const statusConfig = {
			draft: {
				label: 'Draft',
				className: 'bg-slate-100 text-slate-700'
			},
			aktif: {
				label: 'Voting Berlangsung',
				className: 'bg-green-100 text-green-700'
			},
			selesai: {
				label: 'Voting Selesai',
				className: 'bg-blue-100 text-blue-700'
			}
		};
		const config = statusConfig[status] || statusConfig.draft;
		return `
			<div class="bg-white rounded-2xl border border-slate-200 p-5">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div class="flex items-start gap-4">
						<div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl shrink-0">🗳️</div>
						<div>
							<h1 class="text-xl font-bold text-slate-800">${this.escapeHtml(this.pemilu.nama)}</h1>
							<p class="text-sm text-slate-500 mt-1">Tahun Ajaran ${this.escapeHtml(this.pemilu.tahun_ajaran)}</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<span class="inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold ${config.className}">
							<span class="w-2 h-2 rounded-full bg-current mr-2"></span>
							${config.label}
						</span>
						<button type="button" onclick="VotingOsisAdminService.refresh()" class="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50" title="Refresh">
							↻
						</button>
					</div>
				</div>
			</div>
		`;
	},
	renderStats() {
		const totalDpt = Number(this.stats?.total_dpt || 0);
		const sudahMemilih = Number(this.stats?.sudah_memilih || 0);
		const belumMemilih = Number(this.stats?.belum_memilih || 0);
		const partisipasi = Number(this.stats?.partisipasi || 0);
		return `
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
				${this.renderStatCard(
					'Total DPT',
					this.formatNumber(totalDpt),
					'👨‍🎓',
					'blue',
					'Jumlah siswa yang memiliki hak pilih'
				)}
				${this.renderStatCard(
					'Suara Masuk',
					this.formatNumber(sudahMemilih),
					'🗳️',
					'green',
					'Jumlah siswa yang sudah memilih'
				)}
				${this.renderStatCard(
					'Belum Memilih',
					this.formatNumber(belumMemilih),
					'⏳',
					'orange',
					'Jumlah siswa yang belum menggunakan hak pilih'
				)}
				${this.renderStatCard(
					'Partisipasi',
					partisipasi.toFixed(2) + '%',
					'📊',
					'purple',
					'Persentase siswa yang sudah memilih'
				)}
			</div>
		`;
	},
	renderStatCard(title, value, icon, color, description) {
		const colors = {
			blue: 'bg-blue-50 text-blue-600',
			green: 'bg-green-50 text-green-600',
			orange: 'bg-orange-50 text-orange-600',
			purple: 'bg-purple-50 text-purple-600'
		};
		return `
			<div class="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-xs sm:text-sm font-medium text-slate-500">${title}</p>
						<p class="text-xl sm:text-2xl font-bold text-slate-800 mt-1">${value}</p>
					</div>
					<div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${colors[color] || colors.blue}">
						${icon}
					</div>
				</div>
				<p class="text-[11px] text-slate-400 mt-3 leading-relaxed">${description}</p>
			</div>
		`;
	},
	renderCandidateRecap() {
		const totalSuara = Number(this.stats?.total_suara || 0);
		return `
			<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
				<div class="p-5 border-b border-slate-200">
					<div class="flex items-center justify-between gap-3">
						<div>
							<h2 class="font-bold text-slate-800">Perolehan Suara Kandidat</h2>
							<p class="text-xs text-slate-500 mt-1">Rekap suara yang telah masuk</p>
						</div>
						<div class="text-xs font-semibold text-slate-500">
							${this.formatNumber(totalSuara)} suara
						</div>
					</div>
				</div>
				<div class="p-5">
					${this.kandidat.length ? this.kandidat.map(kandidat => this.renderCandidateRow(kandidat, totalSuara)).join('') : this.renderEmpty('Belum ada data kandidat')}
				</div>
			</div>
		`;
	},
	renderCandidateRow(kandidat, totalSuara) {
		const suara = Number(kandidat.jumlah_suara || 0);
		const persentase = totalSuara > 0 ? (suara / totalSuara) * 100 : 0;
		const foto = kandidat.foto_url
			? `<img src="${this.escapeAttribute(kandidat.foto_url)}" alt="${this.escapeAttribute(kandidat.nama)}" class="w-full h-full object-cover">`
			: `<div class="w-full h-full flex items-center justify-center text-xl bg-slate-100">👤</div>`;
		return `
			<div class="mb-5 last:mb-0">
				<div class="flex items-center gap-3 mb-2">
					<div class="w-10 h-10 rounded-xl overflow-hidden shrink-0">
						${foto}
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-center justify-between gap-3">
							<div class="flex items-center gap-2 min-w-0">
								<span class="text-xs font-bold text-blue-600 shrink-0">NO. ${String(kandidat.nomor_urut).padStart(2, '0')}</span>
								<span class="font-semibold text-slate-800 truncate">${this.escapeHtml(kandidat.nama)}</span>
							</div>
							<div class="text-right shrink-0">
								<span class="font-bold text-slate-800">${this.formatNumber(suara)}</span>
								<span class="text-xs text-slate-400 ml-1">${persentase.toFixed(2)}%</span>
							</div>
						</div>
					</div>
				</div>
				<div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
					<div class="h-full rounded-full bg-blue-500 transition-all duration-500" style="width:${Math.min(persentase, 100)}%"></div>
				</div>
			</div>
		`;
	},
	renderClassRecap() {
		return `
			<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
				<div class="p-5 border-b border-slate-200">
					<div>
						<h2 class="font-bold text-slate-800">Partisipasi Per Kelas</h2>
						<p class="text-xs text-slate-500 mt-1">Jumlah siswa yang sudah menggunakan hak pilih</p>
					</div>
				</div>
				<div class="p-5">
					${this.kelas.length ? this.kelas.map(kelas => this.renderClassRow(kelas)).join('') : this.renderEmpty('Belum ada data kelas')}
				</div>
			</div>
		`;
	},
	renderClassRow(item) {
		const total = Number(item.total_dpt || 0);
		const sudah = Number(item.sudah_memilih || 0);
		const belum = Number(item.belum_memilih || 0);
		const persentase = Number(item.persentase || 0);
		return `
			<div class="py-3 first:pt-0 last:pb-0 border-b last:border-b-0 border-slate-100">
				<div class="flex items-center justify-between gap-3">
					<div class="min-w-0">
						<p class="font-semibold text-slate-800 truncate">${this.escapeHtml(item.kelas || 'Tidak Diketahui')}</p>
						<p class="text-xs text-slate-400 mt-1">${this.formatNumber(sudah)} dari ${this.formatNumber(total)} siswa memilih</p>
					</div>
					<div class="text-right shrink-0">
						<p class="font-bold text-slate-800">${persentase.toFixed(2)}%</p>
						<p class="text-xs text-orange-500">${this.formatNumber(belum)} belum</p>
					</div>
				</div>
				<div class="mt-2 w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
					<div class="h-full rounded-full bg-green-500 transition-all duration-500" style="width:${Math.min(persentase, 100)}%"></div>
				</div>
			</div>
		`;
	},
	renderNoPemilu() {
		const container = document.getElementById('voting-osis-admin-container');
		if (!container) return;
		container.innerHTML = `
			<div class="bg-white rounded-2xl border border-slate-200 p-8 text-center">
				<div class="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-3xl">🗳️</div>
				<h2 class="text-lg font-bold text-slate-800 mt-4">Belum Ada Pemilihan</h2>
				<p class="text-sm text-slate-500 mt-2">Belum terdapat data pemilihan Ketua OSIS.</p>
			</div>
		`;
	},
	renderEmpty(message) {
		return `
			<div class="py-8 text-center">
				<p class="text-sm text-slate-400">${this.escapeHtml(message)}</p>
			</div>
		`;
	},
	renderError(message) {
		const container = document.getElementById('voting-osis-admin-container');
		if (!container) return;
		container.innerHTML = `
			<div class="bg-white rounded-2xl border border-red-200 p-8 text-center">
				<div class="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center text-2xl">⚠️</div>
				<h2 class="text-lg font-bold text-slate-800 mt-4">Gagal Memuat Dashboard</h2>
				<p class="text-sm text-slate-500 mt-2">${this.escapeHtml(message)}</p>
				<button type="button" onclick="VotingOsisAdminService.refresh()" class="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">Coba Lagi</button>
			</div>
		`;
	},
	formatNumber(value) {
		return Number(value || 0).toLocaleString('id-ID');
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
		return String(value ?? '')
			.replace(/\\/g, '\\\\')
			.replace(/'/g, "\\'")
			.replace(/"/g, '&quot;');
	}
};
window.VotingOsisAdminService = VotingOsisAdminService;