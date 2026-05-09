export function normalizeFundingStatus(status?: string | null) {
  return status?.trim().toLowerCase() || 'unfunded'
}

export function isRewardFunded(status?: string | null) {
  return normalizeFundingStatus(status) === 'funded'
}

export function fundingBadgeClassName(status?: string | null) {
  switch (normalizeFundingStatus(status)) {
    case 'funded':
      return 'border-green-200 bg-green-50 text-green-700'
    case 'pending':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'released':
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'refunded':
      return 'border-slate-200 bg-slate-50 text-slate-700'
    default:
      return 'border-red-200 bg-red-50 text-red-700'
  }
}

export function formatMoney(amount: number, currency = 'USD') {
  return `${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`
}
