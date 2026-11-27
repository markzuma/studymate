export function deriveMembership(rows = [], now = Date.now()) {
  const timestamp = value =>
    value ? Date.parse(value) : null

  const active = rows.filter(row =>
    row.status === 'active' &&
    (!row.starts_at || timestamp(row.starts_at) <= now) &&
    (!row.ends_at || timestamp(row.ends_at) > now)
  )

  const scheduled = rows.filter(row =>
    row.status === 'active' &&
    timestamp(row.starts_at) > now &&
    timestamp(row.ends_at) > timestamp(row.starts_at)
  ).sort((a, b) =>
    timestamp(a.starts_at) - timestamp(b.starts_at)
  )

  const pending = rows.find(row =>
    row.status === 'pending'
  ) || null

  const expired = rows.filter(row =>
    ['active', 'expired'].includes(row.status) &&
    row.ends_at &&
    timestamp(row.ends_at) <= now
  ).sort((a, b) =>
    timestamp(b.ends_at) - timestamp(a.ends_at)
  )[0] || null

  const unlimited = active.some(row => !row.ends_at)

  const current = [...active].sort((a, b) =>
    (timestamp(b.ends_at) ?? Infinity) -
    (timestamp(a.ends_at) ?? Infinity)
  )[0] || null

  let paidUntil = current?.ends_at
    ? timestamp(current.ends_at)
    : null

  // Include only contiguous verified future periods.
  if (current && !unlimited && paidUntil !== null) {
    for (const row of scheduled) {
      const start = timestamp(row.starts_at)
      const end = timestamp(row.ends_at)

      if (start <= paidUntil) {
        paidUntil = Math.max(paidUntil, end)
      }
    }
  }

  return {
    current,
    scheduled,
    pending,
    expired,
    unlimited,
    paidUntil,
    active: Boolean(current),
    daysLeft:
      current && paidUntil !== null
        ? Math.max(
            0,
            Math.ceil((paidUntil - now) / 86400000)
          )
        : null
  }
}
