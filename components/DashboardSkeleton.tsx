// Skeleton que espelha o layout completo do dashboard (sidebar + conteúdo)
export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-100 flex-col shadow-lg">

        {/* Logo */}
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="skeleton-block skeleton-circle w-9 h-9 flex-shrink-0" />
          <div className="skeleton-block h-5 w-28" />
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-4">
          <div className="bg-white p-2 shadow-sm rounded-xl flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-full">
                <div className="skeleton-block skeleton-circle w-6 h-6 flex-shrink-0" />
                <div className="skeleton-block h-4 flex-1" style={{ maxWidth: `${60 + i * 8}%` }} />
              </div>
            ))}
          </div>
        </nav>

        {/* User card */}
        <div className="p-4 border-t border-gray-100">
          <div className="skeleton-block rounded-xl p-4" style={{ background: "#c8d5e8" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="skeleton-block skeleton-circle w-9 h-9 flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="skeleton-block h-3 w-24" />
                <div className="skeleton-block h-3 w-32" />
              </div>
            </div>
            <div className="skeleton-block h-10 rounded-lg" />
          </div>
          <div className="skeleton-block h-10 rounded-xl mt-3" />
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="flex-1 flex flex-col md:ml-72">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="skeleton-block skeleton-circle w-8 h-8 md:hidden" />
            <div className="skeleton-block h-6 w-36" />
          </div>
          <div className="flex items-center gap-3">
            <div className="skeleton-block skeleton-circle w-9 h-9" />
            <div className="skeleton-block skeleton-circle w-9 h-9" />
          </div>
        </header>

        <div className="p-4 sm:p-6 flex flex-col gap-6">

          {/* Stats row — 4 cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="skeleton-block h-4 w-20" />
                  <div className="skeleton-block skeleton-circle w-10 h-10" />
                </div>
                <div className="skeleton-block h-7 w-16" />
                <div className="skeleton-block h-3 w-24" />
              </div>
            ))}
          </div>

          {/* Content area — two columns */}
          <div className="grid md:grid-cols-3 gap-6">

            {/* Main panel (2/3) */}
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="skeleton-block h-5 w-36" />
                <div className="skeleton-block h-8 w-24 rounded-lg" />
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                  <div className="skeleton-block skeleton-circle w-9 h-9 flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="skeleton-block h-4" style={{ width: `${50 + i * 7}%` }} />
                    <div className="skeleton-block h-3 w-1/3" />
                  </div>
                  <div className="skeleton-block h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>

            {/* Side panel (1/3) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
              <div className="skeleton-block h-5 w-28" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton-block rounded-xl p-4 flex flex-col gap-2" style={{ background: "#dce4ef" }}>
                  <div className="skeleton-block h-3 w-16" />
                  <div className="skeleton-block h-5 w-24" />
                  <div className="skeleton-block h-3 w-full" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
