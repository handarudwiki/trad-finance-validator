import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          Sistem Validasi Dokumen Trade Finance
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Platform berbasis AI untuk memvalidasi dokumen pendukung perdagangan terhadap
          instrumen Letter of Credit (LC) dan Surat Kredit Berdokumen Dalam Negeri (SKBDN)
          sebelum pengajuan ke bank. Deteksi penyimpangan secara otomatis dengan referensi
          regulasi UCP 600, ISBP 745, dan PBI SKBDN.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/transactions/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Mulai Validasi
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Lihat Riwayat Transaksi
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12">
          <div className="rounded-lg border border-gray-200 p-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Ekstraksi Otomatis</h3>
            <p className="text-sm text-gray-600">
              Ekstraksi data terstruktur dari dokumen LC/SKBDN menggunakan AI vision secara otomatis.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Validasi Komprehensif</h3>
            <p className="text-sm text-gray-600">
              Pemeriksaan deterministik dan interpretatif dengan referensi regulasi yang akurat.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Laporan Terstruktur</h3>
            <p className="text-sm text-gray-600">
              Laporan penyimpangan lengkap dengan keparahan, saran koreksi, dan ekspor PDF.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
