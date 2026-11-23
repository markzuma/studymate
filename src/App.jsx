import { lazy, Suspense, useEffect, useState } from 'react'
import { useBackHandler } from './context/NavigationProvider'
import { supabase } from './lib/supabase'
import LessonReadingTools from './components/LessonReadingTools'
import './App.css'

// Heavy screens load on demand, then are warmed in the background (see AppInner).
const loadExamCentre = () => import('./components/ExamCentre')
const loadStudyPlanner = () => import('./components/StudyPlanner')
const loadLearningSuite = () => import('./components/LearningSuite')
const loadCourseOutlineViewer = () => import('./components/CourseOutlineViewer')
const loadPastPapersLibrary = () => import('./components/PastPapersLibrary')
const ExamCentre = lazy(loadExamCentre)
const StudyPlanner = lazy(loadStudyPlanner)
const LearningSuite = lazy(loadLearningSuite)
const CourseOutlineViewer = lazy(loadCourseOutlineViewer)
const PastPapersLibrary = lazy(loadPastPapersLibrary)



// PERIAK STUDY READING V2
// Presentation only. Source text and database records remain unchanged.
function StudyText({ value }) {
  const raw = typeof value === 'string'
    ? value
    : Array.isArray(value)
      ? value.map(item =>
          typeof item === 'string'
            ? item
            : item?.content ?? item?.body ?? ''
        ).join('\n\n')
      : value?.content ?? value?.body ?? ''

  const text = String(raw ?? '')
    .replace(/\r\n?/g, '\n')
    .trim()

  if (!text) return null

  const terms = /^(?:deficiency|toxicity|excess|clinical manifestations|nursing care|nursing management|nursing interventions|assessment|diagnosis|investigations|treatment|management|prevention|complications|food sources|risk factors|signs and symptoms|contraindications|patient education|monitoring|mechanism of action|pathophysiology|priority)$/i

  const highlight = input => String(input)
    .split(/(\*\*[^*]+\*\*|\b(?:deficiency|toxicity|excess|clinical manifestations|nursing care|nursing management|nursing interventions|assessment|diagnosis|investigations|treatment|management|prevention|complications|food sources|risk factors|signs and symptoms|contraindications|patient education|monitoring|mechanism of action|pathophysiology|priority)\b)/gi)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }

      return terms.test(part)
        ? <strong className="periak-key-term" key={index}>{part}</strong>
        : part
    })

  const paragraphElements = (content, key) => {
    const sentences = content.trim()
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+(?=[A-Z])/g)

    const chunks = []
    let chunk = ''

    for (const sentence of sentences) {
      if (chunk && chunk.length + sentence.length > 230) {
        chunks.push(chunk)
        chunk = sentence
      } else {
        chunk = chunk ? `${chunk} ${sentence}` : sentence
      }
    }

    if (chunk) chunks.push(chunk)

    return chunks.map((part, index) => (
      <p className="periak-study-paragraph" key={`${key}-${index}`}>
        {highlight(part)}
      </p>
    ))
  }

  const elements = []

  text.split(/\n\s*\n/).forEach((block, blockIndex) => {
    const lines = block.split('\n')
      .map(line => line.trim())
      .filter(Boolean)

    let group = []
    let groupType = ''

    const flush = () => {
      if (!group.length) return

      const key = `${blockIndex}-${elements.length}`

      if (groupType === 'bullet') {
        elements.push(
          <ul className="periak-study-list" key={key}>
            {group.map((line, i) => (
              <li key={i}>
                {highlight(line.replace(/^[-*•]\s+/, ''))}
              </li>
            ))}
          </ul>
        )
      } else if (groupType === 'number') {
        elements.push(
          <ol className="periak-study-list" key={key}>
            {group.map((line, i) => (
              <li key={i}>
                {highlight(line.replace(/^\d+[.)]\s+/, ''))}
              </li>
            ))}
          </ol>
        )
      } else if (groupType === 'heading') {
        group.forEach((line, i) => {
          elements.push(
            <h4 className="periak-study-subheading" key={`${key}-${i}`}>
              {highlight(line.replace(/^#{2,4}\s+/, ''))}
            </h4>
          )
        })
      } else {
        elements.push(...paragraphElements(group.join(' '), key))
      }

      group = []
    }

    for (const line of lines) {
      const nextType = /^[-*•]\s+/.test(line)
        ? 'bullet'
        : /^\d+[.)]\s+/.test(line)
          ? 'number'
          : /^#{2,4}\s+/.test(line)
            ? 'heading'
            : 'prose'

      if (groupType && nextType !== groupType) flush()

      groupType = nextType
      group.push(line)
    }

    flush()
  })

  return (
    <div className="periak-study-text periak-study-text-v2">
      {elements}
    </div>
  )
}


// PERIAK PERSONAL HOMEPAGE V2
function HomeWelcome({ name, completedCount = 0 }) {
  const firstName = String(name || '')
    .trim()
    .split(/\s+/)[0]

  const hour = new Date().getHours()

  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening'

  return (
    <section
      className="periak-home-welcome"
      aria-label="Personalised study welcome"
    >
      <div className="periak-home-copy">
        <span className="periak-home-label">
          YOUR STUDY SPACE
        </span>

        <h2>
          {greeting}{firstName ? `, ${firstName}` : ''} 👋
        </h2>

        <p>
          Welcome back! Continue learning, explore your
          nursing subjects and make progress at your pace.
        </p>
      </div>

      <div className="periak-home-stat">
        <strong>{completedCount}</strong>
        <span>
          {completedCount === 1
            ? 'Lesson completed'
            : 'Lessons completed'}
        </span>
      </div>
    </section>
  )
}

