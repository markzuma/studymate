// PERIAK DASHBOARD CLEANUP V10
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import useContentRefresh from './hooks/useContentRefresh.js'
import { useBackHandler } from './context/NavigationProvider'
import { supabase } from './lib/supabase'
import {
  readPublishedRows,
  parsePublishedLessons
} from './lib/learningCatalogue'
// PERIAK DASHBOARD SIMPLIFICATION V14
import './App.css'
import StudentDashboard from './components/StudentDashboard'
import { saveOfflineLesson } from './lib/offlineLearning'

const MyLearningLibrary = lazy(() =>
  import('./components/MyLearningLibrary')
)
import ReferralShortcut from './components/ReferralShortcut'
import WorkspaceIcon from './components/WorkspaceIcon'
import './components/AcademicWorkspace.css'
import './components/LearningWorkspace.css'
import './components/SharedLayoutSafeguards.css'

// PERIAK ON-DEMAND LOADING V1
const LessonReadingTools = lazy(
  () => import('./components/LessonReadingTools')
)

// Heavy screens load on demand, then are warmed in the background (see AppInner).
const loadExamCentre = () => import('./components/SmartExamCentre')
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
function HomeWelcome({ name }) {
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


// PERIAK LEARNING SYNC V2
// A newer explicit completion action takes precedence over older data.
function completionEvents(data) {
  const events = {}

  for (const key of Array.isArray(data?.completed) ? data.completed : []) {
    if (typeof key === 'string') {
      events[key] = { done: true, at: 0 }
    }
  }

  const changes = data?.completionChanges

  if (changes && typeof changes === 'object' && !Array.isArray(changes)) {
    for (const [key, change] of Object.entries(changes)) {
      if (!key || typeof change?.done !== 'boolean') continue

      const time = Number(change.at)

      events[key] = {
        done: change.done,
        at: Number.isFinite(time) && time >= 0 ? time : 0
      }
    }
  }

  return events
}

function mergeLearningData(localData, cloudData) {
  const events = completionEvents(cloudData)

  for (const [key, change] of Object.entries(completionEvents(localData))) {
    const previous = events[key]

    if (
      !previous ||
      change.at > previous.at ||
      (change.at === previous.at && !change.done)
    ) {
      events[key] = change
    }
  }

  const completed = Object.entries(events)
    .filter(([, change]) => change.done)
    .map(([key]) => key)

  const recentMap = new Map()

  for (const item of [
    ...(localData?.recent || []),
    ...(cloudData?.recent || [])
  ]) {
    if (!item?.courseTitle || !item?.unit) continue

    const key = `${item.courseTitle}::${item.unit}`
    const previous = recentMap.get(key)

    if (!previous || (item.studiedAt || 0) > (previous.studiedAt || 0)) {
      recentMap.set(key, item)
    }
  }

  return {
    completed,
    completionChanges: events,
    recent: [...recentMap.values()]
      .sort((a, b) => (b.studiedAt || 0) - (a.studiedAt || 0))
      .slice(0, 6)
  }
}


// PERIAK COMPACT MOBILE NAV V1
function CompactNavIcon({ name }) {
  const icons = {
    home: 'M3 10.5 12 3l9 7.5v10h-6v-6H9v6H3z',
    courses: 'M4 5c3-1 6-1 8 1v14c-2-2-5-2-8-1z M20 5c-3-1-6-1-8 1v14c2-2 5-2 8-1z',
    papers: 'M7 3h9l4 4v14H7z M16 3v5h4 M10 12h7 M10 16h7',
    exams: 'M9 2h6v4H9z M8 4H5v18h14V4h-3 M8 12l2 2 4-4 M8 18h8',
    premium: 'M2 8l5 4 5-7 5 7 5-4-2 12H4z'
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d={icons[name]} />
    </svg>
  )
}


// PERIAK MOBILE EXPERIENCE V7 CORRECTED
function readPeriakView() {
  try {
    return JSON.parse(
      window.sessionStorage.getItem('periak_view_v7') || '{}'
    )
  } catch {
    return {}
  }
}
const savedPeriakView = readPeriakView()

function AppInner({ layout = 'classic', isPremium = false, premiumLoading = false, isAdmin = false, welcomeName = '', onOpenPremium = () => {}, onOpenPremiumFeature = () => {}, premiumLaunch = null, onPremiumLaunchHandled = () => {}, onPremiumModuleBack = () => {} }) {
  const [learningData, setLearningData] = useState(readLearningData)
  const [studyStreak, setStudyStreak] = useState(null)

  const [activeLearningUser, setActiveLearningUser] = useState(null)

  useEffect(() => {
    let active = true
    setStudyStreak(null)

    if (!activeLearningUser) return

    async function refreshStreak() {
      try {
        const { data, error } = await supabase.rpc(
          'my_engagement_summary'
        )

        if (active && !error) {
          setStudyStreak(
            Number(data?.study_streak || 0)
          )
        }
      } catch {
        // Existing dashboard remains usable.
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshStreak()
      }
    }

    void refreshStreak()

    window.addEventListener(
      'periak:study-refresh', refreshStreak
    )
    window.addEventListener('online', refreshStreak)
    document.addEventListener(
      'visibilitychange', onVisible
    )

    return () => {
      active = false
      window.removeEventListener(
        'periak:study-refresh', refreshStreak
      )
      window.removeEventListener(
        'online', refreshStreak
      )
      document.removeEventListener(
        'visibilitychange', onVisible
      )
    }
  }, [activeLearningUser])

  const [learningCloudReady, setLearningCloudReady] = useState(false)
  const progressSessionRef = useRef(null)
  const progressRetryRef = useRef(false)
  const progressWriteQueueRef = useRef(Promise.resolve())
  const [catalogueOpen, setCatalogueOpen] = useState(false)

  useEffect(() => {
    if (layout !== 'modern') {
      setCatalogueOpen(false)
    }
  }, [layout])

  const [showExams, setShowExams] = useState(savedPeriakView.screen === 'exams')
  const [activePremiumModule, setActivePremiumModule] = useState(savedPeriakView.screen === 'module' ? savedPeriakView.module || '' : '')

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
    const canWarm = () => {
      const connection = navigator.connection

      return navigator.onLine &&
        document.visibilityState === 'visible' &&
        !connection?.saveData &&
        connection?.effectiveType === '4g' &&
        connection?.type !== 'cellular' &&
        (navigator.deviceMemory ?? 4) >= 4
    }

    if (!canWarm()) return undefined

    const warm = () => {
      if (!canWarm()) return

      loadPastPapersLibrary().catch(() => {})
      loadLearningSuite().catch(() => {})
    }
    const id = 'requestIdleCallback' in window
      ? window.requestIdleCallback(warm, { timeout: 5000 })
      : window.setTimeout(warm, 3000)
    return () => {
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(id)
      else window.clearTimeout(id)
    }
  }, [])
  const [selectedCourse, setSelectedCourse] = useState(() => {
    const title = savedPeriakView.course
    return title ? (
      legacyCourseCatalogue.find(c => c.title === title) ||
      { title, icon: '📚', desc: '', level: '' }
    ) : null
  })
  const [selectedUnit, setSelectedUnit] = useState(savedPeriakView.course ? savedPeriakView.unit || null : null)
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
  // PERIAK CONTENT AUTO-SYNC V2
  const contentRefreshVersion = useContentRefresh()
  const [catalogueLessons, setCatalogueLessons] = useState({})
  const [lessonDirectory, setLessonDirectory] = useState({})
  const [catalogueReady, setCatalogueReady] = useState(false)
  const [catalogueError, setCatalogueError] = useState('')
  const [lessonRequestState, setLessonRequestState] = useState({})
  const [lessonRetry, setLessonRetry] = useState(0)
  const [tutorContentState, setTutorContentState] = useState('idle')
  const catalogueGeneration = useRef(0)
  const lessonCacheRef = useRef({})
  const catalogueAbortRef = useRef(null)

  // PERIAK SAFE AUTO UPDATE V1
  useEffect(() => {
    window.__periakDashboardSafe = (
      !showExams &&
      !activePremiumModule &&
      !selectedCourse &&
      !selectedUnit &&
      !courseSearch.trim()
    )

    window.dispatchEvent(new Event('periak:update-safety'))

    return () => {
      window.__periakDashboardSafe = false
      window.dispatchEvent(new Event('periak:update-safety'))
    }
  }, [
    showExams,
    activePremiumModule,
    selectedCourse,
    selectedUnit,
    courseSearch
  ])
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

    let catalogueOwner = null
    let catalogueRequest = 0

    const resetContent = () => {
      catalogueGeneration.current += 1
      catalogueAbortRef.current?.abort()
      catalogueAbortRef.current = null
      lessonCacheRef.current = {}
      setCatalogueLessons({})
      setLessonDirectory({})
      setLessonRequestState({})
      setTutorContentState('idle')
      setCatalogueReady(false)
      setCatalogueError('')
    }

    resetContent()

    const loadCatalogue = async (session) => {
      const owner = session?.user?.id

      if (!active) return

      if (!owner) {
        catalogueOwner = null
        catalogueRequest += 1
        resetContent()
        return
      }

      if (catalogueOwner === owner) return

      catalogueOwner = owner
      const requestId = ++catalogueRequest

      resetContent()

      const controller = new AbortController()
      catalogueAbortRef.current = controller

      try {
        const [courseRows, allUnits] = await Promise.all([
          readPublishedRows(
            'courses',
            'id,title,description,programme,year_of_study,semester,status',
            { signal: controller.signal }
          ),
          readPublishedRows(
            'course_units',
            'id,course_id,title,sort_order,status',
            { signal: controller.signal }
          )
        ])

        const courseIds = new Set(
          courseRows.map(course => course.id)
        )

        const unitRows = allUnits.filter(unit =>
          courseIds.has(unit.course_id)
        )

        // Metadata only. No lesson content in this request.
        const materialRows = await readPublishedRows(
          'learning_materials',
          'id,unit_id,sort_order,status',
          { signal: controller.signal }
        )

        if (
          !active ||
          requestId !== catalogueRequest
        ) return

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
            description: course.description || '',
            programme: course.programme,
            year_of_study: course.year_of_study,
            semester: course.semester,
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
          unitTitleById.set(
            unit.id,
            JSON.stringify([parent.id, unit.title])
          )
        }

        const nextDirectory = {}

        for (const material of materialRows) {
          const key = unitTitleById.get(material.unit_id)

          if (key) {
            nextDirectory[key] = material.unit_id
          }
        }

        if (
          !active ||
          requestId !== catalogueRequest
        ) return

        setCatalogueCourses(nextCourses)
        setCatalogueUnits(nextUnits)
        setLessonDirectory(nextDirectory)
        setCatalogueReady(true)
        setCatalogueError('')

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
        if (
          !active ||
          requestId !== catalogueRequest ||
          controller.signal.aborted
        ) return

        catalogueOwner = null
        setCatalogueError(
          'Unable to load the course catalogue. Check your connection and try again.'
        )

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
      catalogueGeneration.current += 1
      catalogueAbortRef.current?.abort()
      subscription.unsubscribe()
    }
  }, [contentRefreshVersion])

  useEffect(() => {
    let active = true
    let generation = 0

    const empty = { completed: [], recent: [] }

    const readAccount = userId => {
      try {
        const saved = JSON.parse(
          localStorage.getItem(
            `periak_learning_progress_v1_${userId}`
          ) || '{}'
        )

        return {
          completed: Array.isArray(saved.completed) ? saved.completed : [],
          recent: Array.isArray(saved.recent) ? saved.recent : [],
          completionChanges:
            saved.completionChanges &&
            typeof saved.completionChanges === 'object' &&
            !Array.isArray(saved.completionChanges)
              ? saved.completionChanges
              : {}
        }
      } catch {
        return empty
      }
    }

    const loadForSession = async session => {
      if (!active) return

      const version = ++generation
      const userId = session?.user?.id || null

      progressSessionRef.current = userId
      setLearningCloudReady(false)

      if (!userId) {
        setActiveLearningUser(null)
        setLearningData(readLearningData())
        return
      }

      const localKey = `periak_learning_progress_v1_${userId}`

      setActiveLearningUser(userId)
      setLearningData(readAccount(userId))

      let data
      let error

      try {
        const response = await supabase
          .from('user_learning_progress')
          .select('progress')
          .eq('user_id', userId)
          .maybeSingle()

        data = response.data
        error = response.error
      } catch (requestError) {
        error = requestError
      }

      if (!active || version !== generation) return

      // Read the local backup again: it might have changed
      // while the cloud request was in progress.
      const latestLocal = readAccount(userId)

      if (error) {
        progressRetryRef.current = true
        setLearningData(mergeLearningData(latestLocal, empty))
        console.warn('Cloud progress unavailable:', error.message)
        return
      }

      // Legacy shared data is imported only after a successful
      // cloud read, reducing accidental cross-account migration.
      const merged = mergeLearningData(
        mergeLearningData(latestLocal, readLearningData()),
        data?.progress || empty
      )

      setLearningData(merged)

      let backupSaved = false

      try {
        localStorage.setItem(localKey, JSON.stringify(merged))
        backupSaved = true
      } catch (storageError) {
        console.warn('Local progress backup failed:', storageError)
      }

      if (backupSaved) {
        try {
          localStorage.removeItem('periak_learning_progress_v1')
        } catch (storageError) {
          console.warn('Legacy progress cleanup failed:', storageError)
        }
      }

      setLearningCloudReady(true)
    }

    const retrySync = () => {
      if (!active || !progressRetryRef.current) return

      supabase.auth.getSession()
        .then(({ data }) => {
          if (active) void loadForSession(data?.session)
        })
        .catch(error => {
          console.warn('Progress retry unavailable:', error)
        })
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        retrySync()
      }
    }

    supabase.auth.getSession()
      .then(({ data }) => {
        if (active) void loadForSession(data?.session)
      })
      .catch(error => {
        progressRetryRef.current = true
        console.warn('Could not restore progress session:', error)
      })

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        Promise.resolve().then(() => {
          if (active) void loadForSession(session)
        })
      })

    window.addEventListener('online', retrySync)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      active = false
      generation++
      subscription.unsubscribe()
      window.removeEventListener('online', retrySync)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    if (!learningCloudReady) return

    const userId = activeLearningUser
    const snapshot = learningData

    const storageKey = userId
      ? `periak_learning_progress_v1_${userId}`
      : 'periak_learning_progress_v1'

    try {
      localStorage.setItem(storageKey, JSON.stringify(snapshot))
    } catch (error) {
      console.warn('Learning progress could not be saved locally:', error)
    }

    if (!userId) return

    // Serialize this browser's cloud writes to prevent an older
    // request from finishing after its newer replacement.
    progressWriteQueueRef.current = progressWriteQueueRef.current
      .catch(() => {})
      .then(async () => {
        if (progressSessionRef.current !== userId) return

        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData?.session?.user?.id !== userId) return

        const { data: remote, error: readError } = await supabase
          .from('user_learning_progress')
          .select('progress')
          .eq('user_id', userId)
          .maybeSingle()

        if (readError) throw readError
        if (progressSessionRef.current !== userId) return

        let latestLocal = snapshot

        try {
          const saved = JSON.parse(
            localStorage.getItem(storageKey) || 'null'
          )
          if (saved) {
            latestLocal = mergeLearningData(snapshot, saved)
          }
        } catch {
          // Use the snapshot when local storage is inaccessible.
        }

        const merged = mergeLearningData(
          latestLocal,
          remote?.progress || {}
        )

        const { error } = await supabase
          .from('user_learning_progress')
          .upsert({
            user_id: userId,
            progress: merged,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })

        if (error) throw error

        if (progressSessionRef.current !== userId) return

        progressRetryRef.current = false

        setLearningData(current => {
          if (progressSessionRef.current !== userId) return current

          const next = mergeLearningData(current, merged)

          if (JSON.stringify(next) === JSON.stringify(current)) {
            return current
          }

          try {
            localStorage.setItem(storageKey, JSON.stringify(next))
          } catch (storageError) {
            console.warn('Local progress backup failed:', storageError)
          }

          return next
        })
      })
      .catch(error => {
        progressRetryRef.current = true
        console.error('Learning progress cloud sync failed:', error.message)
      })
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


  // Save the current screen in this browser tab.
  useEffect(() => {
    try {
      const screen = showExams ? 'exams'
        : activePremiumModule ? 'module'
        : selectedCourse ? 'course' : 'home'

      window.sessionStorage.setItem(
        'periak_view_v7',
        JSON.stringify({
          screen,
          module: activePremiumModule,
          course: selectedCourse?.title || '',
          unit: selectedUnit || ''
        })
      )
    } catch {}
  }, [showExams, activePremiumModule, selectedCourse, selectedUnit])

  const requestedLessonKey =
    selectedCourse?.id && selectedUnit
      ? JSON.stringify([selectedCourse.id, selectedUnit])
      : null

  const requestedUnitId = requestedLessonKey
    ? lessonDirectory[requestedLessonKey]
    : null

  useEffect(() => {
    if (
      !catalogueReady ||
      !requestedLessonKey ||
      !requestedUnitId ||
      showExams ||
      activePremiumModule
    ) return undefined

    if (lessonCacheRef.current[requestedLessonKey]) {
      return undefined
    }

    let active = true
    const generation = catalogueGeneration.current
    const controller = new AbortController()

    setLessonRequestState(prev => ({
      ...prev,
      [requestedLessonKey]: 'loading'
    }))

    async function loadLesson() {
      try {
        const rows = await readPublishedRows(
          'learning_materials',
          'id,unit_id,content,sort_order,status',
          {
            unitId: requestedUnitId,
            signal: controller.signal
          }
        )

        const parsed = parsePublishedLessons(
          rows,
          new Map([[requestedUnitId, requestedLessonKey]])
        )

        if (
          !active ||
          generation !== catalogueGeneration.current
        ) return

        lessonCacheRef.current = {
          ...lessonCacheRef.current,
          ...parsed
        }

        setCatalogueLessons(prev => ({
          ...prev,
          ...parsed
        }))

        setLessonRequestState(prev => ({
          ...prev,
          [requestedLessonKey]:
            parsed[requestedLessonKey] ? 'ready' : 'empty'
        }))
      } catch {
        if (
          !active ||
          generation !== catalogueGeneration.current
        ) return

        setLessonRequestState(prev => ({
          ...prev,
          [requestedLessonKey]: 'error'
        }))
      }
    }

    void loadLesson()

    return () => {
      active = false
      controller.abort()
    }
  }, [
    catalogueReady,
    requestedLessonKey,
    requestedUnitId,
    showExams,
    activePremiumModule,
    contentRefreshVersion,
    lessonRetry
  ])

  // The grounded Tutor needs all published lesson text.
  // Load it only when the Tutor is actually opened.

  useEffect(() => {
    if (
      !['tutor', 'dashboard', 'hub'].includes(activePremiumModule) ||
      !catalogueReady
    ) return undefined

    const unitKeys = new Map(
      Object.entries(lessonDirectory).map(
        ([key, unitId]) => [unitId, key]
      )
    )

    if (
      Object.keys(lessonDirectory).every(
        key => lessonCacheRef.current[key]
      )
    ) {
      setTutorContentState('ready')
      return undefined
    }

    let active = true
    const generation = catalogueGeneration.current
    const controller = new AbortController()

    setTutorContentState('loading')

    async function loadTutorContent() {
      try {
        const rows = await readPublishedRows(
          'learning_materials',
          'id,unit_id,content,sort_order,status',
          { signal: controller.signal }
        )

        const parsed = parsePublishedLessons(
          rows,
          unitKeys
        )

        if (
          !active ||
          generation !== catalogueGeneration.current
        ) return

        lessonCacheRef.current = {
          ...lessonCacheRef.current,
          ...parsed
        }

        setCatalogueLessons(prev => ({
          ...prev,
          ...parsed
        }))

        setTutorContentState('ready')
      } catch {
        if (
          active &&
          generation === catalogueGeneration.current
        ) {
          setTutorContentState('error')
        }
      }
    }

    void loadTutorContent()

    return () => {
      active = false
      controller.abort()
    }
  }, [
    activePremiumModule,
    catalogueReady,
    lessonDirectory,
    contentRefreshVersion,
    lessonRetry
  ])

  // Resolve a saved course against the published catalogue.
  useEffect(() => {
    if (!selectedCourse?.title) return
    const match = catalogueCourses.find(
      c => c.title === selectedCourse.title
    )
    if (match && match.id !== selectedCourse.id) {
      setSelectedCourse(match)
    }
  }, [catalogueCourses, selectedCourse])

  const lessonKey = (courseTitle, unit) => `${courseTitle}::${unit}`

  const openUnit = (course, unit) => {
    if (activeLearningUser && navigator.onLine) {
      supabase.rpc('record_study_activity', {
        p_course_title: course.title,
        p_unit_title: unit
      }).then(({ error }) => {
        if (!error) {
          window.dispatchEvent(new Event('periak:study-refresh'))
        }
      }).catch(() => {})
    }

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
    const wasCompleted = learningData.completed.includes(key)
    const completed = wasCompleted
      ? learningData.completed.filter(item => item !== key)
      : [...learningData.completed, key]

    const completionChanges = {
      ...(learningData.completionChanges || {}),
      [key]: {
        done: !wasCompleted,
        at: Date.now()
      }
    }

    saveLearningData({
      ...learningData,
      completed,
      completionChanges
    })
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
    setCatalogueOpen(false)
    setSelectedUnit(null)
    setSelectedCourse(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const returnFromPremiumModule = () => {
    setActivePremiumModule('')
    setShowExams(false)
    onPremiumModuleBack()
  }


  // Shared navigation used from all appropriate student pages.
  useEffect(() => {
    const navigate = id => {
      if (id === 'home' || id === 'courses') {
        setCatalogueOpen(
          layout === 'modern' && id === 'courses'
        )
        setShowExams(false)
        setActivePremiumModule('')
        setSelectedUnit(null)
        setSelectedCourse(null)

        if (layout !== 'modern' && id === 'courses') {
          window.setTimeout(() => {
            document.getElementById('courses')
              ?.scrollIntoView({ behavior: 'smooth' })
          }, 150)
        } else {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        }
      }

      if (id === 'papers') {
        setShowExams(false)
        setSelectedUnit(null)
        setSelectedCourse(null)
        setActivePremiumModule('')
        onOpenPremiumFeature('pastpapers')
      }

      if (id === 'exams') {
        setSelectedUnit(null)
        setActivePremiumModule('')
        setShowExams(true)
      }
    }

    const listener = event => navigate(event.detail)

    window.addEventListener(
      'periak:mobile-navigate', listener
    )

    try {
      const pending = window.sessionStorage.getItem(
        'periak_mobile_nav_intent'
      )

      if (pending) {
        window.sessionStorage.removeItem(
          'periak_mobile_nav_intent'
        )
        navigate(pending)
      }
    } catch {}

    return () => window.removeEventListener(
      'periak:mobile-navigate', listener
    )
  }, [onOpenPremiumFeature, layout])

  const handleAppBack = () => {
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
      setSelectedCourse(null)
      setSelectedUnit(null)
      setCatalogueOpen(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return true
    }

    if (catalogueOpen) {
      setCatalogueOpen(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return true
    }

    return false
  }

  useBackHandler(
    handleAppBack,
    showExams ||
      Boolean(selectedCourse) ||
      Boolean(activePremiumModule) ||
      catalogueOpen,
    20
  )

  useEffect(() => {
    const workspaceScreen =
      showExams
        ? 'exams'
        : activePremiumModule === 'pastpapers'
          ? 'papers'
          : activePremiumModule
            ? activePremiumModule
            : selectedCourse || catalogueOpen
              ? 'courses'
              : 'home'

    window.dispatchEvent(
      new CustomEvent('periak:workspace-screen', {
        detail: workspaceScreen
      })
    )
  }, [
    showExams,
    activePremiumModule,
    selectedCourse,
    catalogueOpen
  ])

  if (showExams) {
    return (
      <div className="app periak-active-exams">
        <header className="navbar">
          <a className="brand" href="#" onClick={() => setShowExams(false)}>
            <span className="brand-icon">✚</span>
            <span>PERIAK</span>
          </a>
          <nav>
            <a href="#" onClick={() => { setShowExams(false) }}>Home</a>
            <a href="#courses" onClick={() => { setShowExams(false) }}>Courses</a>
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
            <span>PERIAK</span>
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
          tutorContentState={
            catalogueError ? 'error' :
            !catalogueReady ? 'loading' :
            tutorContentState
          }
          onRetryTutor={() => {
            if (catalogueError) {
              window.dispatchEvent(
                new Event('periak:content-refresh')
              )
            } else {
              setLessonRetry(value => value + 1)
            }
          }}
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
            <span>PERIAK</span>
          </a>
          <button className="nav-button" onClick={() => setSelectedUnit(null)}>
            Course content ←
          </button>
        </header>

        <main className="lesson-page">
      {catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])] && (
        <Suspense fallback={<div role="status">Preparing reading tools...</div>}>
          <LessonReadingTools
          key={`${selectedCourse?.title}:${selectedUnit}`}
          unitKey={selectedUnit}
          topics={
            Array.isArray(catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])].notes)
              ? catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])].notes
              : []
          }
          />
        </Suspense>
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
                className="pw-bookmark-button"
              >
                {bookmarkBusy ? 'Saving…' : isBookmarked ? '★ Bookmarked' : '☆ Save lesson'}
              </button>
              {!isAdmin && activeLearningUser &&
                catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])] &&
                !premiumLoading && (
                <button
                  type="button"
                  className="pw-bookmark-button"
                  onClick={() => {
                    try {
                      saveOfflineLesson(
                        activeLearningUser,
                        selectedCourse,
                        selectedUnit,
                        catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])]
                      )

                      window.alert('Offline notes saved to My Library.')
                    } catch (error) {
                      window.alert(error.message)
                    }
                  }}
                >
                  Save offline notes
                </button>
              )}
            </div>
          </div>

          {catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])] ? (
            <>
              <section className="lesson-panel">
                <h2 id="periak-lesson-objectives">Learning objectives</h2>
                <p>By the end of this unit, you should be able to:</p>
                <ul>
                  {(catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])].objectives || []).map((item, index) => <li key={index}>{item}</li>)}
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
                {(catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])].notes || []).map((item, index) => (
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
                  const lesson = catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])]
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
                  {(catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])].examPoints || []).map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </section>

              <section className="lesson-panel">
                <h2 id="periak-lesson-questions">Practice questions</h2>
                <p>Choose an answer, then open the explanation to check your understanding.</p>
                {(Array.isArray(catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])].questions)
                  ? catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])].questions
                  : Array.isArray(catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])].mcqs)
                    ? catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])].mcqs
                    : []).map((question, index) => {
                      const options = Array.isArray(question.options)
                        ? question.options
                        : ['A', 'B', 'C', 'D']
                            .map(key => question.options?.[key])
                            .filter(value => typeof value === 'string')
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

              {Array.isArray(catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])].clinicalCases) && catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])].clinicalCases.length > 0 && (
                <section className="lesson-panel">
                  <h2>Clinical case studies</h2>
                  {catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])].clinicalCases.map((item, index) => (
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

              {Array.isArray(catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])].writtenQuestions) && catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])].writtenQuestions.length > 0 && (
                <section className="lesson-panel">
                  <h2>Written and short-answer questions</h2>
                  <p>Attempt each question before revealing the model answer and marking guide.</p>
                  {catalogueLessons[JSON.stringify([selectedCourse.id, selectedUnit])].writtenQuestions.map((item, index) => (
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
                {catalogueError ? (
                  <div role="alert">
                    <p>{catalogueError}</p>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => window.dispatchEvent(
                        new Event('periak:content-refresh')
                      )}
                    >
                      Retry catalogue
                    </button>
                  </div>
                ) : !catalogueReady ? (
                  <p role="status">Loading course information…</p>
                ) : lessonRequestState[requestedLessonKey] === 'error' ? (
                  <div role="alert">
                    <p>
                      Unable to load this lesson.
                      Check your internet connection.
                    </p>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setLessonRetry(value => value + 1)}
                    >
                      Retry lesson
                    </button>
                  </div>
                ) : requestedUnitId &&
                    lessonRequestState[requestedLessonKey] !== 'empty' ? (
                  <p role="status">Loading study notes…</p>
                ) : (
                  <p className="coming-soon">
                    Published study notes are not available for this unit yet.
                  </p>
                )}
              </section>
            </>
          )}

          <button className="primary-button lesson-back-button" onClick={() => setSelectedUnit(null)}>
            Return to course units →
          </button>
        </main>

        <footer>
          <a className="brand footer-brand" href="#" onClick={goHome}><span className="brand-icon">✚</span> PERIAK</a>
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
            <span>PERIAK</span>
          </a>
          <button className="nav-button" onClick={goHome}>All courses ←</button>
        </header>

        <main className="course-detail">
          <button
            className="back-link"
            onClick={() => {
              setSelectedUnit(null)
              setSelectedCourse(null)
              setCatalogueOpen(true)
              window.scrollTo({ top: 0 })
            }}
          >
            ← Back to all courses
          </button>

          <div className="course-detail-hero">
            <div className="course-detail-icon">
              {layout === 'modern'
                ? <WorkspaceIcon name="book" size={29}/>
                : selectedCourse.icon}
            </div>
            <div className="eyebrow">{selectedCourse.level}</div>
            <h1>{selectedCourse.title}</h1>
            <p>{selectedCourse.desc}</p>
            <span className="unit-count">{(catalogueUnits[selectedCourse.title] || []).length} learning units</span>
          </div>

          <CourseOutlineViewer courseId={selectedCourse.id} />

          <section className="unit-section">
            <div className="eyebrow">YOUR LEARNING PATH</div>
            <h2>Course content</h2>
            <p className="unit-intro">Work through these units systematically, building your knowledge step by step.</p>

            <div className="unit-list">
              {(catalogueUnits[selectedCourse.title] || []).map((unit, index) => (
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
                    <p>{lessonDirectory[JSON.stringify([selectedCourse.id, unit])] ? 'Study notes, clinical applications and practice questions available.' : 'Study notes and revision materials coming soon.'}</p>
                  </div>
                  <span className="unit-arrow">→</span>
                </button>
              ))}
            </div>
          </section>

          {!isPremium && !isAdmin && !premiumLoading && (
            <aside
              className="periak-course-upgrade"
              aria-label="Explore PERIAK Premium"
            >
              <div className="periak-course-upgrade-copy">
                <span className="periak-course-upgrade-label">
                  PERIAK PREMIUM
                </span>
                <strong>Prepare with real nursing past papers</strong>
                <p>
                  Explore the searchable examination library,
                  organised by course, year and exam type.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenPremiumFeature('pastpapers')}
              >
                Explore past papers →
              </button>
            </aside>
          )}
        </main>

        <footer>
          <a className="brand footer-brand" href="#" onClick={goHome}><span className="brand-icon">✚</span> PERIAK</a>
          <p>Supporting nursing education in Kenya.</p>
          <span>© 2026 PERIAK. Learning made easier.</span>
        </footer>
      </div>
    )
  }

  if (layout !== 'modern') {
  return (
    <div className="app periak-compact-mobile-home">
      <header className="navbar">
        <a className="brand" href="#">
          <span className="brand-icon">✚</span>
          <span>PERIAK</span>
        </a>
        <nav>
          <a href="#courses">Courses</a>
        </nav>
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

        <section className="student-dashboard" id="dashboard" data-periak-tour="learning-dashboard">
          <HomeWelcome
            name={welcomeName}
          />
          <div className="dashboard-heading">
            <div>
              <div className="eyebrow">YOUR PERSONAL STUDY SPACE</div>
              <h2>Your learning dashboard</h2>
            </div>
          </div>



          <section className="dashboard-premium-ad" data-periak-tour="pastpapers">
            <div className="dashboard-premium-ad-copy">
              <span className="dashboard-premium-ad-label">PERIAK PREMIUM · FLAGSHIP</span>
              {!isAdmin && <ReferralShortcut compact />}
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



          <div className="dashboard-stats periak-minimal-stats">
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
            <article className="dashboard-stat">
              <span>🔥</span>
              <strong>{studyStreak ?? '—'}</strong>
              <small>Day streak</small>
            </article>
          </div>

          {!isAdmin && (
            <Suspense fallback={null}>
              <MyLearningLibrary
                key={activeLearningUser || 'guest'}
                userId={activeLearningUser}
                courses={catalogueCourses}
                units={catalogueUnits}
                onLesson={openUnit}
              />
            </Suspense>
          )}

          <div className="dashboard-panels">
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
        </section>

        <section className="courses-section" id="courses" data-periak-tour="courses">
          <div className="section-heading">
            <div>
              <div className="eyebrow">YOUR LEARNING STARTS HERE</div>
              <h2>Explore nursing subjects</h2>
            </div>
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

      </main>

      <footer>
        <a className="brand footer-brand" href="#"><span className="brand-icon">✚</span> PERIAK</a>
        <p>Supporting nursing education in Kenya.</p>
        <span>© 2026 PERIAK. Learning made easier.</span>
      </footer>


    </div>
  )
  }

  return (
    <div className="app pw-learning-home">
      {catalogueOpen ? (
        <main>
          <section className="courses-section pw-course-catalogue" id="courses" data-periak-tour="courses">
          <div className="section-heading">
            <div>
                            <h2>Courses</h2><p>Explore your nursing learning materials.</p>
            </div>
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
                <div className="course-icon">
                  <WorkspaceIcon name="book" size={25}/>
                </div>
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
                  Open course <WorkspaceIcon name="chevron" size={17}/>
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
        </main>
      ) : (
        <>
          {!isAdmin && <ReferralShortcut compact />}
          {!isAdmin && (
            <Suspense fallback={null}>
              <MyLearningLibrary
                key={activeLearningUser || 'guest'}
                userId={activeLearningUser}
                courses={catalogueCourses}
                units={catalogueUnits}
                onLesson={openUnit}
              />
            </Suspense>
          )}
          <StudentDashboard
          courses={catalogueCourses}
          units={catalogueUnits}
          learningData={learningData}
          courseProgress={courseProgress}
          studyStreak={studyStreak}
          onCourse={openCourse}
          onLesson={openUnit}
          onCatalogue={() => {
            setCatalogueOpen(true)
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            })
          }}
          onFeature={onOpenPremiumFeature}
        />
        </>
      )}
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
