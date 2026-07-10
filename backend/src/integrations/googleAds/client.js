// STUB: replace with the real `google-ads-api` client once OAuth credentials are configured.
// Kept isolated here so nothing outside this file needs to change when it goes live —
// the repository/service layer only ever calls `fetchPerformanceMaxCampaigns`.
async function fetchPerformanceMaxCampaigns(customerId) {
  return [
    {
      externalId: '111111',
      name: 'PMax - Shoes - France',
      status: 'ENABLED',
      budgetMicros: 2000000000n,
      country: 'FR',
      metrics: [
        { date: '2026-06-01', impressions: 12000, clicks: 340, conversions: 22, costMicros: 180000000n, roas: 3.2, cpaMicros: 8181000n, conversionRate: 0.065 },
      ],
    },
  ];
}

module.exports = { fetchPerformanceMaxCampaigns };
