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
		showLoader("Memuat data pemilu...");
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
		} finally {
			hideLoader();
		}
	},
	
	async loadPemilu() {
		try {
			const { data, error } = await window.supabaseClient
				.from('pemilu_osis')
				.select('*')
				.in('status', ['aktif', 'selesai'])
				.order('created_at', { ascending: false })
				.limit(1)
				.maybeSingle();
			if (error) throw error;
			this.pemilu = data || null;
			console.log('Pemilu OSIS:', this.pemilu);
		} catch (error) {
			console.error('Gagal memuat pemilu OSIS:', error);
			this.pemilu = null;
		}
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
	// render() {
	// 	const container = document.getElementById('voting-osis-container');
	// 	if (!container) return;
	// 	if (!this.pemilu) {
	// 		this.renderNoPemilu();
	// 		return;
	// 	}
	// 	this.renderPemiluSchedule();
	// 	if (!this.status) {
	// 		container.innerHTML = `
	// 			<div class="bg-white rounded-2xl border border-slate-200 p-6 text-center">
	// 				<div class="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-2xl">⚠️</div>
	// 				<h3 class="mt-4 font-bold text-slate-800">Anda Tidak Terdaftar</h3>
	// 				<p class="mt-2 text-sm text-slate-500">Akun Anda tidak terdaftar sebagai pemilih pada pemilihan ini.</p>
	// 			</div>
	// 		`;
	// 		this.clearVoteResult();
	// 		return;
	// 	}
	// 	if (this.status.sudah_memilih) {
	// 		this.renderAlreadyVoted();
	// 	} else {
	// 		this.renderVotingForm();
	// 	}
	// 	this.loadVoteResult(this.pemilu.id);
	// },
	render() {
		const container = document.getElementById('voting-osis-container');
		if (!container) return;
		const resultContainer = document.getElementById('voting-osis-result-container');
		if (!this.pemilu) {
			if (resultContainer) resultContainer.innerHTML = '';
			this.renderNoPemilu();
			return;
		}
		if (this.pemilu.status === 'selesai') {
			container.innerHTML = '';
			this.loadFinalResult();
			return;
		}
		if (resultContainer) {
			resultContainer.innerHTML = '';
		}
		this.renderPemiluSchedule();
		if (!this.status) {
			container.innerHTML = `
				<div class="bg-white rounded-2xl border border-slate-200 p-6 text-center">
					<div class="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-2xl">
						⚠️
					</div>
					<h3 class="mt-4 font-bold text-slate-800">Anda Tidak Terdaftar</h3>
					<p class="mt-2 text-sm text-slate-500">
						Akun Anda tidak terdaftar sebagai pemilih pada pemilihan ini.
					</p>
				</div>
			`;
			this.clearVoteResult();
			return;
		}
		if (this.status.sudah_memilih) {
			this.renderAlreadyVoted();
		} else {
			this.renderVotingForm();
		}
		this.loadVoteResult(this.pemilu.id);
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
			? `<div class="relative mx-auto w-32 h-32">
				<div class="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400 to-indigo-600 blur-sm opacity-30"></div>
				<img src="${this.escapeAttribute(kandidat.foto_url)}" alt="${this.escapeAttribute(kandidat.nama)}" class="relative w-32 h-32 rounded-3xl object-cover mx-auto ring-4 ring-white shadow-lg">
			</div>`
			: `<div class="relative mx-auto w-32 h-32">
				<div class="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-6xl shadow-inner ring-4 ring-white">👤</div>
			</div>`;
		modal.innerHTML = `
			<div class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
				<div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
					<div class="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-5 pt-5 pb-20">
						<button type="button" onclick="VotingOsisService.closeModal()" class="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition backdrop-blur-sm">✕</button>
						<div class="text-center">
							<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm border border-white/20">
								<span>🗳️</span>
								<span>PEMILIHAN KETUA OSIS</span>
							</div>
							<h3 class="text-2xl sm:text-3xl text-white mt-4 tracking-tight">Profil Kandidat Ketua OSIS</h3>
							<p class="text-blue-100 text-sm mt-2">Kenali visi, misi, dan program unggulan kandidat</p>
						</div>
					</div>
					<div class="px-5 pb-5 -mt-14">
						<div class="bg-white rounded-3xl shadow-lg border border-slate-100 p-5">
							${foto}
							<div class="text-center mt-4">
								<span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 text-xs font-extrabold">
									<span>NO.</span>
									<span>${String(kandidat.nomor_urut).padStart(2, '0')}</span>
								</span>
								<h4 class="text-2xl font-extrabold text-slate-800 mt-3">${this.escapeHtml(kandidat.nama)}</h4>
								${kandidat.kelas ? `<p class="text-sm text-slate-500 mt-1">${this.escapeHtml(kandidat.kelas)}</p>` : ''} 
							</div>
							<div class="space-y-4 mt-7">
								${this.renderProfileSection('Visi', kandidat.visi)}
								${this.renderProfileSection('Misi', kandidat.misi)}
								${this.renderProfileSection('Program Unggulan', kandidat.program_unggulan)}
								${this.renderOrasiSection(kandidat.link_orasi)}
							</div>
							<button type="button" onclick="VotingOsisService.closeModal();VotingOsisService.confirmVote('${this.escapeAttribute(kandidat.id)}')" class="w-full mt-7 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition flex items-center justify-center gap-2">
								<span class="text-lg">🗳️</span>
								<span>Pilih Kandidat Ini</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		`;
		modal.classList.remove('hidden');
	},
	renderProfileSection(title, content) {
		if (!content) return '';
		const config = {
			'Visi': {
				icon: '🎯',
				bg: 'bg-blue-50',
				border: 'border-blue-100',
				iconBg: 'bg-blue-100',
				title: 'text-blue-700',
				accent: 'border-l-blue-500'
			},
			'Misi': {
				icon: '🚀',
				bg: 'bg-emerald-50',
				border: 'border-emerald-100',
				iconBg: 'bg-emerald-100',
				title: 'text-emerald-700',
				accent: 'border-l-emerald-500'
			},
			'Program Unggulan': {
				icon: '⭐',
				bg: 'bg-amber-50',
				border: 'border-amber-100',
				iconBg: 'bg-amber-100',
				title: 'text-amber-700',
				accent: 'border-l-amber-500'
			}
		};
		const style = config[title] || {
			icon: '📌',
			bg: 'bg-slate-50',
			border: 'border-slate-100',
			iconBg: 'bg-slate-100',
			title: 'text-slate-700',
			accent: 'border-l-slate-500'
		};
		return `
			<div class="${style.bg} ${style.border} border rounded-2xl overflow-hidden">
				<div class="px-4 py-3 flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl ${style.iconBg} flex items-center justify-center text-lg shrink-0">
						${style.icon}
					</div>
					<div>
						<h5 class="text-sm font-extrabold ${style.title}">${title}</h5>
						<div class="w-8 h-1 rounded-full bg-current opacity-20 mt-1"></div>
					</div>
				</div>
				<div class="px-4 pb-4">
					<div class="bg-white/80 rounded-xl border border-white px-4 py-3 border-l-4 ${style.accent}">
						<p class="text-sm leading-6 text-slate-600 whitespace-pre-line">${this.escapeHtml(content)}</p>
					</div>
				</div>
			</div>
		`;
	},
	renderOrasiSection(link) {
		if (!link) return '';
		let safeUrl = '';
		try {
			const url = new URL(link);
			if (!['http:', 'https:'].includes(url.protocol)) return '';
			safeUrl = this.escapeAttribute(url.href);
		} catch (error) {
			return '';
		}
		return `
			<div class="rounded-2xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100 p-4">
				<div class="flex items-center gap-3">
					<div class="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center text-xl shrink-0">
						🎥
					</div>
					<div class="flex-1 min-w-0">
						<h5 class="text-sm font-extrabold text-violet-700">Video Orasi Kandidat</h5>
						<p class="text-xs text-slate-500 mt-0.5">Saksikan penyampaian visi dan gagasan kandidat</p>
					</div>
				</div>
				<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 active:scale-[0.98] transition shadow-sm">
					<span>▶️</span>
					<span>Lihat Video Orasi</span>
				</a>
			</div>
		`;
	},
	renderPemiluSchedule() {
		const container = document.getElementById('voting-osis-schedule-container');
		if (!container || !this.pemilu) return;
		const formatTanggal = tanggal => {
			if (!tanggal) return '-';
			const date = new Date(`${tanggal}T00:00:00`);
			return date.toLocaleDateString('id-ID', {
				day: '2-digit',
				month: 'long',
				year: 'numeric'
			});
		};
		const formatJam = jam => {
			if (!jam) return '-';
			return jam.substring(0, 5);
		};
		const start = `${formatTanggal(this.pemilu.tanggal_mulai)} ${formatJam(this.pemilu.jam_mulai)}`;
		const finish = `${formatTanggal(this.pemilu.tanggal_selesai)} ${formatJam(this.pemilu.jam_selesai)}`;
		container.innerHTML = `
			<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5">
				<div class="flex items-start gap-3">
					<div class="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
						<i class="fas fa-calendar-alt"></i>
					</div>
					<div class="min-w-0 flex-1">
						<h3 class="font-bold text-slate-800">Waktu Pemilihan</h3>
						<div class="mt-3 space-y-2">
							<div class="flex items-start gap-2 text-sm">
								<span class="w-14 shrink-0 font-semibold text-slate-500">Start</span>
								<span class="text-slate-700">${start} WITA</span>
							</div>
							<div class="flex items-start gap-2 text-sm">
								<span class="w-14 shrink-0 font-semibold text-slate-500">Finish</span>
								<span class="text-slate-700">${finish} WITA</span>
							</div>
						</div>
					</div>
					<button type="button" onclick="VotingOsisService.refresh()" class="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0" title="Refresh">
							↻
						</button>
					
				</div>
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
			this.showLoading();
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
			this.hideLoading();
			await Swal.fire({
				icon: 'success',
				title: 'Voting Berhasil!',
				text: 'Suara Anda telah berhasil disimpan.',
				confirmButtonText: 'OK',
				confirmButtonColor: '#2563eb',
				allowOutsideClick: false,
				allowEscapeKey: false
			});
			this.renderAlreadyVoted(true);
			await this.loadVoteResult(this.pemilu.id);
		} catch (error) {
			console.error('Voting gagal:', error);
			this.hideLoading();
			this.showAlert('error', error.message || 'Gagal menyimpan suara.');
		}
	},
	async loadFinalResult() {
		const container = document.getElementById('voting-osis-result-container');
		if (!container) return;
		container.innerHTML = this.renderFinalResultLoading();
		try {
			const { data, error } = await window.supabaseClient.rpc(
				'get_osis_final_result',
				{
					p_pemilu_id: this.pemilu.id
				}
			);
			if (error) throw error;
			if (!data?.success || !data?.pemilu) {
				container.innerHTML = '';
				return;
			}
			const stats = data.stats || {};
			const kandidat = Array.isArray(data.kandidat) ? data.kandidat : [];
			container.innerHTML = this.renderFinalResult(data.pemilu, stats, kandidat);
		} catch (error) {
			console.error('Gagal memuat hasil akhir OSIS:', error);
			container.innerHTML = `
				<div class="bg-white rounded-3xl border border-red-100 p-5">
					<div class="flex items-start gap-3">
						<div class="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
							<i class="fas fa-exclamation-triangle"></i>
						</div>
						<div class="min-w-0">
							<h3 class="font-bold text-slate-800">Hasil akhir gagal dimuat</h3>
							<p class="text-xs text-slate-500 mt-1 break-words">
								${this.escapeHtml(error.message || 'Terjadi kesalahan saat mengambil hasil akhir.')}
							</p>
						</div>
					</div>
				</div>
			`;
		}
	},
	renderFinalResultLoading() {
		return `
			<div class="space-y-5 mb-5">
				<div class="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
					<div class="h-6 bg-slate-200 rounded-lg w-2/3"></div>
					<div class="h-4 bg-slate-100 rounded mt-3 w-1/3"></div>
					<div class="h-16 bg-slate-100 rounded-xl mt-5"></div>
				</div>
				<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
					${Array.from({ length: 4 }).map(() => `
						<div class="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
							<div class="h-4 bg-slate-200 rounded w-2/3"></div>
							<div class="h-8 bg-slate-100 rounded mt-3 w-1/2"></div>
						</div>
					`).join('')}
				</div>
			</div>
		`;
	},
	renderFinalStatCard(title, value, icon, color) {
		const colorMap = {
			blue: {
				bg: 'bg-blue-50',
				text: 'text-blue-600'
			},
			emerald: {
				bg: 'bg-emerald-50',
				text: 'text-emerald-600'
			},
			orange: {
				bg: 'bg-orange-50',
				text: 'text-orange-600'
			},
			indigo: {
				bg: 'bg-indigo-50',
				text: 'text-indigo-600'
			}
		};
		const selected = colorMap[color] || colorMap.blue;
		return `
			<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-xs sm:text-sm text-slate-500">${title}</p>
						<p class="text-xl sm:text-2xl font-bold text-slate-800 mt-1">${value}</p>
					</div>
					<div class="w-10 h-10 rounded-xl ${selected.bg} ${selected.text} flex items-center justify-center shrink-0">
						<i class="fas ${icon}"></i>
					</div>
				</div>
			</div>
		`;
	},
	renderFinalCandidate(item, index, totalSuara) {
		const nomor = String(item.nomor_urut ?? index + 1).padStart(2, '0');
		const nama = this.escapeHtml(item.nama || '-');
		const jumlahSuara = Number(item.jumlah_suara || 0);
		const persentase = Number(item.persentase || 0);
		const fotoUrl = this.getSafeImageUrl(item.foto_url);
		return `
			<div class="border border-slate-200 rounded-2xl p-4 sm:p-5">
				<div class="flex items-center gap-4">
					<div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold shrink-0">
						${nomor}
					</div>
					<div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
						${fotoUrl ? `
							<img
								src="${fotoUrl}"
								alt="${nama}"
								class="w-full h-full object-cover"
								onerror="this.style.display='none';this.nextElementSibling.classList.remove('hidden');"
							>
							<div class="hidden w-full h-full items-center justify-center text-slate-400 text-xl">
								<i class="fas fa-user"></i>
							</div>
						` : `
							<div class="w-full h-full flex items-center justify-center text-slate-400 text-xl">
								<i class="fas fa-user"></i>
							</div>
						`}
					</div>
					<div class="min-w-0 flex-1">
						<p class="text-xs text-slate-400">Kandidat ${nomor}</p>
						<h3 class="font-bold text-slate-800 truncate mt-0.5">${nama}</h3>
					</div>
					<div class="text-right shrink-0">
						<p class="text-lg sm:text-xl font-bold text-slate-800">
							${this.formatNumber(jumlahSuara)}
						</p>
						<p class="text-xs text-slate-500">suara</p>
					</div>
				</div>
				<div class="mt-4">
					<div class="flex items-center justify-between gap-3 mb-2">
						<span class="text-xs font-medium text-slate-500">Persentase Suara</span>
						<span class="text-sm font-bold text-blue-600">
							${this.formatPercentage(persentase)}
						</span>
					</div>
					<div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
						<div
							class="h-full bg-blue-500 rounded-full transition-all duration-500"
							style="width: ${Math.min(Math.max(persentase, 0), 100)}%"
						></div>
					</div>
					<div class="flex items-center justify-between mt-2">
						<span class="text-[11px] text-slate-400">
							${this.formatNumber(jumlahSuara)} dari ${this.formatNumber(totalSuara)} suara
						</span>
						<span class="text-[11px] text-slate-400">
							${this.formatPercentage(persentase)}
						</span>
					</div>
				</div>
			</div>
		`;
	},
	renderFinalResult(pemilu, stats, kandidat) {
		const totalDpt = Number(stats.total_dpt || 0);
		const sudahMemilih = Number(stats.sudah_memilih || 0);
		const belumMemilih = Number(stats.belum_memilih || 0);
		const totalSuara = Number(stats.total_suara || 0);
		const partisipasi = Number(stats.partisipasi || 0);
		return `
			<div class="space-y-5 mb-5">
				<div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
					<div class="p-5 sm:p-6">
						<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div class="flex items-start gap-4">
								<div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shrink-0">
									<i class="fas fa-trophy"></i>
								</div>
								<div class="min-w-0">
									<h2 class="text-xl sm:text-2xl font-bold text-slate-800">
										Hasil Akhir Pemilihan Ketua OSIS
									</h2>
									<p class="text-sm text-slate-500 mt-1">
										${this.escapeHtml(pemilu.nama || 'Pemilihan Ketua OSIS')}
									</p>
									${pemilu.tahun_ajaran ? `
										<p class="text-xs text-slate-400 mt-1">
											Tahun Ajaran ${this.escapeHtml(pemilu.tahun_ajaran)}
										</p>
									` : ''}
								</div>
							</div>
							<div>
								<span class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
									<span class="w-2 h-2 rounded-full bg-emerald-500"></span>
									Pemilihan Selesai
								</span>
							</div>
						</div>
						<div class="mt-5 pt-5 border-t border-slate-100">
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
									<div class="w-9 h-9 rounded-lg bg-white text-blue-500 flex items-center justify-center shrink-0">
										<i class="fas fa-play"></i>
									</div>
									<div class="min-w-0">
										<p class="text-xs text-slate-400">Start</p>
										<p class="text-sm font-semibold text-slate-700 mt-1">
											${this.formatDateTime(pemilu.tanggal_mulai, pemilu.jam_mulai)}
										</p>
									</div>
								</div>
								<div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
									<div class="w-9 h-9 rounded-lg bg-white text-emerald-500 flex items-center justify-center shrink-0">
										<i class="fas fa-flag-checkered"></i>
									</div>
									<div class="min-w-0">
										<p class="text-xs text-slate-400">Finish</p>
										<p class="text-sm font-semibold text-slate-700 mt-1">
											${this.formatDateTime(pemilu.tanggal_selesai, pemilu.jam_selesai)}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
					${this.renderFinalStatCard(
						'Total DPT',
						this.formatNumber(totalDpt),
						'fa-users',
						'blue'
					)}
					${this.renderFinalStatCard(
						'Suara Masuk',
						this.formatNumber(totalSuara),
						'fa-vote-yea',
						'emerald'
					)}
					${this.renderFinalStatCard(
						'Belum Memilih',
						this.formatNumber(belumMemilih),
						'fa-user-clock',
						'orange'
					)}
					${this.renderFinalStatCard(
						'Partisipasi',
						this.formatPercentage(partisipasi),
						'fa-chart-pie',
						'indigo'
					)}
				</div>
				<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
					<div class="p-5 sm:p-6 border-b border-slate-100">
						<div class="flex items-center justify-between gap-3">
							<div>
								<h2 class="text-lg font-bold text-slate-800">Hasil Akhir</h2>
								<p class="text-xs text-slate-500 mt-1">
									Perolehan suara berdasarkan hasil pemilihan yang telah selesai.
								</p>
							</div>
							<div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
								<i class="fas fa-chart-bar"></i>
							</div>
						</div>
					</div>
					<div class="p-4 sm:p-6 space-y-4">
						${kandidat.length
							? kandidat.map((item, index) => this.renderFinalCandidate(item, index, totalSuara)).join('')
							: `
								<div class="text-center py-8">
									<div class="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-xl">
										<i class="fas fa-users-slash"></i>
									</div>
									<p class="text-sm text-slate-500 mt-3">Data kandidat tidak ditemukan.</p>
								</div>
							`
						}
					</div>
				</div>
			</div>
		`;
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
	async loadVoteResult(pemiluId) {
		const container = document.getElementById('voting-osis-result-container');
		if (!container) {
			console.warn('Container voting-osis-result-container tidak ditemukan.');
			return;
		}
		container.innerHTML = this.renderResultLoading();
		try {
			console.log('Memuat hasil suara OSIS...');
			console.log('Pemilu ID:', pemiluId);
			console.log('tampilkan_hasil:', this.pemilu?.tampilkan_hasil);
			if (!this.pemilu) {
				container.innerHTML = '';
				return;
			}
			const tampilkanHasil = this.pemilu.tampilkan_hasil === true || this.pemilu.tampilkan_hasil === 'true';
			if (!tampilkanHasil) {
				console.log('Hasil suara masih disembunyikan.');
				container.innerHTML = this.renderResultHidden();
				return;
			}
			const { data, error } = await window.supabaseClient.rpc(
				'get_osis_live_result',
				{
					p_pemilu_id: pemiluId
				}
			);
			if (error) throw error;
			console.log('Data hasil suara OSIS:', data);
			const resultData = Array.isArray(data) ? data : [];
			container.innerHTML = this.renderVoteResult(resultData);
		} catch (error) {
			console.error('Gagal memuat hasil suara:', error);
			container.innerHTML = `
				<div class="bg-white rounded-3xl border border-red-100 p-5">
					<div class="flex items-start gap-3">
						<div class="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
							⚠️
						</div>
						<div class="min-w-0">
							<h3 class="font-bold text-slate-800">Hasil suara gagal dimuat</h3>
							<p class="text-xs text-slate-500 mt-1 break-words">
								${this.escapeHtml(error.message || 'Terjadi kesalahan saat mengambil hasil suara.')}
							</p>
						</div>
					</div>
				</div>
			`;
		}
	},
	renderVoteResult(data) {
		if (!Array.isArray(data) || data.length === 0) {
			return this.renderEmptyResult();
		}
		const totalSuara = data.reduce((total, item) => {
			return total + Number(item.jumlah_suara || 0);
		}, 0);
		return `
			<div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
				<div class="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-5 py-5 text-white">
					<div class="flex items-start gap-4">
						<div class="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl shrink-0">
							📊
						</div>
						<div class="min-w-0">
							<h3 class="text-lg font-extrabold">Hasil Suara Sementara</h3>
							<p class="text-sm text-blue-100 mt-1">Perolehan suara kandidat saat ini</p>
						</div>
					</div>
					<div class="mt-5 rounded-2xl bg-white/10 border border-white/15 px-4 py-3">
						<div class="flex items-center justify-between gap-3">
							<span class="text-sm text-blue-100">Total Suara Masuk</span>
							<span class="text-xl font-extrabold">${this.formatNumber(totalSuara)}</span>
						</div>
					</div>
				</div>
				<div class="p-5 space-y-4">
					${data.map(item => this.renderCandidateResult(item, totalSuara)).join('')}
				</div>
			</div>
		`;
	},
	renderCandidateResult(item, totalSuara) {
		const jumlahSuara = Number(item.jumlah_suara || 0);
		let persentase = Number(item.persentase || 0);
		if (!Number.isFinite(persentase)) persentase = 0;
		if (totalSuara > 0 && !item.persentase) {
			persentase = (jumlahSuara / totalSuara) * 100;
		}
		persentase = Math.max(0, Math.min(100, persentase));
		const foto = item.foto_url
			? `<img src="${this.escapeAttribute(item.foto_url)}" alt="${this.escapeAttribute(item.nama)}" class="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0">`
			: `<div class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shrink-0">👤</div>`;
		return `
			<div class="rounded-2xl border border-slate-200 p-4">
				<div class="flex items-center gap-3">
					${foto}
					<div class="min-w-0 flex-1">
						<div class="flex items-center justify-between gap-3">
							<div class="min-w-0">
								<div class="text-xs font-bold text-blue-600">NO. ${String(item.nomor_urut).padStart(2, '0')}</div>
								<h4 class="font-bold text-slate-800 truncate mt-0.5">${this.escapeHtml(item.nama)}</h4>
							</div>
							<div class="text-right shrink-0">
								<div class="text-lg font-extrabold text-slate-800">${this.formatNumber(jumlahSuara)}</div>
								<div class="text-xs text-slate-500">suara</div>
							</div>
						</div>
					</div>
				</div>
				<div class="mt-4">
					<div class="flex items-center justify-between text-xs mb-1.5">
						<span class="font-medium text-slate-500">Persentase</span>
						<span class="font-extrabold text-blue-600">${this.formatPercentage(persentase)}</span>
					</div>
					<div class="h-3 bg-slate-100 rounded-full overflow-hidden">
						<div class="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500" style="width: ${persentase}%"></div>
					</div>
				</div>
			</div>
		`;
	},
	renderEmptyResult() {
		return `
			<div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
				<div class="text-center py-5">
					<div class="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">📊</div>
					<h3 class="font-bold text-slate-800 mt-4">Belum Ada Suara</h3>
					<p class="text-sm text-slate-500 mt-1">Belum ada suara yang masuk pada pemilihan ini.</p>
				</div>
			</div>
		`;
	},
	getSafeImageUrl(url) {
		if (!url || typeof url !== 'string') return '';
		try {
			const parsed = new URL(url, window.location.origin);
			if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
				return '';
			}
			return this.escapeAttribute(parsed.href);
		} catch (error) {
			return '';
		}
	},
	escapeAttribute(value) {
		return this.escapeHtml(value);
	},
	renderResultLoading() {
		return `
			<div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 animate-pulse">
				<div class="flex items-center gap-3">
					<div class="w-11 h-11 rounded-2xl bg-slate-200"></div>
					<div class="flex-1">
						<div class="h-4 w-40 bg-slate-200 rounded"></div>
						<div class="h-3 w-56 bg-slate-100 rounded mt-2"></div>
					</div>
				</div>
				<div class="space-y-4 mt-6">
					<div class="h-24 bg-slate-100 rounded-2xl"></div>
					<div class="h-24 bg-slate-100 rounded-2xl"></div>
				</div>
			</div>
		`;
	},
	renderResultHidden() {
		return `
			<div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
				<div class="bg-gradient-to-br from-slate-50 to-slate-100 px-5 py-5">
					<div class="flex items-start gap-4">
						<div class="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center text-xl shrink-0">
							🔒
						</div>
						<div>
							<h3 class="text-lg font-extrabold text-slate-800">
								Hasil Suara Sementara
							</h3>
							<p class="text-sm text-slate-500 mt-1">
								Hasil suara sementara belum ditampilkan oleh panitia.
							</p>
						</div>
					</div>
				</div>
				<div class="px-5 py-4 border-t border-slate-100">
					<div class="flex items-center gap-2 text-xs text-slate-500">
						<span>ℹ️</span>
						<span>
							Hasil akan tersedia sesuai dengan pengaturan pemilihan.
						</span>
					</div>
				</div>
			</div>
		`;
	},
	clearVoteResult() {
		const container = document.getElementById('voting-osis-result-container');
		if (!container) return;
		container.innerHTML = '';
	},
	formatNumber(value) {
		return new Intl.NumberFormat('id-ID').format(Number(value || 0));
	},
	formatPercentage(value) {
		const number = Number(value || 0);
		return `${number.toLocaleString('id-ID', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2
		})}%`;
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
		this.clearVoteResult();
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
		this.clearVoteResult();
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
	},
	formatDateTime(tanggal, jam) {
		if (!tanggal) return '-';
		const date = new Date(`${tanggal}T${jam || '00:00:00'}`);
		if (Number.isNaN(date.getTime())) {
			return `${tanggal} ${jam || ''}`.trim();
		}
		const tanggalText = date.toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});
		const jamText = jam ? String(jam).substring(0, 5) : '00:00';
		return `${tanggalText} ${jamText} WITA`;
	},
	formatNumber(value) {
		return new Intl.NumberFormat('id-ID').format(Number(value || 0));
	},
	formatPercentage(value) {
		return `${Number(value || 0).toLocaleString('id-ID', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})}%`;
	},
};
window.VotingOsisService = VotingOsisService;

// ADMIN SERVICE
// =====================================================================================
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
					'Jumlah warga yang memiliki hak pilih'
				)}
				${this.renderStatCard(
					'Suara Masuk',
					this.formatNumber(sudahMemilih),
					'🗳️',
					'green',
					'Jumlah warga yang sudah memilih'
				)}
				${this.renderStatCard(
					'Belum Memilih',
					this.formatNumber(belumMemilih),
					'⏳',
					'orange',
					'Jumlah warga yang belum menggunakan hak pilih'
				)}
				${this.renderStatCard(
					'Partisipasi',
					partisipasi.toFixed(2) + '%',
					'📊',
					'purple',
					'Persentase warga yang sudah memilih'
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