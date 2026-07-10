import Link from 'next/link'

const problemMetrics = [
  ['Manual', 'Cocokkan dokumen satu per satu'],
  ['Risiko', 'Human error pada stok dan pembayaran'],
  ['Hambatan', 'Transaksi bertambah, audit melambat'],
  ['Solusi', 'AI hanya eskalasi kasus tidak yakin'],
]

const pipelineSteps = [
  ['01', 'Upload Dokumen', 'Invoice, nota timbang, DO, bukti pembayaran'],
  ['02', 'Ekstraksi LLM', 'Jumlah, berat, harga, pemasok, tanggal'],
  ['03', 'Cross-check Sistem', 'Bandingkan dengan transaksi koperasi'],
  ['04', 'Keputusan', 'Verified atau masuk Review Queue'],
]

const impactFeatures = [
  [
    '01',
    'Context-Aware Document Validation',
    'AI membaca AD/ART, proposal pinjaman, RAB, kuitansi, dan pola historis sebagai satu konteks.',
    'Mismatch nominal, tanggal, pihak, dan tujuan dana terdeteksi sebelum berkas disetujui.',
  ],
  [
    '02',
    'Human-in-the-Loop Verification',
    'Temuan risiko masuk antrean pengurus dan auditor, lengkap dengan alasan serta bukti dokumen.',
    'Keputusan tetap pada manusia; jejak persetujuan tersimpan rapi untuk audit berikutnya.',
  ],
  [
    '03',
    'Cegah Kesalahan Sebelum Transaksi Final',
    'Sistem memberi peringatan saat transaksi belum final, bukan setelah kas keluar atau laporan ditutup.',
    'Koreksi lebih cepat, beban audit turun, dan kepercayaan anggota koperasi meningkat.',
  ],
]

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#2d2926] text-[#f5f2e9]">
      {children}
    </span>
  )
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M12 18v-7" />
      <path d="m9 14 3-3 3 3" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 9.8 9.8 3 12l6.8 2.2L12 21l2.2-6.8L21 12l-6.8-2.2z" />
      <path d="M19 3v4" />
      <path d="M21 5h-4" />
    </svg>
  )
}

function CompareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3v12" />
      <path d="m3 12 3 3 3-3" />
      <path d="M18 21V9" />
      <path d="m15 12 3-3 3 3" />
      <path d="M6 15h9" />
      <path d="M9 9h9" />
    </svg>
  )
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="19" r="3" />
      <circle cx="18" cy="5" r="3" />
      <path d="M12 19h2a4 4 0 0 0 4-4V8" />
      <path d="M6 16V9a4 4 0 0 1 4-4h5" />
    </svg>
  )
}

