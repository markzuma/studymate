import { useState } from 'react'
import './PublicLanding.css'
import GoogleSignIn from './GoogleSignIn'

const features = [
  ['📖', 'Study notes',
    'Structured nursing revision materials for focused, independent learning.'],
  ['📑', 'Past papers',
    'Explore examination papers organized by course, institution and year.'],
  ['📝', 'Smart examinations',
    'Practise questions, CATs and mock examinations with explained answers.'],
  ['🩺', 'Clinical learning',
    'Build clinical reasoning through learning tools and simulated scenarios.'],
  ['📊', 'Learning progress',
    'Keep track of your study activity and completed learning materials.'],
  ['📅', 'Study planner',
    'Organize your revision, assignments and upcoming examinations.']
]

const samples = [
  {
    question: 'Which assessment takes priority in a patient with acute respiratory distress?',
    options: ['Nutritional status', 'Airway patency', 'Bowel sounds', 'Sleep pattern'],
    correct: 1,
    explanation: 'Airway assessment takes priority under the ABC emergency assessment approach.'
  },
  {
    question: 'What is the most effective routine measure for reducing transmission of infection during patient care?',
    options: ['Hand hygiene', 'Routine antibiotics', 'Bed rest', 'Vitamin supplements'],
    correct: 0,
    explanation: 'Appropriate hand hygiene reduces transmission of microorganisms between patients, healthcare workers and the environment.'
  },
  {
    question: 'Which hormone primarily lowers blood glucose concentration?',
    options: ['Glucagon', 'Adrenaline', 'Insulin', 'Cortisol'],
    correct: 2,
    explanation: 'Insulin promotes glucose uptake in insulin-sensitive tissues and reduces hepatic glucose production.'
  },
  {
    question: 'Exclusive breastfeeding is generally recommended for the first how many months of life?',
    options: ['Two months', 'Four months', 'Nine months', 'Six months'],
    correct: 3,
    explanation: 'WHO recommends exclusive breastfeeding for the first six months, followed by appropriate complementary feeding with continued breastfeeding.'
  },
  {
    question: 'Incidence measures which aspect of disease occurrence?',
    options: ['New cases arising in a specified period', 'All existing cases', 'Deaths only', 'Hospital admissions only'],
    correct: 0,
    explanation: 'Incidence describes new cases occurring in a population at risk over a specified period.'
  }
]

