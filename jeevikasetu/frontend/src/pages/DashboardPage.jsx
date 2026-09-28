/** Screen 5 — official monitoring dashboard. */

import AdminDashboard from '../components/AdminDashboard'

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4">
        <h1 className="section-title">अधिकारी डैशबोर्ड · Programme monitoring</h1>
        <p className="text-sm text-slate-600">
          Aggregate, anonymisable view for MoSJE and State SC Welfare Departments — reach by
          channel and language, informal skills surfaced, district-wise demand and indicative GIA
          utilisation.
        </p>
      </div>
      <AdminDashboard />
    </div>
  )
}
