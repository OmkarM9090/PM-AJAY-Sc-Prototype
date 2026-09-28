/** Opportunity & NSQF catalogue explorer page. */

import OpportunityExplorer from '../components/OpportunityExplorer'
import { useApp } from '../store/AppContext'

export default function OpportunitiesPage() {
  const { profile } = useApp()
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="section-title mb-1">अवसर एवं NSQF सूची · Opportunities &amp; catalogue</h1>
      <p className="mb-5 text-sm text-slate-600">
        The curated reference layer behind every recommendation: wage jobs, self-employment
        ventures, empanelled training centres and the full NSQF qualification pack catalogue —
        filtered by district, travel radius and education eligibility.
        {profile && (
          <> Filters are pre-set for <strong>{profile.name}</strong> ({profile.location?.district},
          {' '}{profile.mobility_range_km} km, {profile.education}).</>
        )}
      </p>
      <OpportunityExplorer />
    </div>
  )
}
