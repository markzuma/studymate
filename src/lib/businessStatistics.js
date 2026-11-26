export function percentage(a, b) {
  if (a == null || b == null) return null

  return Number(b) > 0
    ? 100 * Number(a) / Number(b)
    : null
}

export function growthRate(current, previous) {
  if (current == null || previous == null) return null

  return Number(previous) > 0
    ? 100 * (Number(current) - Number(previous)) /
      Number(previous)
    : null
}

export function movingAverage(values, window = 7) {
  return values.map((_, index) => {
    if (index + 1 < window) return null

    const slice = values.slice(
      index - window + 1,
      index + 1
    )

    return slice.reduce(
      (sum, value) => sum + Number(value), 0
    ) / window
  })
}

export function describe(values) {
  const numbers = values
    .filter(value =>
      value !== null &&
      value !== undefined &&
      value !== ''
    )
    .map(Number)
    .filter(Number.isFinite)

  const count = numbers.length

  if (!count) {
    return {
      count: 0,
      mean: null,
      median: null,
      standardDeviation: null,
      min: null,
      max: null
    }
  }

  const sorted = [...numbers].sort((a,b) => a-b)

  const mean = numbers.reduce(
    (sum,n) => sum+n,0
  ) / count

  const middle = Math.floor(count/2)

  const median = count % 2
    ? sorted[middle]
    : (sorted[middle-1]+sorted[middle])/2

  const variance = count > 1
    ? numbers.reduce(
        (sum,n) => sum+(n-mean)**2,0
      ) / (count-1)
    : null

  return {
    count,
    mean,
    median,
    standardDeviation:
      variance === null ? null : Math.sqrt(variance),
    min: sorted[0],
    max: sorted[count-1]
  }
}

export function csvCell(value) {
  let text = value == null ? '' : String(value)

  if (/^[\s]*[=+\-@]/.test(text)) {
    text = "'" + text
  }

  return '"' + text.replaceAll('"','""') + '"'
}

export function toCSV(rows, columns) {
  return [
    columns.map(csvCell).join(','),
    ...rows.map(row =>
      columns.map(key =>
        csvCell(row[key])
      ).join(',')
    )
  ].join('\r\n')
}
