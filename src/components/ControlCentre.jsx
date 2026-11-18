import { useEffect, useState } from 'react'
import { useBackHandler } from '../context/NavigationProvider'
import { supabase } from '../lib/supabase'
import './ControlCentre.css'
import Monetization from './Monetization'
import { legacyCourses, legacyUnits, legacyLessonContent } from '../legacyCourseData'
import AdminAcademicManager from './AdminAcademicManager'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'courses', label: 'Courses & Units' },
  { id: 'materials', label: 'Learning Materials' },
  { id: 'outlines', label: 'Course Outlines' },
  { id: 'exams', label: 'Examinations' },
  { id: 'results', label: 'Results & Analytics' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'monetization', label: 'Monetization' }
]

export default function ControlCentre({ onClose }) {
  const [section, setSection] = useState('overview')
  const [sectionHistory, setSectionHistory] = useState([])
  const [profiles, setProfiles] = useState([])
  const [presenceNow, setPresenceNow] = useState(Date.now())
  const [courses, setCourses] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [courseTitle, setCourseTitle] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [description, setDescription] = useState('')
  const [programme, setProgramme] = useState('BSc Nursing')
  const [year, setYear] = useState('1')
  const [semester, setSemester] = useState('1')
  const [savingCourse, setSavingCourse] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState('')
  const [courseMessage, setCourseMessage] = useState('')
  const [importingLegacy, setImportingLegacy] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [units, setUnits] = useState([])
  const [materialCourseId, setMaterialCourseId] = useState('')
  const [materialUnits, setMaterialUnits] = useState([])
  const [materialUnitId, setMaterialUnitId] = useState('')
  const [materials, setMaterials] = useState([])
  const [editingMaterialId, setEditingMaterialId] = useState('')
  const [materialTitle, setMaterialTitle] = useState('')
  const [materialContent, setMaterialContent] = useState('')
  const [materialStatus, setMaterialStatus] = useState('draft')
  const [materialMessage, setMaterialMessage] = useState('')
  const [loadingMaterialUnits, setLoadingMaterialUnits] = useState(false)
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [savingMaterial, setSavingMaterial] = useState(false)
  const [unitTitle, setUnitTitle] = useState('')
  const [unitCode, setUnitCode] = useState('')
  const [unitDescription, setUnitDescription] = useState('')
  const [unitMessage, setUnitMessage] = useState('')
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [savingUnit, setSavingUnit] = useState(false)
  const [editingUnitId, setEditingUnitId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const refreshPresence = async () => {
      const { data, error } = await supabase
        .from('user_activity')
        .select('user_id, last_seen')

      if (!error) {
        const activityByUser = new Map(
          (data || []).map(item => [item.user_id, item.last_seen])
        )

        setProfiles(previous => previous.map(user => ({
          ...user,
          last_seen: activityByUser.get(user.id) || null
        })))
      }

      setPresenceNow(Date.now())
    }

    const refreshTimer = window.setInterval(refreshPresence, 60000)
    const clockTimer = window.setInterval(
      () => setPresenceNow(Date.now()),
      15000
    )

    return () => {
      window.clearInterval(refreshTimer)
      window.clearInterval(clockTimer)
    }
  }, [])

  function navigateSection(nextSection) {
    if (nextSection === section) return
    setSectionHistory(previous => [...previous, section])
    setSection(nextSection)
  }

  function handleSectionBack() {
    if (sectionHistory.length === 0) return false
    const previousSection = sectionHistory[sectionHistory.length - 1]
    setSectionHistory(previous => previous.slice(0, -1))
    setSection(previousSection)
    return true
  }

  useBackHandler(handleSectionBack, sectionHistory.length > 0, 30)

  async function loadDashboard() {
    setLoading(true)
    setError('')

    const results = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, username, email, phone_number, role, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('courses')
        .select('id, title, code, programme, year_of_study, semester, status')
        .order('created_at', { ascending: false }),
      supabase.from('announcements')
        .select('id, title, audience, status, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('user_activity')
        .select('user_id, last_seen')
    ])

    const failed = results.find(result => result.error)

    if (failed) {
      setError('Unable to load dashboard information. Check database permissions.')
    } else {
      const activityByUser = new Map(
        (results[3].data || []).map(item => [item.user_id, item.last_seen])
      )

      setProfiles((results[0].data || []).map(user => ({
        ...user,
        last_seen: activityByUser.get(user.id) || null
      })))
      setCourses(results[1].data || [])
      setAnnouncements(results[2].data || [])
      setPresenceNow(Date.now())
    }

    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  async function importLegacyCourses() {
    if (importingLegacy) return

    setImportingLegacy(true)
    setImportMessage('Preparing original PERIAK courses...')

    const counts = {
      coursesCreated: 0,
      unitsCreated: 0,
      lessonsCreated: 0,
      lessonsSkipped: 0
    }

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        throw new Error('Administrator session not found. Please sign in again.')
      }

      for (const legacyCourse of legacyCourses) {
        const { data: matchingCourses, error: courseLookupError } = await supabase
          .from('courses')
          .select('id, title')
          .eq('title', legacyCourse.title)

        if (courseLookupError) {
          throw new Error(`Could not check course "${legacyCourse.title}": ${courseLookupError.message}`)
        }

        if (matchingCourses.length > 1) {
          throw new Error(`Multiple courses named "${legacyCourse.title}" already exist. Import stopped to avoid ambiguity.`)
        }

        let courseId

        if (matchingCourses.length === 1) {
          courseId = matchingCourses[0].id
        } else {
          const { data: newCourse, error: courseInsertError } = await supabase
            .from('courses')
            .insert({
              title: legacyCourse.title,
              description: legacyCourse.desc || null,
              programme: 'BSc Nursing',
              year_of_study: 1,
              semester: 1,
              status: 'published',
              created_by: userData.user.id
            })
            .select('id')
            .single()

          if (courseInsertError) {
            throw new Error(`Could not create course "${legacyCourse.title}": ${courseInsertError.message}`)
          }

          courseId = newCourse.id
          counts.coursesCreated++
        }

        const originalUnitTitles = legacyUnits[legacyCourse.title] || []

        const { data: existingUnits, error: unitLookupError } = await supabase
          .from('course_units')
          .select('id, title')
          .eq('course_id', courseId)

        if (unitLookupError) {
          throw new Error(`Could not load units for "${legacyCourse.title}": ${unitLookupError.message}`)
        }

        const unitMap = new Map()

        for (const unit of existingUnits || []) {
          if (unitMap.has(unit.title)) {
            throw new Error(`Duplicate unit "${unit.title}" found in "${legacyCourse.title}". Import stopped safely.`)
          }
          unitMap.set(unit.title, unit.id)
        }

        const missingUnits = originalUnitTitles
          .map((title, index) => ({ title, sort_order: index * 10 }))
          .filter(unit => !unitMap.has(unit.title))
          .map(unit => ({
            course_id: courseId,
            title: unit.title,
            unit_code: null,
            description: null,
            sort_order: unit.sort_order,
            status: 'published'
          }))

        if (missingUnits.length > 0) {
          const { data: insertedUnits, error: unitInsertError } = await supabase
            .from('course_units')
            .insert(missingUnits)
            .select('id, title')

          if (unitInsertError) {
            throw new Error(`Could not add units to "${legacyCourse.title}": ${unitInsertError.message}`)
          }

          for (const unit of insertedUnits || []) {
            unitMap.set(unit.title, unit.id)
          }

          counts.unitsCreated += insertedUnits?.length || 0
        }

        const unitIds = originalUnitTitles
          .map(title => unitMap.get(title))
          .filter(Boolean)

        if (unitIds.length === 0) continue

        const { data: existingMaterials, error: materialLookupError } = await supabase
          .from('learning_materials')
          .select('id, unit_id, title')
          .in('unit_id', unitIds)

        if (materialLookupError) {
          throw new Error(`Could not check lesson materials for "${legacyCourse.title}": ${materialLookupError.message}`)
        }

        const materialKeys = new Set()

        for (const material of existingMaterials || []) {
          const key = `${material.unit_id}::${material.title}`
          if (materialKeys.has(key)) {
            throw new Error(`Duplicate material "${material.title}" found. Import stopped safely.`)
          }
          materialKeys.add(key)
        }

        const materialsToInsert = []

        for (const unitTitle of originalUnitTitles) {
          const lesson = legacyLessonContent[unitTitle]
          const unitId = unitMap.get(unitTitle)

          if (!lesson || !unitId) continue

          const materialTitle = 'PERIAK original lesson content'
          const key = `${unitId}::${materialTitle}`

          if (materialKeys.has(key)) {
            counts.lessonsSkipped++
            continue
          }

          materialsToInsert.push({
            unit_id: unitId,
            title: materialTitle,
            material_type: 'notes',
            content: JSON.stringify(lesson),
            sort_order: 0,
            status: 'published',
            created_by: userData.user.id
          })

          materialKeys.add(key)
        }

        if (materialsToInsert.length > 0) {
          const { data: insertedMaterials, error: materialInsertError } = await supabase
            .from('learning_materials')
            .insert(materialsToInsert)
            .select('id')

          if (materialInsertError) {
            throw new Error(`Could not save lessons for "${legacyCourse.title}": ${materialInsertError.message}`)
          }

          counts.lessonsCreated += insertedMaterials?.length || 0
        }

        setImportMessage(`Imported/checking: ${legacyCourse.title}`)
      }

      setImportMessage(
        `Import complete. New courses: ${counts.coursesCreated}; new units: ${counts.unitsCreated}; new lessons: ${counts.lessonsCreated}; existing lessons skipped: ${counts.lessonsSkipped}.`
      )

      await loadDashboard()
    } catch (error) {
      setImportMessage(`Import stopped safely: ${error.message} You can run it again after resolving the issue.`)
    } finally {
      setImportingLegacy(false)
    }
  }

  async function createCourse(event) {
    event.preventDefault()
    setCourseMessage('')

    if (!courseTitle.trim()) {
      setCourseMessage('Please enter the course title.')
      return
    }

    setSavingCourse(true)

    const courseData = {
      title: courseTitle.trim(),
      code: courseCode.trim() || null,
      description: description.trim() || null,
      programme: programme.trim() || null,
      year_of_study: Number(year),
      semester: Number(semester)
    }

    let saveError = null

    if (editingCourseId) {
      const result = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', editingCourseId)

      saveError = result.error
    } else {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        setCourseMessage('Unable to identify the administrator. Please sign in again.')
        setSavingCourse(false)
        return
      }

      const result = await supabase
        .from('courses')
        .insert({
          ...courseData,
          status: 'draft',
          created_by: userData.user.id
        })

      saveError = result.error
    }

    if (saveError) {
      setCourseMessage(`Course could not be saved: ${saveError.message}`)
    } else {
      setCourseMessage(editingCourseId ? 'Course updated successfully.' : 'Course created successfully.')
      setCourseTitle('')
      setCourseCode('')
      setDescription('')
      setProgramme('BSc Nursing')
      setYear('1')
      setSemester('1')
      setEditingCourseId('')
      setShowCourseForm(false)
      await loadDashboard()
    }

    setSavingCourse(false)
  }

  function editCourse(course) {
    setEditingCourseId(course.id)
    setCourseTitle(course.title || '')
    setCourseCode(course.code || '')
    setDescription(course.description || '')
    setProgramme(course.programme || 'BSc Nursing')
    setYear(String(course.year_of_study || 1))
    setSemester(String(course.semester || 1))
    setShowCourseForm(true)
    setCourseMessage('')
  }

  async function toggleCourseStatus(course) {
    setCourseMessage('')
    setSavingCourse(true)

    const nextStatus = course.status === 'published' ? 'draft' : 'published'

    const { error } = await supabase
      .from('courses')
      .update({ status: nextStatus })
      .eq('id', course.id)

    if (error) {
      setCourseMessage(`Course status could not be changed: ${error.message}`)
    } else {
      setCourseMessage(
        nextStatus === 'published'
          ? 'Course published successfully.'
          : 'Course unpublished and returned to draft.'
      )
      await loadDashboard()
    }

    setSavingCourse(false)
  }

  async function loadCourseUnits(courseId) {
    setLoadingUnits(true)
    setUnitMessage('')

    const { data, error } = await supabase
      .from('course_units')
      .select('id, course_id, title, unit_code, description, sort_order, status')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true })

    if (error) {
      setUnits([])
      setUnitMessage(`Unable to load units: ${error.message}`)
    } else {
      setUnits(data || [])
    }

    setLoadingUnits(false)
  }

  async function createUnit(event) {
    event.preventDefault()
    setUnitMessage('')

    if (!selectedCourseId || !unitTitle.trim()) {
      setUnitMessage('Select a course and enter a unit title.')
      return
    }

    setSavingUnit(true)

    const unitData = {
      title: unitTitle.trim(),
      unit_code: unitCode.trim() || null,
      description: unitDescription.trim() || null
    }

    const result = editingUnitId
      ? await supabase.from('course_units')
          .update(unitData)
          .eq('id', editingUnitId)
      : await supabase.from('course_units')
          .insert({
            ...unitData,
            course_id: selectedCourseId,
            sort_order: units.length * 10,
            status: 'draft'
          })

    if (result.error) {
      setUnitMessage(`Unit could not be saved: ${result.error.message}`)
    } else {
      setUnitMessage(editingUnitId
        ? 'Unit updated successfully.'
        : 'Unit created successfully as a draft.'
      )
      setUnitTitle('')
      setUnitCode('')
      setUnitDescription('')
      setEditingUnitId('')
      await loadCourseUnits(selectedCourseId)
    }

    setSavingUnit(false)
  }

  async function toggleUnitStatus(unit) {
    const nextStatus = unit.status === 'published' ? 'draft' : 'published'
    setUnitMessage('')
    setSavingUnit(true)

    const { error } = await supabase
      .from('course_units')
      .update({ status: nextStatus })
      .eq('id', unit.id)

    if (error) {
      setUnitMessage(`Unable to update unit status: ${error.message}`)
    } else {
      setUnitMessage(
        nextStatus === 'published'
          ? 'Unit published successfully.'
          : 'Unit returned to draft.'
      )
      await loadCourseUnits(selectedCourseId)
    }

    setSavingUnit(false)
  }

  function editUnit(unit) {
    setEditingUnitId(unit.id)
    setUnitTitle(unit.title || '')
    setUnitCode(unit.unit_code || '')
    setUnitDescription(unit.description || '')
    setUnitMessage('Editing unit. Save your changes when finished.')
  }

  async function loadMaterialUnits(courseId) {
    setLoadingMaterialUnits(true)
    setMaterialMessage('')

    const { data, error } = await supabase
      .from('course_units')
      .select('id, course_id, title, status, sort_order')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true })

    if (error) {
      setMaterialUnits([])
      setMaterialMessage(`Unable to load course units: ${error.message}`)
    } else {
      setMaterialUnits(data || [])
    }

    setLoadingMaterialUnits(false)
    return data || []
  }

  async function loadUnitMaterials(unitId) {
    setLoadingMaterials(true)
    setMaterialMessage('')

    const { data, error } = await supabase
      .from('learning_materials')
      .select('id, unit_id, title, material_type, content, sort_order, status')
      .eq('unit_id', unitId)
      .order('sort_order', { ascending: true })

    if (error) {
      setMaterials([])
      setMaterialMessage(`Unable to load lesson materials: ${error.message}`)
      setLoadingMaterials(false)
      return []
    }

    setMaterials(data || [])
    setLoadingMaterials(false)
    return data || []
  }

  function resetMaterialForm() {
    setEditingMaterialId('')
    setMaterialTitle('')
    setMaterialContent(JSON.stringify({
      objectives: [],
      notes: [],
      clinical: [],
      examPoints: [],
      questions: []
    }, null, 2))
    setMaterialStatus('draft')
  }

  function editMaterial(material) {
    setEditingMaterialId(material.id)
    setMaterialTitle(material.title || '')

    try {
      const parsed = JSON.parse(material.content || '{}')
      setMaterialContent(JSON.stringify(parsed, null, 2))
    } catch {
      setMaterialContent(material.content || '')
    }

    setMaterialStatus(material.status || 'draft')
    setMaterialMessage('Editing existing lesson. Save your changes when ready.')
  }

  async function handleMaterialCourseChange(courseId) {
    setMaterialCourseId(courseId)
    setMaterialUnitId('')
    setMaterialUnits([])
    setMaterials([])
    setMaterialMessage('')
    resetMaterialForm()

    if (courseId) {
      await loadMaterialUnits(courseId)
    }
  }

  async function handleMaterialUnitChange(unitId) {
    setMaterialUnitId(unitId)
    setMaterials([])
    setMaterialMessage('')
    resetMaterialForm()

    if (!unitId) return

    const rows = await loadUnitMaterials(unitId)

    if (rows.length === 1) {
      editMaterial(rows[0])
    } else if (rows.length > 1) {
      setMaterialMessage(
        'More than one material exists for this unit. Select the lesson you want to edit below.'
      )
    } else {
      setMaterialMessage('No lesson exists for this unit yet. Create its first lesson below.')
    }
  }

  async function saveMaterial(event) {
    event.preventDefault()
    setMaterialMessage('')

    if (!materialUnitId || !materialTitle.trim()) {
      setMaterialMessage('Select a unit and enter a lesson title.')
      return
    }

    let parsedContent

    try {
      parsedContent = JSON.parse(materialContent)
    } catch (error) {
      setMaterialMessage(`Invalid JSON: ${error.message}`)
      return
    }

    if (
      !parsedContent ||
      typeof parsedContent !== 'object' ||
      Array.isArray(parsedContent)
    ) {
      setMaterialMessage('Lesson content must be a JSON object.')
      return
    }

    const requiredArrays = ['objectives', 'notes', 'examPoints']
    const invalidField = requiredArrays.find(
      field => !Array.isArray(parsedContent[field])
    )

    if (invalidField) {
      setMaterialMessage(
        `The "${invalidField}" field must be an array. Keep objectives, notes and examPoints as arrays.`
      )
      return
    }

    if (
      parsedContent.questions !== undefined &&
      !Array.isArray(parsedContent.questions)
    ) {
      setMaterialMessage('The "questions" field must be an array.')
      return
    }

    if (
      parsedContent.mcqs !== undefined &&
      !Array.isArray(parsedContent.mcqs)
    ) {
      setMaterialMessage('The "mcqs" field must be an array.')
      return
    }

    if (!editingMaterialId && materials.length > 0) {
      setMaterialMessage(
        'A material already exists for this unit. Select it above and edit it instead of creating a duplicate.'
      )
      return
    }

    setSavingMaterial(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        throw new Error('Administrator session not found. Sign in again.')
      }

      const payload = {
        unit_id: materialUnitId,
        title: materialTitle.trim(),
        material_type: 'notes',
        content: JSON.stringify(parsedContent),
        sort_order: editingMaterialId
          ? materials.find(item => item.id === editingMaterialId)?.sort_order ?? 0
          : 0,
        status: materialStatus
      }

      let savedId = editingMaterialId

      if (editingMaterialId) {
        const { error } = await supabase
          .from('learning_materials')
          .update(payload)
          .eq('id', editingMaterialId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('learning_materials')
          .insert({
            ...payload,
            created_by: userData.user.id
          })
          .select('id')
          .single()

        if (error) throw error
        savedId = data.id
      }

      setMaterialMessage('Lesson saved successfully.')
      const refreshed = await loadUnitMaterials(materialUnitId)
      const savedMaterial = refreshed.find(item => item.id === savedId)

      if (savedMaterial) editMaterial(savedMaterial)
    } catch (error) {
      setMaterialMessage(`Lesson could not be saved: ${error.message}`)
    } finally {
      setSavingMaterial(false)
    }
  }

  const selectedCourse = courses.find(course => course.id === selectedCourseId)
  const selectedMaterialCourse = courses.find(
    course => course.id === materialCourseId
  )
  const selectedMaterialUnit = materialUnits.find(
    unit => unit.id === materialUnitId
  )

  const students = profiles.filter(user => user.role === 'student')
  const admins = profiles.filter(user => user.role === 'admin')
  const onlineUsers = profiles.filter(user =>
    user.last_seen &&
    presenceNow - new Date(user.last_seen).getTime() < 2 * 60 * 1000
  ).length

  const filteredUsers = profiles.filter(user => {
    const search = userSearch.trim().toLowerCase()
    const searchable = [
      user.full_name,
      user.username,
      user.email,
      user.phone_number
    ].filter(Boolean).join(' ').toLowerCase()
    const matchesSearch = searchable.includes(search)
    const matchesRole = userFilter === 'all' || user.role === userFilter
    return matchesSearch && matchesRole
  })

  return (
    <main className="control-centre">
      <header className="cc-header">
        <div>
          <span className="cc-eyebrow">PERIAK MANAGEMENT</span>
          <h1>Control Centre</h1>
          <p>Manage your nursing learning platform.</p>
        </div>
        <button onClick={onClose}>Back to Learning</button>
      </header>

      <nav className="cc-navigation">
        {SECTIONS.map(item => (
          <button
            key={item.id}
            className={section === item.id ? 'active' : ''}
            onClick={() => navigateSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {error && <p className="cc-error">{error}</p>}

      {loading ? (
        <p className="cc-empty">Loading Control Centre...</p>
      ) : (
        <section className="cc-content">
          {section === 'overview' && (
            <>
              <h2>Platform Overview</h2>
              <div className="cc-stats">
                <article><span>Total Users</span><strong>{profiles.length}</strong></article>
                <article><span>Students</span><strong>{students.length}</strong></article>
                <article><span>Administrators</span><strong>{admins.length}</strong></article>
                <article><span>Online Now</span><strong>{onlineUsers}</strong></article>
                <article><span>Courses</span><strong>{courses.length}</strong></article>
              </div>
              <div className="cc-panel">
                <h3>Recent Announcements</h3>
                {announcements.length === 0
                  ? <p>No announcements have been created.</p>
                  : announcements.slice(0, 5).map(item => (
                    <p key={item.id}>{item.title} · {item.status}</p>
                  ))}
              </div>
            </>
          )}

          {section === 'users' && (
            <>
              <h2>User Management</h2>
              <div className="cc-user-tools">
                <input
                  type="search"
                  placeholder="Search name, username, email or phone..."
                  value={userSearch}
                  onChange={event => setUserSearch(event.target.value)}
                />
                <select
                  value={userFilter}
                  onChange={event => setUserFilter(event.target.value)}
                >
                  <option value="all">All users</option>
                  <option value="student">Students</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
              <p>Showing {filteredUsers.length} of {profiles.length} users</p>
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Activity</th>
                      <th>Date Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>{user.full_name || 'Name not provided'}</td>
                        <td>{user.username ? `@${user.username}` : '—'}</td>
                        <td>{user.email || 'Not available'}</td>
                        <td>{user.phone_number || 'Not provided'}</td>
                        <td>{user.role}</td>
                        <td>
                          {user.last_seen &&
                           presenceNow - new Date(user.last_seen).getTime() < 2 * 60 * 1000 ? (
                            <span className="cc-presence cc-presence-online">
                              <span className="cc-presence-dot" />
                              Online
                            </span>
                          ) : user.last_seen ? (
                            <span className="cc-presence cc-presence-offline">
                              Last seen {new Date(user.last_seen).toLocaleString()}
                            </span>
                          ) : (
                            <span className="cc-presence cc-presence-offline">
                              Not active yet
                            </span>
                          )}
                        </td>
                        <td>{user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : 'Not available'}</td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan="7">No matching users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {section === 'courses' && (
            <>
              <button
                type="button"
                className="cc-unit-action"
                disabled={importingLegacy}
                onClick={importLegacyCourses}
              >
                {importingLegacy ? 'Importing original courses...' : 'Import original PERIAK courses and lessons'}
              </button>
              {importMessage && <p className="cc-course-message">{importMessage}</p>}

              <div className="cc-section-heading">
                <div>
                  <h2>Courses & Units</h2>
                  <p>Registered courses: {courses.length}</p>
                </div>
                <button onClick={() => {
                  if (showCourseForm) {
                    setShowCourseForm(false)
                    setEditingCourseId('')
                    setCourseTitle('')
                    setCourseCode('')
                    setDescription('')
                    setProgramme('BSc Nursing')
                    setYear('1')
                    setSemester('1')
                  } else {
                    setEditingCourseId('')
                    setShowCourseForm(true)
                  }
                  setCourseMessage('')
                }}>
                  {showCourseForm ? 'Cancel' : '+ Add Course'}
                </button>
              </div>

              {courseMessage && <p className="cc-course-message">{courseMessage}</p>}

              {showCourseForm && (
                <form className="cc-course-form" onSubmit={createCourse}>
                  <h3>{editingCourseId ? 'Edit Course' : 'Create a New Course'}</h3>

                  <label>Course Title *</label>
                  <input
                    value={courseTitle}
                    onChange={event => setCourseTitle(event.target.value)}
                    placeholder="e.g. Medical-Surgical Nursing II"
                    required
                  />

                  <label>Course Code</label>
                  <input
                    value={courseCode}
                    onChange={event => setCourseCode(event.target.value)}
                    placeholder="e.g. NUR 204"
                  />

                  <label>Description</label>
                  <textarea
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                    placeholder="Brief description of the course"
                    rows="3"
                  />

                  <label>Programme</label>
                  <input
                    value={programme}
                    onChange={event => setProgramme(event.target.value)}
                    placeholder="e.g. BSc Nursing"
                  />

                  <div className="cc-form-row">
                    <div>
                      <label>Year of Study</label>
                      <select value={year} onChange={event => setYear(event.target.value)}>
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                      </select>
                    </div>
                    <div>
                      <label>Semester</label>
                      <select value={semester} onChange={event => setSemester(event.target.value)}>
                        <option value="1">Semester 1</option>
                        <option value="2">Semester 2</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={savingCourse}>
                    {savingCourse ? 'Saving Course...' : editingCourseId ? 'Update Course' : 'Save Course'}
                  </button>
                  {editingCourseId && (
                    <button
                      type="button"
                      className="cc-unit-action"
                      disabled={savingCourse}
                      onClick={() => {
                        setEditingCourseId('')
                        setCourseTitle('')
                        setCourseCode('')
                        setDescription('')
                        setProgramme('BSc Nursing')
                        setYear('1')
                        setSemester('1')
                        setShowCourseForm(false)
                        setCourseMessage('')
                      }}
                    >
                      Cancel editing
                    </button>
                  )}
                </form>
              )}

              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr><th>Course</th><th>Code</th><th>Status</th><th>Manage</th><th>Edit</th><th>Publish</th></tr>
                  </thead>
                  <tbody>
                    {courses.map(course => (
                      <tr key={course.id}>
                        <td>{course.title}</td>
                        <td>{course.code || '—'}</td>
                        <td>{course.status}</td>
                        <td>
                          <button
                            type="button"
                            className="cc-unit-action"
                            onClick={() => {
                              setSelectedCourseId(course.id)
                              setUnitTitle('')
                              setUnitCode('')
                              setUnitDescription('')
                              setUnitMessage('')
                              setEditingUnitId('')
                              loadCourseUnits(course.id)
                            }}
                          >
                            Manage units
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="cc-unit-action"
                            onClick={() => editCourse(course)}
                          >
                            Edit
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="cc-unit-action"
                            disabled={savingCourse}
                            onClick={() => toggleCourseStatus(course)}
                          >
                            {course.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {courses.length === 0 && (
                      <tr><td colSpan="6">No courses have been created.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {selectedCourse && (
                <section className="cc-unit-manager">
                  <div className="cc-section-heading">
                    <div>
                      <h3>Units: {selectedCourse.title}</h3>
                      <p>Units are saved as drafts until you publish them.</p>
                    </div>
                    <button
                      type="button"
                      className="cc-unit-action"
                      onClick={() => {
                        setSelectedCourseId('')
                        setUnits([])
                        setUnitMessage('')
                      }}
                    >
                      Close
                    </button>
                  </div>

                  {unitMessage && <p className="cc-course-message">{unitMessage}</p>}

                  <form className="cc-course-form" onSubmit={createUnit}>
                    <h3>{editingUnitId ? 'Edit Unit' : 'Add a Unit'}</h3>

                    <label>Unit Title *</label>
                    <input
                      value={unitTitle}
                      onChange={event => setUnitTitle(event.target.value)}
                      placeholder="e.g. Introduction to Cardiovascular Nursing"
                      required
                    />

                    <label>Unit Code</label>
                    <input
                      value={unitCode}
                      onChange={event => setUnitCode(event.target.value)}
                      placeholder="e.g. UNIT 01"
                    />

                    <label>Description</label>
                    <textarea
                      value={unitDescription}
                      onChange={event => setUnitDescription(event.target.value)}
                      placeholder="Brief description of this unit"
                      rows="3"
                    />

                    <button type="submit" disabled={savingUnit}>
                      {savingUnit ? 'Saving Unit...' : editingUnitId ? 'Update Unit' : 'Save Unit'}
                    </button>
                    {editingUnitId && (
                      <button
                        type="button"
                        className="cc-unit-action"
                        disabled={savingUnit}
                        onClick={() => {
                          setEditingUnitId('')
                          setUnitTitle('')
                          setUnitCode('')
                          setUnitDescription('')
                          setUnitMessage('')
                        }}
                      >
                        Cancel editing
                      </button>
                    )}
                  </form>

                  <h3>Existing Units ({units.length})</h3>

                  {loadingUnits ? (
                    <p>Loading units...</p>
                  ) : (
                    <div className="cc-table-wrap">
                      <table className="cc-table">
                        <thead>
                          <tr><th>Order</th><th>Unit</th><th>Code</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                          {units.map((unit, index) => (
                            <tr key={unit.id}>
                              <td>{index + 1}</td>
                              <td>{unit.title}</td>
                              <td>{unit.unit_code || '—'}</td>
                              <td>{unit.status}</td>
                              <td>
                                <button
                                  type="button"
                                  className="cc-unit-action"
                                  disabled={savingUnit}
                                  onClick={() => editUnit(unit)}
                                >
                                  Edit
                                </button>
                                {' '}
                                <button
                                  type="button"
                                  className="cc-unit-action"
                                  disabled={savingUnit}
                                  onClick={() => toggleUnitStatus(unit)}
                                >
                                  {unit.status === 'published' ? 'Unpublish' : 'Publish'}
                                </button>
                              </td>
                            </tr>
                          ))}
                          {units.length === 0 && (
                            <tr><td colSpan="5">No units have been added to this course yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          {section === 'monetization' && <Monetization />}

          {section === 'materials' && (
            <>
              <h2>Learning Materials</h2>
              <p className="cc-materials-intro">
                Create and edit structured lessons for your published nursing courses.
                Changes are saved to the database.
              </p>

              <div className="cc-materials-panel">
                <div className="cc-materials-selectors">
                  <label>
                    Select course
                    <select
                      value={materialCourseId}
                      onChange={event => handleMaterialCourseChange(event.target.value)}
                    >
                      <option value="">Choose a course...</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.title} ({course.status})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Select unit
                    <select
                      value={materialUnitId}
                      disabled={!materialCourseId || loadingMaterialUnits}
                      onChange={event => handleMaterialUnitChange(event.target.value)}
                    >
                      <option value="">
                        {loadingMaterialUnits ? 'Loading units...' : 'Choose a unit...'}
                      </option>
                      {materialUnits.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.title} ({unit.status})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {selectedMaterialCourse && (
                  <p className="cc-materials-context">
                    Course: <strong>{selectedMaterialCourse.title}</strong>
                    {' · '}
                    Status: <strong>{selectedMaterialCourse.status}</strong>
                  </p>
                )}

                {selectedMaterialUnit && (
                  <p className="cc-materials-context">
                    Unit: <strong>{selectedMaterialUnit.title}</strong>
                    {' · '}
                    Status: <strong>{selectedMaterialUnit.status}</strong>
                  </p>
                )}

                {materialMessage && (
                  <p className="cc-course-message">{materialMessage}</p>
                )}

                {loadingMaterials && <p>Loading lesson materials...</p>}

                {materials.length > 1 && (
                  <div className="cc-table-wrap">
                    <table className="cc-table">
                      <thead>
                        <tr>
                          <th>Lesson</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map(material => (
                          <tr key={material.id}>
                            <td>{material.title}</td>
                            <td>{material.status}</td>
                            <td>
                              <button
                                type="button"
                                className="cc-material-action"
                                onClick={() => editMaterial(material)}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {materialUnitId && !loadingMaterials && (
                  <>
                    {materials.length === 0 && (
                      <button
                        type="button"
                        className="cc-unit-action"
                        onClick={resetMaterialForm}
                      >
                        + Create lesson for this unit
                      </button>
                    )}

                    {materials.length === 1 && (
                      <p className="cc-materials-context">
                        Existing lesson: <strong>{materials[0].title}</strong>
                        {' · '}
                        {materials[0].status}
                      </p>
                    )}

                    <form className="cc-material-form" onSubmit={saveMaterial}>
                      <h3>
                        {editingMaterialId ? 'Edit Lesson' : 'Create Lesson'}
                      </h3>

                      <label>Lesson title *</label>
                      <input
                        value={materialTitle}
                        onChange={event => setMaterialTitle(event.target.value)}
                        placeholder="e.g. Introduction to the cardiovascular system"
                        required
                      />

                      <label>Publication status</label>
                      <select
                        value={materialStatus}
                        onChange={event => setMaterialStatus(event.target.value)}
                      >
                        <option value="draft">Draft — administrator only</option>
                        <option value="published">Published — visible to students</option>
                        <option value="archived">Archived — hidden from students</option>
                      </select>

                      <label>Structured lesson content (JSON) *</label>
                      <textarea
                        className="cc-material-json"
                        value={materialContent}
                        onChange={event => setMaterialContent(event.target.value)}
                        spellCheck={false}
                        rows={22}
                        required
                      />

                      <p className="cc-materials-help">
                        Required fields: objectives, notes and examPoints must be
                        arrays. Optional fields include clinical, questions and mcqs.
                        Existing lessons retain their original structure.
                      </p>

                      <div className="cc-material-actions">
                        <button type="submit" disabled={savingMaterial}>
                          {savingMaterial ? 'Saving lesson...' : 'Save lesson'}
                        </button>

                        <button
                          type="button"
                          className="cc-material-secondary"
                          onClick={() => {
                            const current = materials.find(
                              item => item.id === editingMaterialId
                            )
                            if (current) editMaterial(current)
                            else resetMaterialForm()
                            setMaterialMessage('Unsaved changes discarded.')
                          }}
                        >
                          Reset changes
                        </button>
                      </div>

                      <details className="cc-material-preview">
                        <summary>Preview lesson JSON</summary>
                        <pre>{materialContent}</pre>
                      </details>
                    </form>
                  </>
                )}

                {!materialUnitId && (
                  <p className="cc-empty">
                    Select a course and unit to view or edit its lesson.
                  </p>
                )}
              </div>
            </>
          )}

          {section === 'exams' && (
            <AdminAcademicManager mode="exams" courses={courses} />
          )}

          {section === 'results' && (
            <AdminAcademicManager mode="results" courses={courses} />
          )}

          {section === 'outlines' && (
            <AdminAcademicManager mode="outlines" courses={courses} />
          )}

          {section === 'announcements' && (
            <>
              <h2>Announcements</h2>
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead><tr><th>Title</th><th>Audience</th><th>Status</th></tr></thead>
                  <tbody>
                    {announcements.map(item => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.audience}</td>
                        <td>{item.status}</td>
                      </tr>
                    ))}
                    {announcements.length === 0 && (
                      <tr><td colSpan="3">No announcements have been created.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      <footer className="cc-footer">
        <button onClick={loadDashboard} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Dashboard'}
        </button>
      </footer>
    </main>
  )
}
