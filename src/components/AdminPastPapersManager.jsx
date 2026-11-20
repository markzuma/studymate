import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './PastPapers.css'

const EMPTY = {
  institution: '',
  programme: 'BSc Nursing',
  course_id: '',
  course_title: '',
  unit_id: '',
  unit_title: '',
  paper_title: '',
  academic_year: '',
  semester: '',
  exam_type: 'End Semester',
  notes: '',
  source_details: '',
  distribution_authorization: ''
}

const TYPES = [
  'CAT 1', 'CAT 2', 'Mid-semester', 'End Semester',
  'Supplementary', 'Special examination', 'Other'
]

export default function AdminPastPapersManager() {
  const [papers, setPapers] = useState([])
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [file, setFile] = useState(null)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('all')

  async function loadPapers() {
    const { data, error } = await supabase
      .from('past_papers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setMessage(`Unable to load papers: ${error.message}`)
    else setPapers(data || [])
    setLoading(false)
  }

  async function loadCourses() {
    const { data } = await supabase
      .from('courses')
      .select('id,title,code,programme')
      .order('title')

    setCourses(data || [])
  }

  async function loadUnits(courseId) {
    if (!courseId) {
      setUnits([])
      return
    }

    const { data } = await supabase
      .from('course_units')
      .select('id,title,unit_code')
      .eq('course_id', courseId)
      .order('sort_order')

    setUnits(data || [])
  }

  useEffect(() => {
    loadPapers()
    loadCourses()
  }, [])

  function update(key, value) {
    setForm(previous => ({ ...previous, [key]: value }))
  }

  function chooseCourse(courseId) {
    const course = courses.find(item => item.id === courseId)
    setForm(previous => ({
      ...previous,
      course_id: courseId,
      course_title: course?.title || '',
      unit_id: '',
      unit_title: ''
    }))
    loadUnits(courseId)
  }

  function chooseUnit(unitId) {
    const unit = units.find(item => item.id === unitId)
    setForm(previous => ({
      ...previous,
      unit_id: unitId,
      unit_title: unit?.title || ''
    }))
  }

  function editPaper(paper) {
    setEditing(paper.id)
    setForm({
      institution: paper.institution || '',
      programme: paper.programme || '',
      course_id: paper.course_id || '',
      course_title: paper.course_title || '',
      unit_id: paper.unit_id || '',
      unit_title: paper.unit_title || '',
      paper_title: paper.paper_title || '',
      academic_year: paper.academic_year || '',
      semester: paper.semester || '',
      exam_type: paper.exam_type || 'End Semester',
      notes: paper.notes || '',
      source_details: paper.source_details || '',
      distribution_authorization: paper.distribution_authorization || ''
    })
    setFile(null)
    if (paper.course_id) loadUnits(paper.course_id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditing(null)
    setForm(EMPTY)
    setFile(null)
    setUnits([])
  }

  async function savePaper(event) {
    event.preventDefault()
    setMessage('')

    if (!form.institution.trim() || !form.course_title.trim()
      || !form.unit_title.trim() || !form.paper_title.trim()
      || !form.academic_year.trim() || !form.semester.trim()) {
      setMessage('Complete the required paper details.')
      return
    }

    if (!editing && !file) {
      setMessage('Select the PDF file to upload.')
      return
    }

    if (file && file.size > 20 * 1024 * 1024) {
      setMessage('Maximum PDF file size is 20 MB.')
      return
    }

    if (file) {
      const signature = await file.slice(0, 5).text()
      if (signature !== '%PDF-') {
        setMessage('The selected file does not have a valid PDF signature.')
        return
      }
    }

    setSaving(true)

    try {
      const { data: userResult } = await supabase.auth.getUser()
      const user = userResult?.user
      if (!user) throw new Error('Your session has expired. Sign in again.')

      const metadata = {
        institution: form.institution.trim(),
        programme: form.programme.trim(),
        course_id: form.course_id || null,
        course_title: form.course_title.trim(),
        unit_id: form.unit_id || null,
        unit_title: form.unit_title.trim(),
        paper_title: form.paper_title.trim(),
        academic_year: form.academic_year.trim(),
        semester: form.semester.trim(),
        exam_type: form.exam_type,
        notes: form.notes.trim() || null,
        source_details: form.source_details.trim() || null,
        distribution_authorization:
          form.distribution_authorization.trim() || null
      }

      let paperId = editing
      const previousStoragePath = editing
        ? papers.find(paper => paper.id === editing)?.storage_path || null
        : null
      let replacementCleanupWarning = ''

      if (editing) {
        const { error } = await supabase
          .from('past_papers')
          .update(metadata)
          .eq('id', editing)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('past_papers')
          .insert({
            ...metadata,
            uploaded_by: user.id,
            status: 'draft'
          })
          .select('id')
          .single()

        if (error) throw error
        paperId = data.id
      }

      if (file) {
        const safeName = file.name
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .slice(-120)

        const path = `${paperId}/${Date.now()}_${safeName}`

        const { error: uploadError } = await supabase.storage
          .from('past-papers')
          .upload(path, file, {
            contentType: 'application/pdf',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { error: updateError } = await supabase
          .from('past_papers')
          .update({
            storage_path: path,
            file_name: file.name,
            file_size: file.size,
            status: 'draft'
          })
          .eq('id', paperId)

        if (updateError) {
          await supabase.storage.from('past-papers').remove([path])
          throw updateError
        }

        // Remove the old file only after the database points to the new PDF.
        if (previousStoragePath && previousStoragePath !== path) {
          const { error: oldFileError } = await supabase.storage
            .from('past-papers')
            .remove([previousStoragePath])

          if (oldFileError) {
            replacementCleanupWarning =
              ` New PDF is active, but old file cleanup failed: ${oldFileError.message}`
          }
        }
      }

      setMessage((editing
        ? 'Paper metadata updated.'
        : 'Paper uploaded successfully as a draft. Review and publish when ready.'
      ) + replacementCleanupWarning)
      resetForm()
      await loadPapers()
    } catch (error) {
      setMessage(`Save failed: ${error.message}`)
    }

    setSaving(false)
  }

  async function changeStatus(paper, status) {
    setMessage('')

    if (status === 'published'
      && (!paper.source_details?.trim()
        || !paper.distribution_authorization?.trim())) {
      setMessage('Add source/provenance and distribution authorization before publishing.')
      editPaper(paper)
      return
    }

    if (status === 'published' && !paper.storage_path) {
      setMessage('This record has no PDF file uploaded.')
      return
    }

    const { error } = await supabase
      .from('past_papers')
      .update({ status })
      .eq('id', paper.id)

    if (error) setMessage(error.message)
    else {
      setMessage(`Paper ${status}.`)
      await loadPapers()
    }
  }

  async function deletePaper(paper) {
    if (!window.confirm(`Delete "${paper.paper_title}" and its PDF permanently?`))
      return

    setMessage('')

    // Delete the database record first. If this fails, the PDF remains intact.
    const { error: recordError } = await supabase
      .from('past_papers')
      .delete()
      .eq('id', paper.id)

    if (recordError) {
      setMessage(`Database deletion failed; PDF retained: ${recordError.message}`)
      return
    }

    if (paper.storage_path) {
      const { error: fileError } = await supabase.storage
        .from('past-papers')
        .remove([paper.storage_path])

      if (fileError) {
        setMessage(`Paper record deleted, but PDF cleanup failed. Orphaned file: ${paper.storage_path}. ${fileError.message}`)
        await loadPapers()
        return
      }
    }

    setMessage('Paper and PDF deleted.')
    await loadPapers()
  }

  const visible = papers.filter(paper =>
    filter === 'all' || paper.status === filter
  )

  return (
    <div className="admin-papers">
      <header className="papers-admin-header">
        <div>
          <span className="papers-eyebrow">ADMIN · CONTENT MANAGEMENT</span>
          <h2>Real Past Papers Library</h2>
          <p>Upload authentic institutional papers, verify provenance and control publication.</p>
        </div>
        <span className="papers-admin-count">{papers.length} papers</span>
      </header>

      <form className="papers-form" onSubmit={savePaper}>
        <h3>{editing ? 'Edit paper metadata' : 'Upload a real past paper'}</h3>

        <div className="papers-form-grid">
          <label>Institution / school *
            <input value={form.institution}
              onChange={e => update('institution', e.target.value)}
              placeholder="University / college / school" required />
          </label>

          <label>Programme *
            <input value={form.programme}
              onChange={e => update('programme', e.target.value)}
              placeholder="e.g. BSc Nursing" required />
          </label>

          <label>PERIAK course
            <select value={form.course_id}
              onChange={e => chooseCourse(e.target.value)}>
              <option value="">Choose linked course (optional)</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </label>

          <label>Course title *
            <input value={form.course_title}
              onChange={e => update('course_title', e.target.value)}
              placeholder="Course title" required />
          </label>

          <label>PERIAK unit
            <select value={form.unit_id}
              onChange={e => chooseUnit(e.target.value)}>
              <option value="">Choose linked unit (optional)</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.title}</option>
              ))}
            </select>
          </label>

          <label>Unit title *
            <input value={form.unit_title}
              onChange={e => update('unit_title', e.target.value)}
              placeholder="Unit / topic" required />
          </label>

          <label>Paper title *
            <input value={form.paper_title}
              onChange={e => update('paper_title', e.target.value)}
              placeholder="Official examination title" required />
          </label>

          <label>Academic / exam year *
            <input value={form.academic_year}
              onChange={e => update('academic_year', e.target.value)}
              placeholder="e.g. 2024 or 2024/2025" required />
          </label>

          <label>Semester / term *
            <input value={form.semester}
              onChange={e => update('semester', e.target.value)}
              placeholder="e.g. Semester 1" required />
          </label>

          <label>Exam type *
            <select value={form.exam_type}
              onChange={e => update('exam_type', e.target.value)}>
              {TYPES.map(type => <option key={type}>{type}</option>)}
            </select>
          </label>

          <label className="papers-wide">Source / provenance
            <input value={form.source_details}
              onChange={e => update('source_details', e.target.value)}
              placeholder="Where this paper came from / source information" />
          </label>

          <label className="papers-wide">Distribution authorization *
            <textarea value={form.distribution_authorization}
              onChange={e => update('distribution_authorization', e.target.value)}
              placeholder="Record permission, public release status, license or other authorization to distribute this paper." />
          </label>

          <label className="papers-wide">Admin notes
            <textarea value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Optional notes for administrators" />
          </label>

          <label className="papers-wide">PDF file {editing ? '(optional replacement)' : '*' }
            <input type="file" accept="application/pdf,.pdf"
              onChange={e => setFile(e.target.files?.[0] || null)}
              required={!editing} />
            <small>PDF only · Maximum 20 MB. New uploads remain drafts.</small>
          </label>
        </div>

        <div className="papers-form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save metadata' : 'Upload paper as draft'}
          </button>
          {editing && <button type="button" className="papers-secondary"
            onClick={resetForm}>Cancel edit</button>}
        </div>
        {message && <p className="papers-message">{message}</p>}
      </form>

      <section className="papers-admin-list">
        <div className="papers-list-heading">
          <h3>Manage uploaded papers</h3>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All papers</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {loading ? <p>Loading papers…</p> : visible.length === 0
          ? <p>No papers in this category yet.</p>
          : visible.map(paper => (
            <article className="papers-admin-item" key={paper.id}>
              <div className="papers-admin-item-main">
                <strong>{paper.paper_title}</strong>
                <span>{paper.institution} · {paper.programme}</span>
                <span>{paper.course_title} / {paper.unit_title}</span>
                <span>{paper.academic_year} · {paper.semester} · {paper.exam_type}</span>
                <span className={`papers-status status-${paper.status}`}>{paper.status}</span>
                <small>{paper.file_name || 'PDF missing'}</small>
              </div>
              <div className="papers-admin-actions">
                <button type="button" onClick={() => editPaper(paper)}>Edit</button>
                {paper.status !== 'published' &&
                  <button type="button" onClick={() => changeStatus(paper, 'published')}>Publish</button>}
                {paper.status === 'published' &&
                  <button type="button" onClick={() => changeStatus(paper, 'draft')}>Unpublish</button>}
                {paper.status !== 'archived' &&
                  <button type="button" onClick={() => changeStatus(paper, 'archived')}>Archive</button>}
                {paper.status === 'archived' &&
                  <button type="button" onClick={() => changeStatus(paper, 'draft')}>Restore draft</button>}
                <button type="button" className="papers-danger"
                  onClick={() => deletePaper(paper)}>Delete</button>
              </div>
            </article>
          ))}
      </section>
    </div>
  )
}
