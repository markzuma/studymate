import {
  useEffect,
  useMemo,
  useState
} from 'react'
import { supabase } from '../lib/supabase'
import {
  percentage,
  growthRate,
  movingAverage,
  describe,
  toCSV
} from '../lib/businessStatistics'
import Monetization from './Monetization'
import './BusinessIntelligence.css'

const number = value =>
  value == null
    ? '—'
    : Number(value).toLocaleString('en-KE', {
        maximumFractionDigits: 2
      })

const money = value =>
  value == null ? '—' : `KSh ${number(value)}`

const percent = value =>
  value == null ? 'N/A' : `${number(value)}%`

const human = value =>
  String(value || 'Unspecified')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, c => c.toUpperCase())

const TABS = [
  ['overview','Executive overview'],
  ['revenue','Revenue'],
  ['growth','Growth'],
  ['engagement','Engagement'],
  ['academics','Academics'],
  ['reports','Statistics'],
  ['payments','Payment management']
]

function Metric({label,value,detail}) {
  return (
    <article className="pbi-metric">
      <small>{label}</small>
      <strong>{value}</strong>
      {detail && <span>{detail}</span>}
    </article>
  )
}

function DataTable({columns,rows}) {
  if (!rows?.length) {
    return (
      <p className="pbi-muted">
        No records in this reporting period.
      </p>
    )
  }

  return (
    <div className="pbi-table-scroll">
      <table className="pbi-table">
        <thead>
          <tr>
            {columns.map(([key,label]) => (
              <th key={key} scope="col">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row,index) => (
            <tr key={index}>
              {columns.map(([key,,format]) => (
                <td key={key}>
                  {format
                    ? format(row[key],row)
                    : row[key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Panel({title,description,children}) {
  return (
    <section className="pbi-panel">
      <h3>{title}</h3>
      {description && (
        <p className="pbi-muted">{description}</p>
      )}
      {children}
    </section>
  )
}

function Trend({
  title,rows,field,currency=false,
  trackingStart=null
}) {
  const values = rows.map(row => Number(row[field] || 0))
  const average = movingAverage(values)
  const maximum = Math.max(1,...values)
  const width = 640
  const height = 230
  const left = 65
  const top = 15
  const bottom = 40

  const x = i => left + i *
    (width-left-15) / Math.max(1,values.length-1)

  const y = n => top + (1-n/maximum) *
    (height-top-bottom)

  const points = values.map((n,i) =>
    `${x(i)},${y(n)}`
  ).join(' ')

  const averagePoints = average.map((n,i) =>
    n == null ? null : `${x(i)},${y(n)}`
  ).filter(Boolean).join(' ')

  const format = currency ? money : number

  return (
    <Panel
      title={title}
      description="Daily values and seven-day trailing moving average."
    >
      {trackingStart && (
        <p className="pbi-muted">
          Earliest recorded activity: {String(trackingStart).slice(0,10)}.
          Earlier zero values may reflect unavailable tracking.
        </p>
      )}

      {!rows.length ? (
        <p>No trend data available.</p>
      ) : (
        <>
          <div className="pbi-chart-scroll">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="pbi-chart"
              role="img"
              aria-label={title}
            >
              {[0,0.25,0.5,0.75,1].map(r => (
                <g key={r}>
                  <line
                    x1={left}
                    x2={width-15}
                    y1={y(maximum*r)}
                    y2={y(maximum*r)}
                    className="pbi-gridline"
                  />
                  <text
                    x={left-8}
                    y={y(maximum*r)+4}
                    textAnchor="end"
                  >
                    {number(maximum*r)}
                  </text>
                </g>
              ))}

              <polyline
                points={points}
                fill="none"
                stroke="#287dcc"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {averagePoints && (
                <polyline
                  points={averagePoints}
                  fill="none"
                  stroke="#159568"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                />
              )}

              {values.map((value,i) => (
                <circle
                  key={rows[i].day}
                  cx={x(i)}
                  cy={y(value)}
                  r={rows.length > 35 ? 2 : 3.3}
                  fill="#287dcc"
                >
                  <title>
                    {rows[i].day}: {format(value)}
                  </title>
                </circle>
              ))}

              {rows.map((row,i) =>
                i === 0 ||
                i === rows.length-1 ||
                i % Math.ceil(rows.length/5) === 0
                ? (
                    <text
                      key={row.day}
                      x={x(i)}
                      y={height-12}
                      textAnchor="middle"
                    >
                      {row.day.slice(5)}
                    </text>
                  )
                : null
              )}
            </svg>
          </div>

          <div className="pbi-legend">
            <span><i /> Daily total</span>
            <span><i className="average" /> 7-day mean</span>
          </div>

          <details>
            <summary>View daily data table</summary>
            <DataTable
              columns={[
                ['day','Date'],
                [field,'Daily value',format],
                ['average','Moving average',format]
              ]}
              rows={rows.map((row,i) => ({
                ...row,
                average: average[i]
              }))}
            />
          </details>
        </>
      )}
    </Panel>
  )
}

function Ranked({title,rows,field,description}) {
  const maximum = Math.max(
    1,...rows.map(row => Number(row[field]))
  )

  return (
    <Panel title={title} description={description}>
      {!rows.length && <p>No records in this period.</p>}

      <div className="pbi-ranked">
        {rows.map((row,i) => (
          <div key={i} className="pbi-rank">
            <div>
              <span>{human(row.name)}</span>
              <strong>{number(row[field])}</strong>
            </div>
            <div className="pbi-track">
              <div style={{
                width: `${100*Number(row[field])/maximum}%`
              }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export default function BusinessIntelligence({
  onNavigate,
  executiveOnly = false
}) {
  const [tab,setTab] = useState('overview')
  const [days,setDays] = useState(30)
  const [version,setVersion] = useState(0)
  const [data,setData] = useState(null)
  const [loading,setLoading] = useState(true)
  const [authorized,setAuthorized] = useState(false)
  const [error,setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      setData(null)
      setAuthorized(false)

      try {
        const admin = await supabase.rpc('is_admin')

        if (admin.error || admin.data !== true) {
          throw new Error('Administrator access required.')
        }

        if (!active) return

        setAuthorized(true)

        const result = await supabase.rpc(
          'admin_business_intelligence',
          {p_days:days}
        )

        if (result.error) throw result.error

        if (active) setData(result.data)
      } catch {
        if (active) {
          setError(
            'Unable to load business analytics or access denied.'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => { active = false }
  },[days,version])

  const currentRows = useMemo(
    () => (data?.daily || []).filter(
      row => row.day >= data.period_start
    ),
    [data]
  )

  const totals = data?.totals || {}
  const current = data?.current_period || {}
  const previous = data?.previous_period || {}
  const coverage = data?.coverage || {}

  function exportReport() {
    if (!authorized || !data) return

    const csv = toCSV(
      currentRows,
      [
        'day',
        'registrations',
        'revenue',
        'completed_payments',
        'active_students',
        'interactions',
        'paper_opens',
        'referrals',
        'completed_exams'
      ]
    )

    const url = URL.createObjectURL(
      new Blob(['\uFEFF',csv], {
        type:'text/csv;charset=utf-8'
      })
    )

    const link = document.createElement('a')
    link.href = url
    link.download =
      `PERIAK-Business-${data.period_end}-${days}days.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    window.setTimeout(
      () => URL.revokeObjectURL(url),1000
    )
  }

  const comparisons = [
    ['revenue','Completed payment value',money],
    ['registrations','New student registrations',number],
    ['completed_payments','Completed payments',number],
    ['mean_daily_active','Mean daily active students',number],
    ['interactions','Feature and paper events',number],
    ['paper_opens','Individual paper opens',number],
    ['referrals','Referral registrations',number],
    ['completed_exams','Completed Smart Exams',number]
  ].map(([key,label,format]) => ({
    name:label,
    current:format(current[key]),
    previous:format(previous[key]),
    change:percent(
      growthRate(current[key],previous[key])
    )
  }))

  const providerRows = (data?.providers || []).map(row => ({
    ...row,
    rate:percentage(row.completed,row.attempts)
  }))

  let cumulative = 0

  const cumulativeRows = currentRows.map(row => {
    cumulative += Number(row.registrations)
    return {...row,cumulative}
  })

  const statisticalRows = [
    ['revenue','Daily completed payment value'],
    ['registrations','Daily registrations'],
    ['active_students','Daily active students'],
    ['interactions','Daily interactions'],
    ['completed_exams','Daily completed examinations']
  ].map(([field,name]) => ({
    name,
    ...describe(
      currentRows.map(row => row[field])
    )
  }))

  return (
    <div className="pbi-page">
      <header className="pbi-header">
        <div>
          <small>
            {executiveOnly
              ? 'MANAGEMENT COMMAND CENTRE'
              : 'PERIAK BUSINESS INTELLIGENCE'}
          </small>
          <h2>
            {executiveOnly
              ? 'Executive Dashboard'
              : 'Business Intelligence'}
          </h2>
          <p>
            Revenue, growth, engagement and
            academic performance.
          </p>
        </div>
        <span className="pbi-access">Administrator only</span>
      </header>

      {!executiveOnly && (
      <nav className="pbi-tabs" aria-label="Business reports">
        {TABS.map(([id,label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'active' : ''}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      )}

      {tab === 'payments' ? (
        authorized ? <Monetization /> :
          error ? (
            <div className="pbi-error" role="alert">
              {error}
              <button
                type="button"
                onClick={() => setVersion(v => v+1)}
              >
                Retry
              </button>
            </div>
          ) : <p>Checking administrator access…</p>
      ) : (
        <>
          <div className="pbi-toolbar">
            <div className="pbi-range">
              {[7,30,90].map(value => (
                <button
                  key={value}
                  type="button"
                  className={days === value ? 'active' : ''}
                  onClick={() => setDays(value)}
                >
                  {value} days
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setVersion(v => v+1)}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={exportReport}
              disabled={!data || loading || !authorized}
            >
              Export daily CSV
            </button>
          </div>

          {error && (
            <div role="alert" className="pbi-error">
              {error}
            </div>
          )}

          {loading && (
            <p role="status">
              Loading business intelligence…
            </p>
          )}

          {authorized && data && (
            <>
              <p className="pbi-muted">
                {data.period_start} to {data.period_end}
                {' · '}East African Time.
                Completed calendar days.
                Historical zero values may include
                periods before tracking began.
              </p>

              {tab === 'overview' && (
                <>
                  <div className="pbi-metrics">
                    <Metric
                      label="Completed payment value"
                      value={money(totals.completed_payment_value)}
                      detail="All time · current completed status"
                    />
                    <Metric
                      label="Registered students"
                      value={number(totals.students)}
                      detail="Current student accounts"
                    />
                    <Metric
                      label="Active paying members"
                      value={number(totals.active_paying_members)}
                      detail="Valid subscription with completed payment"
                    />
                    <Metric
                      label="Pending payment value"
                      value={money(totals.pending_value)}
                      detail={`${totals.pending_payments} pending transactions`}
                    />
                    <Metric
                      label="Period revenue"
                      value={money(current.revenue)}
                      detail={`${percent(growthRate(current.revenue,previous.revenue))} period change`}
                    />
                    <Metric
                      label="New registrations"
                      value={number(current.registrations)}
                      detail={`${percent(growthRate(current.registrations,previous.registrations))} period change`}
                    />
                    <Metric
                      label="Active students"
                      value={number(totals.active_students_period)}
                      detail="Distinct tracked students in period"
                    />
                    <Metric
                      label="Feature interactions"
                      value={number(current.interactions)}
                      detail="Student feature and paper events"
                    />
                    {executiveOnly && (
                      <>
                        <Metric
                          label="Published courses"
                          value={number(totals.published_courses)}
                          detail="Available academic subjects"
                        />
                        <Metric
                          label="Published lessons"
                          value={number(totals.published_lessons)}
                          detail="Available learning materials"
                        />
                        <Metric
                          label="Published past papers"
                          value={number(totals.published_papers)}
                          detail="Examination resources"
                        />
                        <Metric
                          label="Memberships expiring soon"
                          value={number(totals.expiring_7_days)}
                          detail="Within the next seven days"
                        />
                      </>
                    )}
                  </div>

                  <Panel title="Today so far">
                    <div className="pbi-metrics">
                      <Metric
                        label="Today's completed value"
                        value={money(data.today?.revenue)}
                      />
                      <Metric
                        label="New students today"
                        value={number(data.today?.registrations)}
                      />
                      <Metric
                        label="Active students today"
                        value={number(data.today?.active_students)}
                      />
                    </div>
                  </Panel>

                  <div className="pbi-two">
                    <Trend
                      title="Revenue trend"
                      rows={currentRows}
                      field="revenue"
                      currency
                      trackingStart={coverage.payment_first_record}
                    />
                    <Trend
                      title="Student registration trend"
                      rows={currentRows}
                      field="registrations"
                    />
                  </div>

                  {executiveOnly && (
                    <div className="pbi-two">
                      <Trend
                        title="Student engagement trend"
                        rows={currentRows}
                        field="active_students"
                        trackingStart={coverage.activity_first_record}
                      />
                      <Ranked
                        title="Most used features"
                        rows={data.features}
                        field="opens"
                      />
                    </div>
                  )}

                  <Panel
                    title="Business comparison"
                    description="Equal-length previous reporting period. N/A indicates no valid non-zero baseline."
                  >
                    <DataTable
                      columns={[
                        ['name','Indicator'],
                        ['current','Current'],
                        ['previous','Previous'],
                        ['change','Change']
                      ]}
                      rows={comparisons}
                    />
                  </Panel>

                  <Panel title="Management shortcuts">
                    <div className="pbi-toolbar">
                      <button
                        onClick={() => onNavigate?.('monetization')}
                      >
                        Manage payments
                      </button>
                      {executiveOnly && (
                        <>
                          <button
                            onClick={() => onNavigate?.('business')}
                          >
                            Full Business Intelligence
                          </button>
                          <button
                            onClick={() => onNavigate?.('operations')}
                          >
                            Platform operations
                          </button>
                        </>
                      )}
                      <button onClick={() => onNavigate?.('usage')}>
                        Detailed usage
                      </button>
                      <button onClick={() => onNavigate?.('growth')}>
                        Referral management
                      </button>
                      <button onClick={() => onNavigate?.('academic-quality')}>
                        Academic quality
                      </button>
                    </div>
                  </Panel>
                </>
              )}

              {tab === 'revenue' && (
                <>
                  <div className="pbi-metrics">
                    <Metric
                      label="Period completed value"
                      value={money(current.revenue)}
                    />
                    <Metric
                      label="Average transaction"
                      value={money(data.transaction_statistics.mean)}
                    />
                    <Metric
                      label="Median transaction"
                      value={money(data.transaction_statistics.median)}
                    />
                    <Metric
                      label="Repeat buyers"
                      value={number(totals.repeat_buyers)}
                      detail="All time; not a renewal rate"
                    />
                    <Metric
                      label="Ever-paying students"
                      value={percent(percentage(
                        totals.paying_students,
                        totals.students
                      ))}
                      detail="Current students with completed payments"
                    />
                    <Metric
                      label="Expiring within 7 days"
                      value={number(totals.expiring_7_days)}
                    />
                    <Metric
                      label="Active subscriptions"
                      value={number(totals.active_members)}
                    />
                    <Metric
                      label="Referral-only Premium"
                      value={number(totals.active_referral_only_members)}
                    />
                  </div>

                  <Trend
                    title="Daily completed payment value"
                    rows={currentRows}
                    field="revenue"
                    currency
                    trackingStart={coverage.payment_first_record}
                  />

                  <Panel
                    title="Payment provider performance"
                    description="Transactions initiated in the period, grouped by current status. Historical test attempts may be included."
                  >
                    <DataTable
                      columns={[
                        ['provider','Provider',human],
                        ['attempts','Attempts',number],
                        ['completed','Completed',number],
                        ['failed','Failed',number],
                        ['pending','Pending',number],
                        ['refunded','Refunded',number],
                        ['rate','Completed proportion',percent]
                      ]}
                      rows={providerRows}
                    />
                  </Panel>

                  <Panel title="Revenue by subscription plan">
                    <DataTable
                      columns={[
                        ['name','Plan',human],
                        ['completed_payments','Payments',number],
                        ['buyers','Buyers',number],
                        ['revenue','Completed value',money]
                      ]}
                      rows={data.plans}
                    />
                  </Panel>

                  <Panel
                    title="Premium conversion activity"
                    description="Event counts and distinct accounts. These are not a sequential conversion cohort."
                  >
                    <DataTable
                      columns={[
                        ['event','Event',human],
                        ['events','Occurrences',number],
                        ['students','Distinct students',number]
                      ]}
                      rows={data.funnel}
                    />
                  </Panel>

                  <p className="pbi-muted">
                    All-time refunded-status value:
                    {' '}{money(totals.refunded_payment_value)}.
                    Completed payments missing verification dates:
                    {' '}{money(totals.undated_completed_value)}.
                    Period revenue uses verification date and current
                    completed status. It is not net profit or a bank
                    settlement statement.
                  </p>
                </>
              )}

              {tab === 'growth' && (
                <>
                  <div className="pbi-metrics">
                    <Metric
                      label="Registered students"
                      value={number(totals.students)}
                    />
                    <Metric
                      label="Period registrations"
                      value={number(current.registrations)}
                    />
                    <Metric
                      label="Registration growth"
                      value={percent(growthRate(
                        current.registrations,
                        previous.registrations
                      ))}
                    />
                    <Metric
                      label="Referral registrations"
                      value={number(current.referrals)}
                    />
                  </div>

                  <Trend
                    title="Daily student registrations"
                    rows={currentRows}
                    field="registrations"
                  />
                  <Trend
                    title="Cumulative registrations within period"
                    rows={cumulativeRows}
                    field="cumulative"
                  />
                  <Trend
                    title="Referral registration trend"
                    rows={currentRows}
                    field="referrals"
                  />

                  <Panel title="Referral acquisition channels">
                    <DataTable
                      columns={[
                        ['source','Channel',human],
                        ['registrations','Registrations',number]
                      ]}
                      rows={data.referral_sources}
                    />
                  </Panel>
                </>
              )}

              {tab === 'engagement' && (
                <>
                  <div className="pbi-two">
                    <Trend
                      title="Daily active students"
                      rows={currentRows}
                      field="active_students"
                      trackingStart={coverage.activity_first_record}
                    />
                    <Trend
                      title="Daily feature interactions"
                      rows={currentRows}
                      field="interactions"
                      trackingStart={coverage.feature_first_record}
                    />
                  </div>

                  <Ranked
                    title="Feature popularity"
                    rows={data.features}
                    field="opens"
                    description="Feature opens only; individual paper opens excluded."
                  />

                  <Panel title="Feature usage distribution">
                    <DataTable
                      columns={[
                        ['name','Feature',human],
                        ['opens','Opens',number],
                        ['students','Distinct students',number]
                      ]}
                      rows={data.features}
                    />
                  </Panel>

                  <Panel
                    title="Platform distribution"
                    description="A student can appear on multiple platforms."
                  >
                    <DataTable
                      columns={[
                        ['name','Platform',human],
                        ['students','Students',number],
                        ['activity_records','Daily records',number]
                      ]}
                      rows={data.platforms}
                    />
                  </Panel>
                </>
              )}

              {tab === 'academics' && (
                <>
                  <div className="pbi-metrics">
                    <Metric
                      label="Published courses"
                      value={number(totals.published_courses)}
                    />
                    <Metric
                      label="Published lessons"
                      value={number(totals.published_lessons)}
                    />
                    <Metric
                      label="Published papers"
                      value={number(totals.published_papers)}
                    />
                    <Metric
                      label="Completed examinations"
                      value={number(current.completed_exams)}
                    />
                  </div>

                  <Trend
                    title="Past paper reading activity"
                    rows={currentRows}
                    field="paper_opens"
                    trackingStart={coverage.feature_first_record}
                  />

                  <Trend
                    title="Completed examination trend"
                    rows={currentRows}
                    field="completed_exams"
                  />

                  <Ranked
                    title="Most opened past papers"
                    rows={data.papers}
                    field="opens"
                  />

                  <Ranked
                    title="Most studied courses"
                    rows={data.courses}
                    field="study_records"
                  />

                  <Panel title="Smart Exam performance">
                    <DataTable
                      columns={[
                        ['mode','Mode',human],
                        ['completed','Completed',number],
                        ['students','Students',number],
                        ['average_score_percent','Mean score',percent]
                      ]}
                      rows={data.exams}
                    />
                  </Panel>
                </>
              )}

              {tab === 'reports' && (
                <>
                  <Panel
                    title="Descriptive statistics"
                    description="Completed-day observations. Standard deviation is calculated using the sample formula (n−1)."
                  >
                    <DataTable
                      columns={[
                        ['name','Variable'],
                        ['count','Observations',number],
                        ['mean','Mean',number],
                        ['median','Median',number],
                        ['standardDeviation','Std. deviation',number],
                        ['min','Minimum',number],
                        ['max','Maximum',number]
                      ]}
                      rows={statisticalRows}
                    />
                  </Panel>

                  <Panel title="Period-on-period growth">
                    <DataTable
                      columns={[
                        ['name','Indicator'],
                        ['current','Current'],
                        ['previous','Previous'],
                        ['change','Percentage change']
                      ]}
                      rows={comparisons}
                    />
                  </Panel>

                  <Panel title="Payment value distribution">
                    <div className="pbi-metrics">
                      <Metric
                        label="Mean transaction"
                        value={money(data.transaction_statistics.mean)}
                      />
                      <Metric
                        label="Median transaction"
                        value={money(data.transaction_statistics.median)}
                      />
                      <Metric
                        label="Sample standard deviation"
                        value={money(data.transaction_statistics.standard_deviation)}
                      />
                    </div>
                  </Panel>

                  <Panel title="Tracking coverage">
                    <DataTable
                      columns={[
                        ['name','Dataset'],
                        ['date','Earliest surviving record']
                      ]}
                      rows={Object.entries(coverage).map(
                        ([name,date]) => ({
                          name:human(name),
                          date:date || 'Not recorded'
                        })
                      )}
                    />
                    <p className="pbi-muted">
                      Earliest surviving records do not establish
                      the exact date tracking began. Missing data
                      and deleted accounts can affect historical trends.
                      Treat comparisons as descriptive, not causal.
                    </p>
                  </Panel>

                  <Panel title="Daily statistical report">
                    <DataTable
                      columns={[
                        ['day','Date'],
                        ['registrations','New students',number],
                        ['revenue','Completed value',money],
                        ['active_students','Active',number],
                        ['interactions','Interactions',number],
                        ['referrals','Referrals',number],
                        ['completed_exams','Exams',number]
                      ]}
                      rows={currentRows}
                    />
                  </Panel>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