const legacyCourseCatalogue = [
  { icon: '🫀', title: 'Anatomy & Physiology', desc: 'Understand the structure and functions of the human body.', level: 'FOUNDATION' },
  { icon: '🩺', title: 'Medical-Surgical Nursing', desc: 'Learn to assess, manage and care for patients with diseases.', level: 'CORE NURSING' },
  { icon: '💊', title: 'Clinical Pharmacology', desc: 'Master medicines, their actions and nursing considerations.', level: 'CORE NURSING' },
  { icon: '🤰', title: 'Midwifery', desc: 'Explore pregnancy, childbirth and essential maternal care.', level: 'SPECIALTY' },
  { icon: '🌍', title: 'Community Health', desc: 'Learn prevention, health promotion and community care.', level: 'SPECIALTY' },
  { icon: '🧠', title: 'Mental Health Nursing', desc: 'Understand mental health conditions and compassionate care.', level: 'SPECIALTY' },
]

const legacyUnitCatalogue = {
  'Anatomy & Physiology': ['Introduction to human anatomy and physiology', 'Cells and tissues', 'Skeletal system', 'Muscular system', 'Cardiovascular system', 'Respiratory system', 'Digestive system', 'Urinary system', 'Nervous system', 'Endocrine system'],
  'Medical-Surgical Nursing': ['Introduction to medical-surgical nursing', 'Patient assessment and diagnostic investigations', 'Respiratory disorders', 'Cardiovascular disorders', 'Gastrointestinal disorders', 'Renal and urinary disorders', 'Neurological disorders', 'Endocrine disorders', 'Haematological disorders', 'Perioperative nursing'],
  'Clinical Pharmacology': ['Introduction to pharmacology', 'Drug classifications and dosage forms', 'Pharmacokinetics', 'Pharmacodynamics', 'Medication administration', 'Antibiotics and antimicrobials', 'Cardiovascular drugs', 'Central nervous system drugs', 'Drug safety and adverse reactions'],
  'Midwifery': ['Introduction to midwifery', 'Female reproductive anatomy', 'Conception and embryology', 'Physiological changes in pregnancy', 'Antenatal care', 'Normal labour and delivery', 'Postnatal care', 'Newborn care', 'Obstetric complications'],
  'Community Health': ['Introduction to community health nursing', 'Primary health care', 'Community diagnosis', 'Epidemiology', 'Health promotion and education', 'Environmental health', 'Immunisation', 'Communicable diseases', 'Community assessment'],
  'Mental Health Nursing': ['Introduction to mental health nursing', 'Mental health assessment', 'Therapeutic communication', 'Anxiety disorders', 'Mood disorders', 'Psychotic disorders', 'Substance use disorders', 'Psychiatric medications', 'Psychiatric nursing interventions'],
}


function readLearningData() {
  try {
    const saved = JSON.parse(localStorage.getItem('periak_learning_progress_v1') || '{}')
    return {
      completed: Array.isArray(saved.completed) ? saved.completed : [],
      recent: Array.isArray(saved.recent) ? saved.recent : []
    }
  } catch {
    return { completed: [], recent: [] }
  }
}

function mergeLearningData(localData, cloudData) {
  const completed = [...new Set([
    ...(localData.completed || []),
    ...(cloudData.completed || [])
  ])]

  const recentMap = new Map()
  for (const item of [...(localData.recent || []), ...(cloudData.recent || [])]) {
    if (!item?.courseTitle || !item?.unit) continue
    const key = `${item.courseTitle}::${item.unit}`
    const existing = recentMap.get(key)
    if (!existing || (item.studiedAt || 0) > (existing.studiedAt || 0)) {
      recentMap.set(key, item)
    }
  }

  const recent = [...recentMap.values()]
    .sort((a, b) => (b.studiedAt || 0) - (a.studiedAt || 0))
    .slice(0, 6)

  return { completed, recent }
}

