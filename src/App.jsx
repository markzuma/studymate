import { useEffect, useState } from 'react'
import { useBackHandler } from './context/NavigationProvider'
import { supabase } from './lib/supabase'
import './App.css'
import ExamCentre from './components/ExamCentre'
import StudyPlanner from './components/StudyPlanner'
import LearningSuite from './components/LearningSuite'
import CourseOutlineViewer from './components/CourseOutlineViewer'

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

function App({ isPremium = false, premiumLoading = false, isAdmin = false, onOpenPremium = () => {} }) {
  const [learningData, setLearningData] = useState(readLearningData)
  const [activeLearningUser, setActiveLearningUser] = useState(null)
  const [learningCloudReady, setLearningCloudReady] = useState(false)
  const [showExams, setShowExams] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [catalogueCourses, setCatalogueCourses] = useState(legacyCourseCatalogue)
  const [catalogueUnits, setCatalogueUnits] = useState(legacyUnitCatalogue)
  const [catalogueLessons, setCatalogueLessons] = useState({})

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

  const handleAppBack = () => {
    if (showExams) {
      setShowExams(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
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

  useBackHandler(handleAppBack, showExams || Boolean(selectedCourse), 20)

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
          onHome={() => setShowExams(false)}
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
            </div>
          </div>

          {catalogueLessons[selectedUnit] ? (
            <>
              <section className="lesson-panel">
                <h2>Learning objectives</h2>
                <p>By the end of this unit, you should be able to:</p>
                <ul>
                  {(catalogueLessons[selectedUnit].objectives || []).map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </section>

              {premiumLoading && !isAdmin ? (
                <section className="lesson-panel">
                  <p>Checking your Premium access…</p>
                </section>
              ) : (isPremium || isAdmin) ? (
                <>
              <section className="lesson-panel">
                <h2>Comprehensive study notes</h2>
                {(catalogueLessons[selectedUnit].notes || []).map((item, index) => (
                  <div className="note-topic" key={index}>
                    <h3>{item.heading || item.title}</h3>
                    {item.content && <p>{item.content}</p>}
                    {item.body && <p>{item.body}</p>}
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
                <h2>Clinical application</h2>
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
                <h2>High-yield examination points</h2>
                <ul>
                  {(catalogueLessons[selectedUnit].examPoints || []).map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </section>

              <section className="lesson-panel">
                <h2>Practice questions</h2>
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

        <section className="student-dashboard">
          <div className="dashboard-heading">
            <div>
              <div className="eyebrow">YOUR PERSONAL STUDY SPACE</div>
              <h2>Your learning dashboard</h2>
              <p>Pick up where you left off and keep track of your progress.</p>
            </div>
            <button className="dashboard-exam-button" onClick={() => setShowExams(true)}>
              Open examination centre →
            </button>
          </div>

          <StudyPlanner />

          <LearningSuite
            courses={catalogueCourses}
            learningData={learningData}
            catalogueUnits={catalogueUnits}
            catalogueLessons={catalogueLessons}
            onOpenCourse={setSelectedCourse}
            onOpenExams={() => setShowExams(true)}
            hasPremiumAccess={isPremium}
            premiumLoading={premiumLoading}
            isAdmin={isAdmin}
            onOpenPremium={onOpenPremium}
          />

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

        <section className="courses-section" id="courses">
          <div className="section-heading">
            <div>
              <div className="eyebrow">YOUR LEARNING STARTS HERE</div>
              <h2>Explore nursing subjects</h2>
              <p>Build a strong foundation across essential areas of nursing.</p>
            </div>
            <a className="text-link" href="#features">Explore resources →</a>
          </div>
          <div className="course-grid">
            {catalogueCourses.map((course) => (
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

export default App
