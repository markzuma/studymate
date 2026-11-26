import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

async function readAll(table, columns) {
  const rows = []
  const pageSize = 500

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    rows.push(...(data || []))

    if (!data || data.length < pageSize) break
  }

  return rows
}

export default function AdminLessonDirectory({
  courses = [],
  onOpenLesson,
  onOpenUnit,
  initialCourseId = ''
}) {
  const [units, setUnits] = useState([])
  const [materials, setMaterials] = useState([])
  const [search, setSearch] = useState('')
  const [courseId, setCourseId] = useState(initialCourseId)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  const [page, setPage] = useState(1)
  const [opening, setOpening] = useState(false)

  const pageSize = 15

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const [unitRows, materialRows] = await Promise.all([
          readAll(
            'course_units',
            'id,course_id,title,status'
          ),
          readAll(
            'learning_materials',
            'id,unit_id,title,status'
          )
        ])

        if (active) {
          setUnits(unitRows)
          setMaterials(materialRows)
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || 'Unable to load academic directory.'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => { active = false }
  }, [version])

  useEffect(() => {
    setCourseId(initialCourseId)
    setPage(1)
  }, [initialCourseId])

  const rows = useMemo(() => {
    const courseMap = new Map(
      courses.map(course => [course.id, course])
    )

    const byUnit = new Map()

    for (const material of materials) {
      const existing = byUnit.get(material.unit_id) || []
      existing.push(material)
      byUnit.set(material.unit_id, existing)
    }

    return units.flatMap(unit => {
      const course = courseMap.get(unit.course_id)
      const lessons = byUnit.get(unit.id) || []

      const base = {
        courseId: unit.course_id,
        courseTitle: course?.title || 'Unknown course',
        unitId: unit.id,
        unitTitle: unit.title,
        unitStatus: unit.status
      }

      if (!lessons.length) {
        return [{
          ...base,
          id: `empty-${unit.id}`,
          materialId: null,
          title: 'No lesson yet',
          status: 'missing'
        }]
      }

      return lessons.map(material => ({
        ...base,
        id: material.id,
        materialId: material.id,
        title: material.title,
        status: material.status
      }))
    }).sort((a, b) =>
      a.courseTitle.localeCompare(b.courseTitle) ||
      a.unitTitle.localeCompare(b.unitTitle)
    )
  }, [courses, units, materials])

  const query = search.trim().toLowerCase()

  const filtered = rows.filter(row =>
    (!courseId || row.courseId === courseId) &&
    (!status || row.status === status) &&
    (!query || [
      row.courseTitle,
      row.unitTitle,
      row.title
    ].join(' ').toLowerCase().includes(query))
  )

  const pages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  )

  const currentPage = Math.min(page, pages)

  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  async function openRow(row) {
    if (opening) return

    setOpening(true)
    setError('')

    try {
      if (row.materialId) {
        await onOpenLesson(
          row.courseId,
          row.unitId,
          row.materialId
        )
      } else {
        await onOpenUnit(row.courseId, row.unitId)
      }

      window.requestAnimationFrame(() => {
        document.getElementById('cc3-lesson-editor')
          ?.scrollIntoView({ block: 'start' })
      })
    } catch (err) {
      setError(err.message || 'Unable to open lesson.')
    } finally {
      setOpening(false)
    }
  }

  return (
    <section className="cc3-lesson-directory">
      <header className="cc3-panel-header">
        <div>
          <h3>Academic directory</h3>
          <p>
            Find and manage learning materials directly.
          </p>
        </div>

        <button
          type="button"
          className="ccv2-secondary"
          disabled={loading || opening}
          onClick={() => setVersion(v => v + 1)}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </header>

      <div className="cc3-directory-stats">
        {[
          ['Units', units.length],
          ['Lessons', materials.length],
          [
            'Published',
            materials.filter(
              item => item.status === 'published'
            ).length
          ],
          [
            'Missing lessons',
            rows.filter(
              row => row.status === 'missing'
            ).length
          ]
        ].map(([label, value]) => (
          <div key={label}>
            <small>{label}</small>
            <strong>{loading || error ? '—' : value}</strong>
          </div>
        ))}
      </div>

      <div className="cc3-directory-filters">
        <input
          type="search"
          aria-label="Search learning materials"
          placeholder="Search course, unit or lesson..."
          value={search}
          onChange={event => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />

        <select
          aria-label="Filter lessons by course"
          value={courseId}
          onChange={event => {
            setCourseId(event.target.value)
            setPage(1)
          }}
        >
          <option value="">All courses</option>

          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter publication status"
          value={status}
          onChange={event => {
            setStatus(event.target.value)
            setPage(1)
          }}
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
          <option value="missing">Missing lesson</option>
        </select>
      </div>

      {error && (
        <p className="cc-error" role="alert">{error}</p>
      )}

      {loading ? (
        <p role="status">Loading academic records…</p>
      ) : (
        <>
          <div className="cc-table-wrap">
            <table className="cc-table cc3-directory-table">
              <thead>
                <tr>
                  <th>Course & unit</th>
                  <th>Lesson</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {visible.map(row => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.unitTitle}</strong>
                      <small>{row.courseTitle}</small>
                    </td>

                    <td>{row.title}</td>

                    <td>
                      <span className={
                        'cc3-record-status status-' +
                        row.status
                      }>
                        {row.status}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="cc-unit-action"
                        disabled={opening}
                        onClick={() => openRow(row)}
                      >
                        {row.materialId
                          ? 'Edit lesson'
                          : 'Create lesson'}
                      </button>
                    </td>
                  </tr>
                ))}

                {!visible.length && (
                  <tr>
                    <td colSpan="4">
                      No matching academic records.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="cc3-directory-pagination">
            <small>
              {filtered.length} matching records
            </small>

            <button
              type="button"
              className="ccv2-secondary"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </button>

            <small>{currentPage} / {pages}</small>

            <button
              type="button"
              className="ccv2-secondary"
              disabled={currentPage >= pages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  )
}
