import WorkspaceIcon from './WorkspaceIcon'
import { useEffect, useMemo, useState } from 'react'
import useContentRefresh from '../hooks/useContentRefresh.js'
import { supabase } from '../lib/supabase'
import './PastPapers.css'

export default function PastPapersLibrary({
  isAdmin = false,
  hasPremiumAccess = false,
  premiumLoading = false,
  onBack,
  onUpgrade
}) {
  // PERIAK CONTENT AUTO-SYNC V2
  const contentRefreshVersion = useContentRefresh()
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [institution, setInstitution] = useState('')
  const [course, setCourse] = useState('')
  const [unit, setUnit] = useState('')
  const [year, setYear] = useState('')
  const [semester, setSemester] = useState('')
  const [type, setType] = useState('')

  // PERIAK COMPACT PAPERS V2
  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeFilterCount = [
    institution, course, unit, year, semester, type
  ].filter(Boolean).length
  const [message, setMessage] = useState('')
  const [opening, setOpening] = useState('')
  const [unlockedIds, setUnlockedIds] = useState([])
  const [remainingUnlocks, setRemainingUnlocks] = useState(2)

  useEffect(() => {
    let alive = true

    async function load() {
      setLoading(true)
      setMessage('')

      let query = supabase
        .from('past_papers')
        .select('*')
        .order('academic_year', { ascending: false })

      if (!isAdmin) query = query.eq('status', 'published')

      const { data, error } = await query
      if (!alive) return

      if (error) {
        setMessage(`Library could not load: ${error.message}`)
      } else {
        setPapers(data || [])
      }

      if (!isAdmin && !hasPremiumAccess) {
        const { data: unlocks, error: unlockError } = await supabase
          .from('past_paper_unlocks')
          .select('paper_id')

        if (!alive) return

        if (unlockError) {
          setMessage(`Could not load your paper unlocks: ${unlockError.message}`)
        } else {
          const ids = (unlocks || []).map(item => item.paper_id)
          setUnlockedIds(ids)
          setRemainingUnlocks(Math.max(0, 2 - ids.length))
        }
      }

      if (alive) setLoading(false)
    }

    load()
    return () => { alive = false }
  }, [isAdmin, hasPremiumAccess, contentRefreshVersion])

  const institutions = useMemo(() =>
    [...new Set(papers.map(p => p.institution).filter(Boolean))].sort(),
  [papers])

  const courses = useMemo(() =>
    [...new Set(papers.map(p => p.course_title).filter(Boolean))].sort(),
  [papers])

  const units = useMemo(() =>
    [...new Set(papers.map(p => p.unit_title).filter(Boolean))].sort(),
  [papers])

  const years = useMemo(() =>
    [...new Set(papers.map(p => p.academic_year).filter(Boolean))].sort().reverse(),
  [papers])

  const semesters = useMemo(() =>
    [...new Set(papers.map(p => p.semester).filter(Boolean))].sort(),
  [papers])

  const types = useMemo(() =>
    [...new Set(papers.map(p => p.exam_type).filter(Boolean))].sort(),
  [papers])

  const filtered = papers.filter(paper => {
    const text = [
      paper.paper_title, paper.institution, paper.programme,
      paper.course_title, paper.unit_title, paper.academic_year,
      paper.semester, paper.exam_type, paper.notes
    ].join(' ').toLowerCase()

    return (!search || text.includes(search.toLowerCase()))
      && (!institution || paper.institution === institution)
      && (!course || paper.course_title === course)
      && (!unit || paper.unit_title === unit)
      && (!year || paper.academic_year === year)
      && (!semester || paper.semester === semester)
      && (!type || paper.exam_type === type)
  })

  async function openPaper(paper) {
    if (opening || loading || premiumLoading) return
    if (!isAdmin && !hasPremiumAccess &&
        !unlockedIds.includes(paper.id) && remainingUnlocks <= 0) {
      onUpgrade?.()
      return
    }

    if (!paper.storage_path) {
      setMessage('PDF is not available for this paper.')
      return
    }

    setOpening(paper.id)
    setMessage('')

    // Open synchronously from the click to reduce popup blocking on mobile.
    const pdfWindow = window.open('about:blank', '_blank')

    if (!isAdmin && !hasPremiumAccess && !unlockedIds.includes(paper.id)) {
      const { data: access, error: accessError } = await supabase.rpc(
        'unlock_past_paper',
        { p_paper_id: paper.id }
      )

      if (accessError || !access?.unlocked) {
        if (pdfWindow) pdfWindow.close()
        setOpening('')
        setMessage(
          accessError?.message ||
          access?.message ||
          'This paper could not be unlocked. Please try again.'
        )
        if (access?.remaining === 0) {
          setRemainingUnlocks(0)
          onUpgrade?.()
        }
        return
      }

      setUnlockedIds(previous =>
        previous.includes(paper.id) ? previous : [...previous, paper.id]
      )
      if (Number.isInteger(access.remaining)) {
        setRemainingUnlocks(access.remaining)
      }
    }

    const { data, error } = await supabase.storage
      .from('past-papers')
      .createSignedUrl(paper.storage_path, 60 * 10)

    setOpening('')

    if (error || !data?.signedUrl) {
      if (pdfWindow) pdfWindow.close()
      setMessage(
        'Unable to securely open this PDF. ' +
        'Check your access and try again. ' +
        'Administrators should complete Admin View verification.'
      )
      return
    }

    supabase.rpc('record_my_event', {
      p_event_type: 'paper_open',
      p_feature_id: 'pastpapers',
      p_paper_id: paper.id
    }).then(() => {}).catch(() => {})

    if (pdfWindow) {
      pdfWindow.location.href = data.signedUrl
    } else {
      // Fallback when the browser blocks new windows.
      window.location.href = data.signedUrl
    }
  }

  function resetFilters() {
    setSearch('')
    setInstitution('')
    setCourse('')
    setUnit('')
    setYear('')
    setSemester('')
    setType('')
  }

  return (
    <main className="past-papers-page">
      <header className="papers-page-header">
        <button type="button" className="papers-back" onClick={onBack}>← Back</button>
        <div>
          <span className="papers-eyebrow">{hasPremiumAccess || isAdmin ? 'PERIAK PREMIUM' : 'PERIAK PAST PAPERS'}</span>
          <h1>Real Past Papers Library</h1>
          <p>Authentic papers organized for focused examination revision.</p>
          {!hasPremiumAccess && !isAdmin && (
            <p className="papers-free-allowance">
              Free PDF unlocks: {remainingUnlocks}/2 left.
              Reopen previously unlocked papers anytime.
              {' '}<button type="button" onClick={onUpgrade}>Explore Premium →</button>
            </p>
          )}
        </div>
      </header>

      <section className="papers-search-panel">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search institution, course, unit, paper title…" />
        <button
          type="button"
          className="papers-filter-toggle"
          aria-controls="periak-paper-filters"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen(open => !open)}
        >
          <span>
            ☷ Filters{activeFilterCount > 0
              ? ` (${activeFilterCount})`
              : ''}
          </span>
          <span aria-hidden="true">
            {filtersOpen ? '−' : '+'}
          </span>
        </button>

        <div
          id="periak-paper-filters"
          className={`papers-filter-grid${filtersOpen ? ' is-open' : ''}`}
        >
          <select value={institution} onChange={e => setInstitution(e.target.value)}>
            <option value="">All institutions</option>
            {institutions.map(v => <option key={v}>{v}</option>)}
          </select>
          <select value={course} onChange={e => setCourse(e.target.value)}>
            <option value="">All courses</option>
            {courses.map(v => <option key={v}>{v}</option>)}
          </select>
          <select value={unit} onChange={e => setUnit(e.target.value)}>
            <option value="">All units</option>
            {units.map(v => <option key={v}>{v}</option>)}
          </select>
          <select value={year} onChange={e => setYear(e.target.value)}>
            <option value="">All years</option>
            {years.map(v => <option key={v}>{v}</option>)}
          </select>
          <select value={semester} onChange={e => setSemester(e.target.value)}>
            <option value="">All semesters</option>
            {semesters.map(v => <option key={v}>{v}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="">All exam types</option>
            {types.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <button type="button" className="papers-reset" onClick={resetFilters}>Clear filters</button>
      </section>

      <div className="papers-results-heading">
        <strong>{filtered.length} paper{filtered.length === 1 ? '' : 's'}</strong>
        {isAdmin && <span>Admin preview includes unpublished papers.</span>}
      </div>

      {message && <p className="papers-message">{message}</p>}

      {loading ? <p className="papers-loading">Loading library…</p>
        : filtered.length === 0
          ? <div className="papers-empty">
              <span>📄</span>
              <h3>No matching papers</h3>
              <p>Try clearing some filters. More authentic papers will be added as they are uploaded.</p>
            </div>
          : <section className="papers-results-grid">
              {filtered.map(paper => (
                <article className="papers-result-card" key={paper.id}>
                  <div className="papers-card-top">
                    <span className="papers-card-icon">
                      <WorkspaceIcon name="papers" size={24}/>
                    </span>
                    {isAdmin && <span className={`papers-status status-${paper.status}`}>{paper.status}</span>}
                  </div>
                  <h3>{paper.paper_title}</h3>
                  <p className="papers-institution">{paper.institution}</p>
                  <p>{paper.programme}</p>
                  <div className="papers-card-meta">
                    <span>{paper.course_title}</span>
                    <span>{paper.unit_title}</span>
                    <span>{paper.academic_year} · {paper.semester}</span>
                    <span>{paper.exam_type}</span>
                  </div>
                  {paper.notes && <p className="papers-card-notes">{paper.notes}</p>}
                  <button type="button" onClick={() => openPaper(paper)}
                    disabled={Boolean(opening) || loading || premiumLoading || !paper.storage_path}>
                    {opening === paper.id ? 'Preparing secure PDF…'
                      : !hasPremiumAccess && !isAdmin && !unlockedIds.includes(paper.id)
                        ? 'Unlock & open PDF →'
                        : 'Open PDF →'}
                  </button>
                </article>
              ))}
            </section>}
    </main>
  )
}