const stepIcons = [<UploadIcon key="upload" />, <SparkIcon key="spark" />, <CompareIcon key="compare" />, <RouteIcon key="route" />]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f5f2e9] text-[#2d2926]">
      <section className="bg-[#2d2926] text-[#f5f2e9]">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-6 pb-10 pt-16 sm:px-10 lg:grid-cols-[minmax(0,560px)_minmax(420px,620px)] lg:px-[88px] lg:pb-10 lg:pt-[72px]">
          <div className="flex flex-col justify-center gap-6 lg:min-h-[500px]">
            <p className="text-sm font-bold uppercase text-[#d7c88c] sm:text-[15px]">
              AI Audit Engine untuk Koperasi Desa Merah Putih
            </p>
            <h1 className="max-w-2xl text-5xl font-bold leading-[0.98] tracking-normal sm:text-6xl lg:text-[64px]">
              Validasi dokumen transaksi koperasi sebelum jadi masalah.
            </h1>
            <p className="max-w-xl text-lg leading-7 text-[#d9d3c8] sm:text-[19px]">
              LLM mengekstrak isi dokumen, membandingkannya dengan data transaksi koperasi, lalu menandai hanya bagian yang perlu ditinjau petugas.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/transactions/new" className="inline-flex items-center justify-center gap-2 bg-[#d7c88c] px-[18px] py-[14px] text-sm font-bold text-[#2d2926] transition hover:bg-[#e5d89d]">
                <UploadIcon />
                Mulai audit otomatis
              </Link>
              <Link href="/transactions" className="inline-flex items-center justify-center gap-2 px-3 py-[14px] text-sm font-semibold text-[#f5f2e9] transition hover:bg-white/10">
                <CompareIcon />
                Lihat review queue
              </Link>
            </div>
          </div>

          <div className="relative min-h-[420px] border border-[#5d5547] bg-[#1e1b18] p-5 shadow-2xl shadow-black/20 lg:h-[492px]">
            <div className="absolute inset-0 opacity-80 [background:linear-gradient(135deg,rgba(245,242,233,.08),transparent_35%),radial-gradient(circle_at_20%_20%,rgba(215,200,140,.18),transparent_24%),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px)] bg-size-[auto,auto,42px_42px,42px_42px]" />
            <div className="relative grid h-full gap-4 sm:grid-cols-[1fr_220px]">
              <div className="flex flex-col justify-between border border-[#5d5547] bg-[#f5f2e9] p-5 text-[#2d2926]">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-[#c7b987] pb-3 text-xs font-bold uppercase text-[#7d6b3d]">
                    <span>Invoice Koperasi</span>
                    <span>DOC-8841</span>
                  </div>
                  {['Pemasok: BUMDes Sumber Makmur', 'Total: Rp 84.250.000', 'Tanggal: 10 Juli 2026', 'Tujuan: Pengadaan gabah'].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 bg-[#2f6b45]" />
                      <span className="text-sm text-[#5e5954]">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 grid grid-cols-3 gap-2">
                  <div className="h-16 bg-[#efe8d7]" />
                  <div className="h-16 bg-[#d7c88c]" />
                  <div className="h-16 bg-[#efe8d7]" />
                </div>
              </div>
              <div className="hidden flex-col justify-between border border-[#5d5547] bg-[#2d2926] p-4 text-[#f5f2e9] sm:flex">
                <p className="text-xs font-bold uppercase text-[#d7c88c]">AI Checks</p>
                <div className="space-y-3 text-sm text-[#d9d3c8]">
                  <p>Nominal match</p>
                  <p>Supplier verified</p>
                  <p>Date in period</p>
                  <p>Purpose aligned</p>
                </div>
                <div className="h-24 border border-[#5d5547] bg-[#3a352f]" />
              </div>
            </div>
            <div className="absolute bottom-10 left-8 right-8 border border-[#2d2926] bg-[#f5f2e9ee] p-5 text-[#2d2926] sm:flex sm:items-center sm:gap-5">
              <div className="mb-3 w-32 sm:mb-0">
                <p className="text-xs font-bold uppercase text-[#5e5954]">Confidence</p>
                <p className="font-mono text-4xl font-bold">94%</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[#2d2926]">Verified</p>
                <p className="mt-1 text-sm leading-5 text-[#5e5954]">
                  Jumlah barang, berat, pemasok, harga, dan tanggal konsisten dengan transaksi koperasi.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-[1264px] border-y border-[#5d5547] bg-[#3a352f] sm:grid-cols-2 lg:grid-cols-4">
          {problemMetrics.map(([label, detail]) => (
            <div key={label} className="border-[#5d5547] px-6 py-5 lg:border-r last:border-r-0">
              <p className="font-mono text-sm font-bold text-[#d7c88c]">{label}</p>
              <p className="mt-1 text-sm text-[#d9d3c8]">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-[88px]">
        <div className="mx-auto max-w-[1264px]">
          <div className="grid gap-8 lg:grid-cols-[650px_350px] lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-[#7d6b3d]">Solusi: Context-Aware Validation</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-[42px]">
                AI membandingkan dokumen dengan transaksi, bukan sekadar membaca teks.
              </h2>
              <p className="mt-4 max-w-2xl text-[17px] leading-7 text-[#5e5954]">
                Setiap unggahan diproses LLM, diekstrak menjadi data terstruktur, lalu dibandingkan secara kontekstual dengan catatan koperasi.
              </p>
            </div>
            <aside className="border border-[#2d2926] bg-[#efe8d7] p-5">
              <p className="text-xs font-bold uppercase text-[#5e5954]">Ambang Keputusan</p>
              <p className="mt-2 font-mono text-4xl font-bold">&gt;= 90%</p>
              <p className="mt-2 text-sm leading-5 text-[#5e5954]">
                Di bawah ambang ini, AI tidak memaksa keputusan dan mengirim dokumen ke petugas.
              </p>
            </aside>
          </div>

          <div className="mt-8 grid border border-[#2d2926] bg-[#f9f6ed] md:grid-cols-2 xl:grid-cols-4">
            {pipelineSteps.map(([number, title, description], index) => (
              <div key={title} className="border-[#c7b987] p-6 md:border-r md:nth-[2n]:border-r-0 xl:nth-[2n]:border-r xl:last:border-r-0">
                <div className="flex items-center gap-3">
                  <IconBox>{stepIcons[index]}</IconBox>
                  <div>
                    <p className="font-mono text-xs font-bold text-[#7d6b3d]">{number}</p>
                    <h3 className="text-xl font-bold">{title}</h3>
                  </div>
                </div>
                <p className="mt-5 text-[15px] leading-6 text-[#5e5954]">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="flex items-center gap-4 border border-[#2f6b45] bg-[#e7efe4] p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#2f6b45] text-[#2f6b45]">?</span>
              <div>
                <p className="font-bold">Verified otomatis</p>
                <p className="text-sm text-[#5e5954]">Data konsisten, transaksi dapat dilanjutkan lebih cepat.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 border border-[#a05a20] bg-[#fff2d8] p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#a05a20] text-[#a05a20]">!</span>
              <div>
                <p className="font-bold">Review Queue</p>
                <p className="text-sm text-[#5e5954]">Petugas hanya memeriksa field yang ditandai AI.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#7d6b3d] px-6 py-12 text-[#f5f2e9] sm:px-10 lg:px-[88px]">
        <div className="mx-auto max-w-[1264px]">
          <div className="grid gap-8 lg:grid-cols-[690px_1fr]">
            <div>
              <p className="font-mono text-sm font-semibold uppercase text-[#f5f2e9]">Kebaruan Ide dan Dampak</p>
              <h2 className="mt-2 max-w-2xl text-3xl font-bold leading-tight sm:text-[32px]">
                Audit koperasi yang membaca konteks sebelum angka bergerak
              </h2>
              <p className="mt-3 text-sm leading-5 text-[#f5f2e9dd]">
                Mesin audit menilai dokumen, keputusan manusia, dan risiko transaksi sebagai satu alur kendali.
              </p>
            </div>
            <div className="grid border border-[#f5f2e966] sm:grid-cols-[132px_1fr_1fr_1fr]">
              <div className="hidden border-r border-[#f5f2e955] bg-[#6f5f36] p-4 sm:block">
                <div className="h-full bg-[linear-gradient(135deg,rgba(245,242,233,.25),transparent),linear-gradient(rgba(245,242,233,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(245,242,233,.16)_1px,transparent_1px)] bg-size-[auto,18px_18px,18px_18px]" />
              </div>
              {[
                ['3', 'lapis kendali'],
                ['0', 'toleransi dokumen ganjil'],
                ['<1m', 'sinyal risiko awal'],
              ].map(([value, label]) => (
                <div key={label} className="p-4">
                  <p className="font-mono text-2xl font-semibold">{value}</p>
                  <p className="mt-2 text-xs leading-4 text-[#f5f2e9cc]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 sm:px-10 lg:px-[88px]">
        <div className="mx-auto max-w-[1264px]">
          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            <div>
              <p className="text-sm font-bold uppercase text-[#7d6b3d]">Model Kerja</p>
              <h3 className="mt-2 text-3xl font-bold leading-tight text-[#2d2926]">
                Validasi, verifikasi, pencegahan
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#5e5954]">
                Desain untuk pengurus level jasa, audit internal, dan petugas yang membutuhkan konteks sebelum keputusan manusia.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {impactFeatures.map(([number, title, copy, impact]) => (
                <div key={title} className="border border-[#c7b987] bg-[#f9f6ed] p-5">
                  <p className="font-mono text-sm font-bold text-[#7d6b3d]">{number}</p>
                  <h4 className="mt-2 text-lg font-bold text-[#2d2926]">{title}</h4>
                  <p className="mt-3 text-sm leading-6 text-[#5e5954]">{copy}</p>
                  <p className="mt-4 text-sm leading-6 text-[#2d2926]">{impact}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