function AppInner({ isPremium = false, premiumLoading = false, isAdmin = false, welcomeName = '', onOpenPremium = () => {}, onOpenPremiumFeature = () => {}, premiumLaunch = null, onPremiumLaunchHandled = () => {}, onPremiumModuleBack = () => {} }) {
  const [learningData, setLearningData] = useState(readLearningData)
  const [activeLearningUser, setActiveLearningUser] = useState(null)
  const [learningCloudReady, setLearningCloudReady] = useState(false)
  const [showExams, setShowExams] = useState(false)
  const [activePremiumModule, setActivePremiumModule] = useState('')

  useEffect(() => {
    if (!activePremiumModule) return
    supabase.rpc('record_my_event', {
      p_event_type: 'feature_open',
      p_feature_id: String(activePremiumModule),
      p_paper_id: null
    }).then(() => {}).catch(() => {})
  }, [activePremiumModule])

  // Warm the screens a student is likely to open next, once the browser is idle.
  useEffect(() => {
    if (navigator.connection?.saveData) return undefined
    const warm = () => {
      loadPastPapersLibrary().catch(() => {})
      loadLearningSuite().catch(() => {})
      loadExamCentre().catch(() => {})
      loadStudyPlanner().catch(() => {})
      loadCourseOutlineViewer().catch(() => {})
    }
    const id = 'requestIdleCallback' in window
      ? window.requestIdleCallback(warm, { timeout: 5000 })
      : window.setTimeout(warm, 3000)
    return () => {
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(id)
      else window.clearTimeout(id)
    }
  }, [])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [catalogueCourses, setCatalogueCourses] = useState(legacyCourseCatalogue)

  // PERIAK COMPACT COURSE CATALOGUE V1
  const [courseSearch, setCourseSearch] = useState('')
  const [showAllCourses, setShowAllCourses] = useState(false)

  const courseQuery = courseSearch.trim().toLowerCase()

  const matchingCatalogueCourses = catalogueCourses.filter(course =>
    `${course.title} ${course.level || ''} ${course.desc || ''}`
      .toLowerCase()
      .includes(courseQuery)
  )

  const visibleCatalogueCourses = courseQuery || showAllCourses
    ? matchingCatalogueCourses
    : matchingCatalogueCourses.slice(0, 8)
  const [catalogueUnits, setCatalogueUnits] = useState(legacyUnitCatalogue)
  const [catalogueLessons, setCatalogueLessons] = useState({})
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkBusy, setBookmarkBusy] = useState(false)

  useEffect(() => {
    let active = true

    async function loadBookmark() {
      if (!selectedCourse || !selectedUnit) {
        setIsBookmarked(false)
        return
      }

      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('id')
        .eq('course_title', selectedCourse.title)
        .eq('unit_title', selectedUnit)
        .maybeSingle()

      if (!active) return
      if (error) {
        console.error('Could not load lesson bookmark:', error.message)
        setIsBookmarked(false)
      } else {
        setIsBookmarked(Boolean(data))
      }
    }

    loadBookmark()
    return () => { active = false }
  }, [selectedCourse, selectedUnit])

  async function toggleLessonBookmark() {
    if (!selectedCourse || !selectedUnit || bookmarkBusy) return

    setBookmarkBusy(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!authData?.user) throw new Error('Please sign in to save bookmarks.')

      if (isBookmarked) {
        const { error } = await supabase
          .from('user_bookmarks')
          .delete()
          .eq('user_id', authData.user.id)
          .eq('course_title', selectedCourse.title)
          .eq('unit_title', selectedUnit)

        if (error) throw error
        setIsBookmarked(false)
      } else {
        const { error } = await supabase
          .from('user_bookmarks')
          .insert({
            user_id: authData.user.id,
            course_title: selectedCourse.title,
            unit_title: selectedUnit
          })

        if (error) throw error
        setIsBookmarked(true)
      }
    } catch (error) {
      console.error('Could not update lesson bookmark:', error.message)
    } finally {
      setBookmarkBusy(false)
    }
  }

  useEffect(() => {
    if (!premiumLaunch) return
    setActivePremiumModule(premiumLaunch)
    if (premiumLaunch === 'exams') setShowExams(true)
    onPremiumLaunchHandled()
  }, [premiumLaunch, onPremiumLaunchHandled])


  // Load published courses, units and structured lessons from Supabase.
  // Lesson content is loaded only from published Supabase materials.
  useEffect(() => {
    let active = true

    const loadCatalogue = async (session) => {
      if (!session?.user) return

      try {
        const { data: courseRows, error: courseError } = await supabase
          .from('courses')
          .select('id, title, description, programme, year_of_study, semester, status')
          .eq('status', 'published')

        if (courseError) throw courseError
        if (!courseRows?.length) return

        const courseIds = courseRows.map(course => course.id)

        const { data: unitRows, error: unitError } = await supabase
          .from('course_units')
          .select('id, course_id, title, sort_order, status')
          .in('course_id', courseIds)
          .eq('status', 'published')
          .order('sort_order', { ascending: true })

        if (unitError) throw unitError

        const unitIds = (unitRows || []).map(unit => unit.id)
        let materialRows = []

        if (unitIds.length) {
          const { data, error } = await supabase
            .from('learning_materials')
            .select('unit_id, content, sort_order, status')
            .in('unit_id', unitIds)
            .eq('status', 'published')
            .order('sort_order', { ascending: true })

          if (error) throw error
          materialRows = data || []
        }

        if (!active) return

        const legacyByTitle = new Map(
          legacyCourseCatalogue.map(course => [course.title, course])
        )

        const orderedCourses = [...courseRows].sort((a, b) => {
          const aIndex = legacyCourseCatalogue.findIndex(item => item.title === a.title)
          const bIndex = legacyCourseCatalogue.findIndex(item => item.title === b.title)

          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1
          return a.title.localeCompare(b.title)
        })

        const nextCourses = orderedCourses.map(course => {
          const legacy = legacyByTitle.get(course.title)

          return {
            id: course.id,
            title: course.title,
            icon: legacy?.icon || '📘',
            desc: legacy?.desc || course.description || 'Explore this nursing course and its learning materials.',
            level: legacy?.level || course.programme || 'NURSING'
          }
        })

        const nextUnits = {}
        const unitTitleById = new Map()

        for (const course of orderedCourses) {
          nextUnits[course.title] = []
        }

        for (const unit of unitRows || []) {
          const parent = orderedCourses.find(course => course.id === unit.course_id)
          if (!parent) continue

          nextUnits[parent.title].push(unit.title)
          unitTitleById.set(unit.id, unit.title)
        }

        const nextLessons = {}

        for (const material of materialRows) {
          const unitTitle = unitTitleById.get(material.unit_id)
          if (!unitTitle || !material.content) continue

          try {
            const parsed = JSON.parse(material.content)

            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              nextLessons[unitTitle] = parsed
            }
          } catch {
            console.warn('A published lesson could not be parsed:', unitTitle)
          }
        }

        if (!active) return

        setCatalogueCourses(nextCourses)
        setCatalogueUnits(nextUnits)
        setCatalogueLessons(nextLessons)

        console.info(
          'PERIAK catalogue loaded:',
          nextCourses.length,
          'courses,',
          (unitRows || []).length,
          'units,',
          materialRows.length,
          'published materials'
        )
      } catch (error) {
        console.error(
          'Could not load the database catalogue. Keeping the original catalogue:',
          error.message
        )
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      loadCatalogue(data?.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        Promise.resolve().then(() => loadCatalogue(session))
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadForSession = async (session) => {
      if (!active) return
      setLearningCloudReady(false)

      const userId = session?.user?.id || null

      if (!userId) {
        setActiveLearningUser(null)
        setLearningData(readLearningData())
        setLearningCloudReady(true)
        return
      }

      const localKey = `periak_learning_progress_v1_${userId}`
      let localData = { completed: [], recent: [] }

      // Import the original shared progress into the first account only.
      const legacyData = readLearningData()

      try {
        const saved = JSON.parse(localStorage.getItem(localKey) || '{}')
        localData = {
          completed: Array.isArray(saved.completed) ? saved.completed : [],
          recent: Array.isArray(saved.recent) ? saved.recent : []
        }
      } catch {
        // Continue with an empty account-specific backup.
      }

      const { data, error } = await supabase
        .from('user_learning_progress')
        .select('progress')
        .eq('user_id', userId)
        .maybeSingle()

      if (!active) return

      if (error) {
        console.error('Could not load cloud learning progress:', error.message)

        const localOnly = mergeLearningData(
          mergeLearningData(localData, legacyData),
          { completed: [], recent: [] }
        )

        setActiveLearningUser(userId)
        setLearningData(localOnly)

        try {
          localStorage.setItem(localKey, JSON.stringify(localOnly))
        } catch (storageError) {
          console.warn('Local learning backup failed:', storageError)
        }

        // Keep cloud writes disabled until a successful cloud read.
        return
      }

      const cloudData = data?.progress || {
        completed: [],
        recent: []
      }

      const merged = mergeLearningData(
        mergeLearningData(localData, legacyData),
        cloudData
      )

      setActiveLearningUser(userId)
      setLearningData(merged)

      let accountBackupSaved = false
      try {
        localStorage.setItem(localKey, JSON.stringify(merged))
        accountBackupSaved = true
      } catch (storageError) {
        console.warn('Local learning backup failed:', storageError)
      }

      // Remove the old shared key only after the account backup succeeds.
      if (accountBackupSaved) {
        localStorage.removeItem('periak_learning_progress_v1')
      }

      setLearningCloudReady(true)
    }

    supabase.auth.getSession().then(({ data }) => {
      loadForSession(data?.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        Promise.resolve().then(() => loadForSession(session))
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!learningCloudReady) return

    const storageKey = activeLearningUser
      ? `periak_learning_progress_v1_${activeLearningUser}`
      : 'periak_learning_progress_v1'

    try {
      localStorage.setItem(storageKey, JSON.stringify(learningData))
    } catch (error) {
      console.warn('Learning progress could not be saved locally:', error)
    }

    if (!activeLearningUser) return

    const saveToCloud = async () => {
      const { error } = await supabase
        .from('user_learning_progress')
        .upsert({
          user_id: activeLearningUser,
          progress: learningData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('Learning progress cloud sync failed:', error.message)
      }
    }

    saveToCloud()
  }, [learningData, activeLearningUser, learningCloudReady])

  const saveLearningData = (next) => {
    setLearningData(next)

    const storageKey = activeLearningUser
      ? `periak_learning_progress_v1_${activeLearningUser}`
      : 'periak_learning_progress_v1'

    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch (error) {
      console.warn('Learning progress could not be saved locally:', error)
    }
  }

  const lessonKey = (courseTitle, unit) => `${courseTitle}::${unit}`

  const openUnit = (course, unit) => {
    const entry = { courseTitle: course.title, unit, studiedAt: Date.now() }
    const recent = [
      entry,
      ...learningData.recent.filter(item =>
        !(item.courseTitle === entry.courseTitle && item.unit === entry.unit)
      )
    ].slice(0, 6)

    saveLearningData({ ...learningData, recent })
    setSelectedCourse(course)
    setSelectedUnit(unit)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleLessonComplete = () => {
    const key = lessonKey(selectedCourse.title, selectedUnit)
    const completed = learningData.completed.includes(key)
      ? learningData.completed.filter(item => item !== key)
      : [...learningData.completed, key]
    saveLearningData({ ...learningData, completed })
  }

  const courseProgress = (course) => {
    const courseUnits = catalogueUnits[course.title] || []
    const done = courseUnits.filter(unit =>
      learningData.completed.includes(lessonKey(course.title, unit))
    ).length
    return {
      done,
      total: courseUnits.length,
      percent: courseUnits.length ? Math.round(done / courseUnits.length * 100) : 0
    }
  }

  const openCourse = (course) => {
    setSelectedCourse(course)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goHome = () => {
    setSelectedUnit(null)
    setSelectedCourse(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const returnFromPremiumModule = () => {
    setActivePremiumModule('')
    setShowExams(false)
    onPremiumModuleBack()
  }

  const handleAppBack = () => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false)
      return true
    }

    if (showExams) {
      returnFromPremiumModule()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return true
    }

    if (activePremiumModule && !showExams) {
      returnFromPremiumModule()
      return true
    }

    if (selectedUnit) {
      setSelectedUnit(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return true
    }

    if (selectedCourse) {
      goHome()
      return true
    }

    return false
  }

  useBackHandler(handleAppBack, mobileMenuOpen || showExams || Boolean(selectedCourse) || Boolean(activePremiumModule), 20)

  if (showExams) {
    return (
      <div className="app">
        <header className="navbar">
          <a className="brand" href="#" onClick={() => setShowExams(false)}>
            <span className="brand-icon">✚</span>
            <span>Study<span className="brand-green">Mate</span></span>
          </a>
          <button type="button" className="mobile-menu-toggle"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(open => !open)}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
          <nav className={mobileMenuOpen ? 'mobile-open' : ''}>
            <a href="#" onClick={() => { setMobileMenuOpen(false); setShowExams(false) }}>Home</a>
            <a href="#courses" onClick={() => { setMobileMenuOpen(false); setShowExams(false) }}>Courses</a>
          </nav>
        </header>
        <ExamCentre
          hasPremiumAccess={isPremium}
          premiumLoading={premiumLoading}
          isAdmin={isAdmin}
          onUpgrade={onOpenPremium}
          onHome={returnFromPremiumModule}
        />
      </div>
    )
  }

  if (activePremiumModule === 'pastpapers') {
    return (
      <div className="app premium-module-page">
        <PastPapersLibrary
          isAdmin={isAdmin}
          hasPremiumAccess={isPremium}
          premiumLoading={premiumLoading}
          onBack={returnFromPremiumModule}
          onUpgrade={() => onOpenPremium()}
        />
      </div>
    )
  }

  if (activePremiumModule === 'planner') {
    return (
      <div className="app premium-module-page">
        <header className="navbar">
          <a className="brand" href="#" onClick={returnFromPremiumModule}>
            <span className="brand-icon">✚</span>
            <span>Study<span className="brand-green">Mate</span></span>
          </a>
          <button type="button" className="nav-button" onClick={returnFromPremiumModule}>
            ← Back to Premium
          </button>
        </header>
        <StudyPlanner />
      </div>
    )
  }

  if (activePremiumModule && activePremiumModule !== 'exams') {
    return (
      <div className="app premium-module-page">
        <LearningSuite
          key={activePremiumModule}
          courses={catalogueCourses}
          learningData={learningData}
          catalogueUnits={catalogueUnits}
          catalogueLessons={catalogueLessons}
          onOpenCourse={(course) => {
            setActivePremiumModule('')
            setSelectedCourse(course)
          }}
          onOpenExams={() => {
            setActivePremiumModule('exams')
            setShowExams(true)
          }}
          hasPremiumAccess={isPremium}
          premiumLoading={premiumLoading}
          isAdmin={isAdmin}
          onOpenPremium={onOpenPremium}
          onOpenPremiumFeature={onOpenPremiumFeature}
          initialActive={activePremiumModule}
          standalone
          onBack={returnFromPremiumModule}
        />
      </div>
    )
  }

  if (selectedCourse && selectedUnit) {
    return (
      <div className="app">
        <header className="navbar">
          <a className="brand" href="#" onClick={goHome}>
            <span className="brand-icon">✚</span>
            <span>Study<span className="brand-green">Mate</span></span>
          </a>
          <button className="nav-button" onClick={() => setSelectedUnit(null)}>
            Course content ←
          </button>
        </header>

        <main className="lesson-page">
      {catalogueLessons[selectedUnit] && (
        <LessonReadingTools
          key={`${selectedCourse?.title}:${selectedUnit}`}
          unitKey={selectedUnit}
          topics={
            Array.isArray(catalogueLessons[selectedUnit].notes)
              ? catalogueLessons[selectedUnit].notes
              : []
          }
        />
      )}

          <button className="back-link" onClick={() => setSelectedUnit(null)}>
            ← Back to course content
          </button>

          <div className="lesson-heading">
            <div className="eyebrow">{selectedCourse.title}</div>
            <h1>{selectedUnit}</h1>
            <p>Learn systematically, understand the concepts and prepare for your nursing examinations.</p>
            <div className="learning-completion">
              <button
                type="button"
                className={learningData.completed.includes(lessonKey(selectedCourse.title, selectedUnit)) ? 'learning-complete-button is-complete' : 'learning-complete-button'}
                onClick={toggleLessonComplete}
              >
                {learningData.completed.includes(lessonKey(selectedCourse.title, selectedUnit))
                  ? '✓ Completed — mark as unfinished'
                  : '✓ Mark this lesson as complete'}
              </button>
              <span>{courseProgress(selectedCourse).done} of {courseProgress(selectedCourse).total} units completed</span>
              <button
                type="button"
                onClick={toggleLessonBookmark}
                disabled={bookmarkBusy}
                aria-pressed={isBookmarked}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  background: isBookmarked ? '#eff6ff' : '#ffffff',
                  color: '#1e40af',
                  cursor: bookmarkBusy ? 'wait' : 'pointer'
                }}
              >
                {bookmarkBusy ? 'Saving…' : isBookmarked ? '★ Bookmarked' : '☆ Save lesson'}
              </button>
            </div>
          </div>

          {catalogueLessons[selectedUnit] ? (
            <>
              <section className="lesson-panel">
                <h2 id="periak-lesson-objectives">Learning objectives</h2>
                <p>By the end of this unit, you should be able to:</p>
                <ul>
                  {(catalogueLessons[selectedUnit].objectives || []).map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </section>

              {premiumLoading && !isAdmin ? (
                <section className="lesson-panel">
                  <p>Checking your Premium access…</p>
                </section>
              ) : true ? (
                <>
              <section className="lesson-panel periak-notes-panel">
                <h2 id="periak-lesson-notes">Comprehensive study notes</h2>
                {(catalogueLessons[selectedUnit].notes || []).map((item, index) => (
                  <div className="note-topic" id={`periak-note-topic-${index}`} key={index}>
                    <h3>{item.heading || item.title}</h3>
                    {item.content && <StudyText value={item.content} />}
                    {item.body && <StudyText value={item.body} />}
                    {item.points && (
                      <ul>
                        {item.points.map((point, pointIndex) => (
                          <li key={pointIndex}>{point}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </section>

              <section className="lesson-panel">
                <h2 id="periak-lesson-clinical">Clinical application</h2>
                {(() => {
                  const lesson = catalogueLessons[selectedUnit]
                  const clinical = lesson.clinical ?? lesson.clinicalApplication

                  if (Array.isArray(clinical)) {
                    return clinical.map((item, index) => (
                      typeof item === 'string' ? (
                        <p key={index}>{item}</p>
                      ) : (
                        <div className="note-topic" key={index}>
                          {(item.heading || item.title) && (
                            <h3>{item.heading || item.title}</h3>
                          )}
                          {(item.content || item.body) && (
                            <p>{item.content || item.body}</p>
                          )}
                          {item.points && (
                            <ul>
                              {item.points.map((point, pointIndex) => (
                                <li key={pointIndex}>{point}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    ))
                  }

                  return clinical
                    ? <p>{clinical}</p>
                    : <p>Clinical application not yet available.</p>
                })()}
              </section>

              <section className="lesson-panel">
                <h2 id="periak-lesson-revision">High-yield examination points</h2>
                <ul>
                  {(catalogueLessons[selectedUnit].examPoints || []).map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </section>

              <section className="lesson-panel">
                <h2 id="periak-lesson-questions">Practice questions</h2>
                <p>Choose an answer, then open the explanation to check your understanding.</p>
                {(Array.isArray(catalogueLessons[selectedUnit].questions)
                  ? catalogueLessons[selectedUnit].questions
                  : Array.isArray(catalogueLessons[selectedUnit].mcqs)
                    ? catalogueLessons[selectedUnit].mcqs
                    : []).map((question, index) => {
                      const options = Array.isArray(question.options)
                        ? question.options
                        : Object.values(question.options || {})
                      const answerIndex = typeof question.answer === 'number'
                        ? question.answer
                        : /^[A-D]$/i.test(String(question.answer || '').trim())
                          ? String(question.answer).trim().toUpperCase().charCodeAt(0) - 65
                          : -1

                      return (
                        <div className="practice-question" key={index}>
                          <h3>{index + 1}. {question.question || question.q || 'Question'}</h3>
                          {options.map((option, optionIndex) => (
                            <p className="question-option" key={optionIndex}>
                              {String.fromCharCode(65 + optionIndex)}. {option}
                            </p>
                          ))}
                          <details>
                            <summary>Reveal answer and explanation</summary>
                            {answerIndex >= 0 && answerIndex < options.length && (
                              <p><strong>
                                Correct answer: {String.fromCharCode(65 + answerIndex)}. {options[answerIndex]}
                              </strong></p>
                            )}
                            {question.explanation && <p>{question.explanation}</p>}
                          </details>
                        </div>
                      )
                    })}
              </section>

              {Array.isArray(catalogueLessons[selectedUnit].clinicalCases) && catalogueLessons[selectedUnit].clinicalCases.length > 0 && (
                <section className="lesson-panel">
                  <h2>Clinical case studies</h2>
                  {catalogueLessons[selectedUnit].clinicalCases.map((item, index) => (
                    <div className="note-topic" key={index}>
                      <h3>{item.title || item.heading || `Case study ${index + 1}`}</h3>
                      {(item.content || item.body) && <p>{item.content || item.body}</p>}
                      {item.points && (
                        <ul>
                          {item.points.map((point, pointIndex) => <li key={pointIndex}>{point}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {Array.isArray(catalogueLessons[selectedUnit].writtenQuestions) && catalogueLessons[selectedUnit].writtenQuestions.length > 0 && (
                <section className="lesson-panel">
                  <h2>Written and short-answer questions</h2>
                  <p>Attempt each question before revealing the model answer and marking guide.</p>
                  {catalogueLessons[selectedUnit].writtenQuestions.map((item, index) => (
                    <div className="practice-question" key={index}>
                      <h3>{index + 1}. {item.question || 'Written question'}</h3>
                      <details>
                        <summary>Reveal model answer and marking guide</summary>
                        {item.modelAnswer && (
                          <>
                            <h4>Model answer</h4>
                            <p>{item.modelAnswer}</p>
                          </>
                        )}
                        {item.markingGuide && (
                          <>
                            <h4>Marking guide</h4>
                            <p>{item.markingGuide}</p>
                          </>
                        )}
                      </details>
                    </div>
                  ))}
                </section>
              )}
                </>
              ) : (
                <section className="lesson-panel premium-preview">
                  <p className="eyebrow">PERIAK PREMIUM</p>
                  <h2>Unlock the complete lesson</h2>
                  <p>
                    Get comprehensive nursing notes, clinical applications,
                    high-yield examination points, practice questions,
                    clinical cases and model answers.
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={onOpenPremium}
                  >
                    Explore Premium plans →
                  </button>
                </section>
              )}
            </>
          ) : (
            <>
              <section className="lesson-panel">
                <h2>Learning objectives</h2>
                <p>Learning objectives and detailed notes for this unit will be added as its lesson is developed.</p>
              </section>
              <section className="lesson-panel">
                <h2>Study notes</h2>
                <p className="coming-soon">This lesson is being prepared. Its full notes and revision materials are coming soon.</p>
              </section>
            </>
          )}

          <button className="primary-button lesson-back-button" onClick={() => setSelectedUnit(null)}>
            Return to course units →
          </button>
        </main>

        <footer>
          <a className="brand footer-brand" href="#" onClick={goHome}><span className="brand-icon">✚</span> Study<span className="brand-green">Mate</span></a>
          <p>Supporting nursing education in Kenya.</p>
          <span>© 2026 PERIAK. Learning made easier.</span>
        </footer>
      </div>
    )
  }

  if (selectedCourse) {
    return (
      <div className="app">
        <header className="navbar">
          <a className="brand" href="#" onClick={goHome}>
            <span className="brand-icon">✚</span>
            <span>Study<span className="brand-green">Mate</span></span>
          </a>
          <button className="nav-button" onClick={goHome}>All courses ←</button>
        </header>

        <main className="course-detail">
          <button className="back-link" onClick={goHome}>← Back to all courses</button>

          <div className="course-detail-hero">
            <div className="course-detail-icon">{selectedCourse.icon}</div>
            <div className="eyebrow">{selectedCourse.level}</div>
            <h1>{selectedCourse.title}</h1>
            <p>{selectedCourse.desc}</p>
            <span className="unit-count">{catalogueUnits[selectedCourse.title].length} learning units</span>
          </div>

          <CourseOutlineViewer courseId={selectedCourse.id} />

          <section className="unit-section">
            <div className="eyebrow">YOUR LEARNING PATH</div>
            <h2>Course content</h2>
            <p className="unit-intro">Work through these units systematically, building your knowledge step by step.</p>

            <div className="unit-list">
              {catalogueUnits[selectedCourse.title].map((unit, index) => (
                <button
                  className="unit-card unit-clickable"
                  key={unit}
                  onClick={() => openUnit(selectedCourse, unit)}
                >
                  <div className="unit-number">
                    {learningData.completed.includes(lessonKey(selectedCourse.title, unit))
                      ? '✓'
                      : String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="unit-info">
                    <h3>{unit}</h3>
                    <p>{catalogueLessons[unit] ? 'Study notes, clinical applications and practice questions available.' : 'Study notes and revision materials coming soon.'}</p>
                  </div>
                  <span className="unit-arrow">→</span>
                </button>
              ))}
            </div>
          </section>
        </main>

        <footer>
          <a className="brand footer-brand" href="#" onClick={goHome}><span className="brand-icon">✚</span> Study<span className="brand-green">Mate</span></a>
          <p>Supporting nursing education in Kenya.</p>
          <span>© 2026 PERIAK. Learning made easier.</span>
        </footer>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#">
          <span className="brand-icon">✚</span>
          <span>Study<span className="brand-green">Mate</span></span>
        </a>
        <button type="button" className="mobile-menu-toggle"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(open => !open)}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
        <nav className={mobileMenuOpen ? 'mobile-open' : ''}>
          <a href="#courses" onClick={() => setMobileMenuOpen(false)}>Courses</a>
          <a href="#examinations" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); setShowExams(true) }}>Examinations</a>
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>Study resources</a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
        </nav>
        <a className="nav-button" href="#courses">Start learning <span>→</span></a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow"><span></span> BUILT FOR NURSING STUDENTS IN KENYA</div>
            <h1>Your nursing journey.<br /><span>Made easier.</span></h1>
            <p className="hero-text">
              Learn with confidence. Access organised nursing notes,
              practise exam questions and strengthen your clinical knowledge
              — all in one place.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#courses">Explore courses <span>→</span></a>
              <a className="secondary-button" href="#features">Discover resources</a>
            </div>
            <div className="hero-note">
              <span>✓</span> For certificate, diploma and degree nursing students
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card main-card">
              <div className="visual-top"><span>YOUR LEARNING SPACE</span><span className="live-dot"></span></div>
              <div className="visual-symbol">🩺</div>
              <h3>Learn. Practise. Excel.</h3>
              <p>Build knowledge for the classroom and the clinical setting.</p>
              <div className="progress-label"><span>Your learning journey</span><strong>Start today</strong></div>
              <div className="progress-track"><div></div></div>
              <div className="visual-bottom"><span>📚 Study resources</span><span>✍️ Practice quizzes</span></div>
            </div>
            <div className="floating-card float-one">📖 <span><strong>Study notes</strong><small>Learn at your pace</small></span></div>
            <div className="floating-card float-two">🎯 <span><strong>Exam practice</strong><small>Test your knowledge</small></span></div>
            <div className="decor decor-one"></div>
            <div className="decor decor-two"></div>
          </div>
        </section>

        <section className="trust-strip">
          <div><strong>01</strong><span>Learn systematically</span></div>
          <div><strong>02</strong><span>Practise confidently</span></div>
          <div><strong>03</strong><span>Grow clinically</span></div>
        </section>

        <section className="student-dashboard" data-periak-tour="learning-dashboard">
          <HomeWelcome
            name={welcomeName}
            completedCount={learningData?.completed?.length ?? 0}
          />
          <div className="dashboard-heading">
            <div>
              <div className="eyebrow">YOUR PERSONAL STUDY SPACE</div>
              <h2>Your learning dashboard</h2>
              <p>Pick up where you left off and keep track of your progress.</p>
            </div>
            <button className="dashboard-exam-button" data-periak-tour="examinations" onClick={() => setShowExams(true)}>
              Open examination centre →
            </button>
          </div>



          <section className="dashboard-premium-ad" data-periak-tour="pastpapers">
            <div className="dashboard-premium-ad-copy">
              <span className="dashboard-premium-ad-label">PERIAK PREMIUM · FLAGSHIP</span>
              <h2>Past Papers &amp; Exam Practice</h2>
              <p>Search past papers and exam-style practice papers by course, unit,
                year, semester and exam type.</p>
              <div className="dashboard-premium-ad-features">
                <span>🔎 Searchable library</span>
                <span>📚 Course &amp; unit filters</span>
                <span>📄 Secure PDF access</span>
              </div>
              <button type="button" onClick={() => onOpenPremiumFeature('pastpapers')}>
                {isPremium || isAdmin ? 'Open Past Papers →' : 'Explore Past Papers →'}
              </button>
            </div>
            <div className="dashboard-premium-tools">
              {[
                { id: 'dashboard', icon: '📊', title: 'Learning Dashboard', short: 'Dashboard', tag: 'Track your progress' },
                { id: 'exams', icon: '📝', title: 'Smart Exam Centre', short: 'Exams', tag: 'CATs and mock exams' },
                { id: 'clinical', icon: '🩺', title: 'Clinical Skills Lab', short: 'Clinical Lab', tag: 'Interactive scenarios' },
                { id: 'simulator', icon: '🏥', title: 'Virtual Patient Simulator', short: 'Patient Sim', tag: 'Clinical simulations' },
                { id: 'tutor', icon: '🤖', title: 'Study Tutor', short: 'Tutor', tag: 'Search lesson materials' },
                { id: 'hub', icon: '📚', title: 'Nursing Knowledge Hub', short: 'Knowledge Hub', tag: 'Browse subjects' },
                { id: 'planner', icon: '📅', title: 'Study Planner', short: 'Planner', tag: 'Plan CATs and exams' }
              ].map(tool => (
                <button type="button" key={tool.id} className="dashboard-premium-tool" data-periak-tour={tool.id}
                  aria-label={tool.title} onClick={() => onOpenPremiumFeature(tool.id)}>
                  <span className="tool-icon">{tool.icon}</span>
                  <strong>
                    <span className="tool-full">{tool.title}</span>
                    <span className="tool-short">{tool.short}</span>
                  </strong>
                  <small>{tool.tag}</small>
                </button>
              ))}
            </div>
          </section>

          <div className="dashboard-stats">
            <article className="dashboard-stat">
              <span>📚</span>
              <strong>{learningData.completed.length}</strong>
              <small>Lessons completed</small>
            </article>
            <article className="dashboard-stat">
              <span>📖</span>
              <strong>{learningData.recent.length}</strong>
              <small>Recently studied</small>
            </article>
            <article className="dashboard-stat">
              <span>🎓</span>
              <strong>{catalogueCourses.filter(course => courseProgress(course).percent === 100).length}</strong>
              <small>Subjects completed</small>
            </article>
          </div>

          <div className="dashboard-panels">
            <section className="dashboard-panel continue-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-kicker">PICK UP WHERE YOU LEFT OFF</span>
                  <h3>Continue learning</h3>
                </div>
                <span>↗</span>
              </div>
              {learningData.recent.length ? (
                (() => {
                  const latest = learningData.recent[0]
                  const course = catalogueCourses.find(item => item.title === latest.courseTitle)
                  return course ? (
                    <div className="continue-content">
                      <span className="continue-icon">{course.icon}</span>
                      <div>
                        <strong>{latest.unit}</strong>
                        <small>{latest.courseTitle}</small>
                      </div>
                      <button onClick={() => openUnit(course, latest.unit)}>Resume →</button>
                    </div>
                  ) : <p>Explore a subject to begin your learning journey.</p>
                })()
              ) : (
                <div className="dashboard-empty">
                  <span>🚀</span>
                  <p>Your next learning session starts here. Open a subject and select a unit.</p>
                  <a href="#courses">Explore courses →</a>
                </div>
              )}
            </section>

            <section className="dashboard-panel recent-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <span className="dashboard-kicker">YOUR STUDY ACTIVITY</span>
                  <h3>Recently studied</h3>
                </div>
                <span>◷</span>
              </div>
              {learningData.recent.length ? (
                <div className="recent-lesson-list">
                  {learningData.recent.slice(0, 4).map((item, index) => {
                    const course = catalogueCourses.find(entry => entry.title === item.courseTitle)
                    return course ? (
                      <button className="recent-lesson" key={`${item.courseTitle}-${item.unit}-${index}`}
                        onClick={() => openUnit(course, item.unit)}>
                        <span>{course.icon}</span>
                        <span><strong>{item.unit}</strong><small>{item.courseTitle}</small></span>
                        <b>→</b>
                      </button>
                    ) : null
                  })}
                </div>
              ) : (
                <p className="dashboard-muted">Lessons you open will appear here for quick access.</p>
              )}
            </section>
          </div>

          <section className="dashboard-progress">
            <div className="dashboard-panel-heading">
              <div>
                <span className="dashboard-kicker">MEASURE YOUR GROWTH</span>
                <h3>Subject progress</h3>
              </div>
              <a href="#courses">View all subjects ↓</a>
            </div>
            <div className="subject-progress-grid">
              {catalogueCourses.map(course => {
                const progress = courseProgress(course)
                return (
                  <div className="subject-progress" key={course.title}>
                    <div className="subject-progress-title">
                      <span>{course.icon} {course.title}</span>
                      <strong>{progress.percent}%</strong>
                    </div>
                    <div className="subject-progress-track">
                      <div style={{ width: `${progress.percent}%` }} />
                    </div>
                    <small>{progress.done} of {progress.total} units completed</small>
                  </div>
                )
              })}
            </div>
          </section>
        </section>

        <section className="courses-section" id="courses" data-periak-tour="courses">
          <div className="section-heading">
            <div>
              <div className="eyebrow">YOUR LEARNING STARTS HERE</div>
              <h2>Explore nursing subjects</h2>
              <p>Build a strong foundation across essential areas of nursing.</p>
            </div>
            <a className="text-link" href="#features">Explore resources →</a>
          </div>
          <div className="periak-course-toolbar">
            <input
              type="search"
              aria-label="Search nursing courses"
              placeholder="Search nursing courses..."
              value={courseSearch}
              onChange={event => setCourseSearch(event.target.value)}
            />
            <span>
              {matchingCatalogueCourses.length} subjects
            </span>
          </div>

          <div className="course-grid">
            {visibleCatalogueCourses.map((course) => (
              <article className="course-card" key={course.title}>
                <div className="course-icon">{course.icon}</div>
                <div className="course-level">{course.level}</div>
                <h3>{course.title}</h3>
                <p>{course.desc}</p>
                <div className="course-card-progress">
                  <div><span>Course progress</span><strong>{courseProgress(course).percent}%</strong></div>
                  <div className="subject-progress-track">
                    <div style={{ width: `${courseProgress(course).percent}%` }} />
                  </div>
                  <small>{courseProgress(course).done}/{courseProgress(course).total} units completed</small>
                </div>
                <button className="course-open-button" onClick={() => openCourse(course)}>
                  Explore subject <span>→</span>
                </button>
              </article>
            ))}
          </div>

          {matchingCatalogueCourses.length === 0 && (
            <p className="periak-course-empty">
              No courses match your search.
            </p>
          )}

          {!courseQuery && matchingCatalogueCourses.length > 8 && (
            <button
              type="button"
              className="periak-course-more"
              onClick={() => setShowAllCourses(value => !value)}
            >
              {showAllCourses
                ? 'Show fewer subjects ↑'
                : `Show all ${matchingCatalogueCourses.length} subjects ↓`}
            </button>
          )}
        </section>

        <section className="features-section" id="features">
          <div className="eyebrow">MORE THAN JUST NOTES</div>
          <h2>Everything you need to study smarter.</h2>
          <div className="feature-grid">
            <div className="feature"><span>📚</span><h3>Structured study notes</h3><p>Clear, organised learning materials for your nursing subjects.</p></div>
            <div className="feature"><span>✍️</span><h3>Exam practice</h3><p>Multiple-choice questions, explanations and mock examinations.</p></div>
            <div className="feature"><span>🩹</span><h3>Clinical skills</h3><p>Strengthen your understanding of practical nursing procedures.</p></div>
          </div>
        </section>

        <section className="cta-section" id="about">
          <div>
            <div className="eyebrow">YOUR FUTURE IN NURSING STARTS HERE</div>
            <h2>Learn with purpose.<br />Care with confidence.</h2>
            <p>PERIAK is being built to support the next generation of nursing professionals in Kenya.</p>
          </div>
          <a href="#courses" className="primary-button">Start exploring →</a>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#"><span className="brand-icon">✚</span> Study<span className="brand-green">Mate</span></a>
        <p>Supporting nursing education in Kenya.</p>
        <span>© 2026 PERIAK. Learning made easier.</span>
      </footer>
    </div>
  )
}

function AppLoading() {
  return <div className="app-loading" role="status">Loading...</div>
}

function App(props) {
  return (
    <Suspense fallback={<AppLoading />}>
      <AppInner {...props} />
    </Suspense>
  )
}

export default App