export default function PublicLanding({ onLogin, onRegister, googleEnabled = false }) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  const question = samples[questionIndex]

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant' : 'smooth',
      block: 'start'
    })
  }

  function choose(index) {
    if (answer !== null) return
    setAnswer(index)
    if (index === question.correct) {
      setScore(value => value + 1)
    }
  }

  function next() {
    if (answer === null) return
    if (questionIndex === samples.length - 1) {
      setFinished(true)
      return
    }
    setQuestionIndex(value => value + 1)
    setAnswer(null)
  }

  function restart() {
    setQuestionIndex(0)
    setScore(0)
    setAnswer(null)
    setFinished(false)
  }

  return (
    <main className="pl-page">
      <header className="pl-header">
        <a className="pl-brand" href="/">
          <img src="/periak-icon.svg" alt="" width="34" height="34" />
          <strong>PERIAK</strong>
        </a>
        <nav aria-label="Public navigation">
          <button className="pl-text-button" onClick={onLogin}>
            Log in
          </button>
          <button className="pl-primary" onClick={onRegister}>
            Sign up
          </button>
          {googleEnabled && (
            <GoogleSignIn showDivider={false} />
          )}
        </nav>
      </header>

      <section className="pl-hero">
        <div className="pl-hero-content">
          <span className="pl-eyebrow">
            YOUR NURSING LEARNING COMPANION
          </span>
          <h1>
            Study smarter.<br />
            <span>Excel in nursing.</span>
          </h1>
          <p className="pl-intro">
            Master nursing with study notes, past papers,
            smart examinations and clinical learning tools.
          </p>
          <div className="pl-actions">
            <button className="pl-primary" onClick={onRegister}>
              Get started →
            </button>
            <button className="pl-secondary"
              onClick={() => scrollTo('pl-preview')}>
              Try a question
            </button>
          </div>
          <p className="pl-small">
            Certificate · Diploma · BSc Nursing
          </p>
        </div>

        <div className="pl-hero-visual">
          {!imageFailed ? (
            <img
              src="/images/stethoscope.png"
              alt="Medical stethoscope used in clinical assessment"
              onError={() => setImageFailed(true)}
              fetchPriority="high"
            />
          ) : (
            <img src="/periak-icon.svg"
              alt="PERIAK nursing education logo" />
          )}
          <div className="pl-visual-caption">
            <strong>Learn. Practise. Excel.</strong>
            <small>Build confidence, one topic at a time.</small>
          </div>
        </div>
      </section>

      <section className="pl-trust-strip">
        <span>Easy registration</span>
        <span>Exam-focused learning</span>
        <span>Designed for nursing students</span>
      </section>

      <section className="pl-section">
        <span className="pl-eyebrow">YOUR LEARNING TOOLKIT</span>
        <h2>Everything you need to prepare</h2>
        <p>Everything you need for focused nursing revision.</p>

        <div className="pl-feature-grid">
          {features.map(([icon, title, desc]) => (
            <article key={title} className="pl-feature">
              <span aria-hidden="true">{icon}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pl-section" id="pl-preview">
        <span className="pl-eyebrow">TEST YOUR KNOWLEDGE</span>
        <h2>Try a question</h2>
        <p>Practise with five nursing examination questions.</p>

        <div className="pl-quiz">
          {finished ? (
            <div className="pl-quiz-result">
              <h3>Sample revision complete</h3>
              <strong>{score} / {samples.length}</strong>
              <p>Continue your revision with PERIAK.</p>
              <button className="pl-primary" onClick={onRegister}>
                Create account
              </button>
              <button className="pl-secondary" onClick={restart}>
                Try again
              </button>
            </div>
          ) : (
            <>
              <small>Question {questionIndex + 1} of {samples.length}</small>
              <progress value={questionIndex + 1}
                max={samples.length} aria-label="Sample quiz progress" />
              <h3>{question.question}</h3>
              <div className="pl-options">
                {question.options.map((option, i) => (
                  <button
                    key={option}
                    disabled={answer !== null}
                    className={
                      answer === null ? '' :
                      i === question.correct ? 'pl-correct' :
                      i === answer ? 'pl-incorrect' : ''
                    }
                    onClick={() => choose(i)}
                  >
                    {String.fromCharCode(65 + i)}. {option}
                  </button>
                ))}
              </div>
              {answer !== null && (
                <div className="pl-feedback" role="status">
                  <strong>
                    {answer === question.correct
                      ? 'Correct answer' : 'Learning point'}
                  </strong>
                  <p>{question.explanation}</p>
                  <button className="pl-primary" onClick={next}>
                    {questionIndex === samples.length - 1
                      ? 'View result' : 'Next question →'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="pl-section pl-about">
        <h2>Built for nursing education</h2>
        <p>
          PERIAK is an independent nursing learning platform
          supporting academic revision and examination preparation.
          It is not a university, licensing authority or substitute
          for professional clinical guidance.
        </p>
        <p>
          Learning materials should be cross-checked against
          your curriculum, textbooks and applicable clinical guidelines.
          Never enter identifiable patient information.
        </p>
      </section>

      <footer className="pl-footer">
        <strong>PERIAK</strong>
        <p>Learn. Practise. Excel.</p>
        <nav aria-label="Legal and support">
          <a href="/about">About PERIAK</a>
          <a href="/terms">Terms of Service</a>
          <a href="/privacy">Privacy policy</a>
          <a href="/delete-account">Account deletion</a>
          <a href="mailto:periaksupport@gmail.com">Contact support</a>
          <a href="https://commons.wikimedia.org/wiki/File:Stethoscope.png"
             target="_blank" rel="noopener noreferrer">Photo credit</a>
        </nav>
        <small>© 2026 PERIAK</small>
      </footer>
    </main>
  )
}
