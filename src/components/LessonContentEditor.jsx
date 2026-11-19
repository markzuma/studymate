import { useMemo, useState } from 'react'
import './LessonContentEditor.css'

const emptyLesson = () => ({
  contentVersion: 2,
  objectives: [],
  notes: [],
  clinical: [],
  clinicalCases: [],
  examPoints: [],
  questions: [],
  writtenQuestions: []
})

function normaliseLesson(value) {
  const lesson = value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {}

  return {
    ...emptyLesson(),
    ...lesson,
    objectives: Array.isArray(lesson.objectives) ? lesson.objectives : [],
    notes: Array.isArray(lesson.notes) ? lesson.notes : [],
    clinicalCases: Array.isArray(lesson.clinicalCases) ? lesson.clinicalCases : [],
    examPoints: Array.isArray(lesson.examPoints) ? lesson.examPoints : [],
    questions: (Array.isArray(lesson.questions)
      ? lesson.questions
      : Array.isArray(lesson.mcqs) ? lesson.mcqs : []).map(question => ({
        ...question,
        options: Array.isArray(question.options)
          ? question.options
          : question.options && typeof question.options === 'object'
            ? Object.values(question.options)
            : []
      })),
    writtenQuestions: Array.isArray(lesson.writtenQuestions)
      ? lesson.writtenQuestions
      : [],
    clinical: lesson.clinical ?? lesson.clinicalApplication ?? []
  }
}

export default function LessonContentEditor({
  value,
  onChange,
  disabled = false
}) {
  const parsedValue = useMemo(() => {
    try {
      return {
        lesson: normaliseLesson(JSON.parse(value || '{}')),
        error: ''
      }
    } catch {
      return {
        lesson: emptyLesson(),
        error: 'The existing lesson contains invalid JSON.'
      }
    }
  }, [value])

  const lesson = parsedValue.lesson
  const jsonError = parsedValue.error

  const [advanced, setAdvanced] = useState(false)

  function update(next) {
    onChange(JSON.stringify(next, null, 2))
  }

  function updateList(field, index, nextValue) {
    const items = [...lesson[field]]
    items[index] = nextValue
    update({ ...lesson, [field]: items })
  }

  function addListItem(field, item) {
    update({ ...lesson, [field]: [...lesson[field], item] })
  }

  function removeListItem(field, index) {
    update({
      ...lesson,
      [field]: lesson[field].filter((_, i) => i !== index)
    })
  }

  function updateMCQ(index, key, nextValue) {
    const items = [...lesson.questions]
    items[index] = { ...items[index], [key]: nextValue }
    update({ ...lesson, questions: items })
  }

  function updateWritten(index, key, nextValue) {
    const items = [...lesson.writtenQuestions]
    items[index] = { ...items[index], [key]: nextValue }
    update({ ...lesson, writtenQuestions: items })
  }

  function updateAdvanced(raw) {
    onChange(raw)
  }

  if (advanced) {
    return (
      <section className="lesson-editor">
        <div className="lesson-editor-heading">
          <div>
            <h3>Advanced JSON editor</h3>
            <p>Edit the complete lesson structure directly.</p>
          </div>
          <button type="button" onClick={() => setAdvanced(false)}>
            Guided editor
          </button>
        </div>
        <textarea
          className="lesson-editor-json"
          value={value}
          onChange={event => updateAdvanced(event.target.value)}
          disabled={disabled}
          spellCheck={false}
          rows={28}
        />
        {jsonError && <p className="lesson-editor-error">{jsonError}</p>}
      </section>
    )
  }

  return (
    <section className="lesson-editor">
      <div className="lesson-editor-heading">
        <div>
          <h3>Lesson content builder</h3>
          <p>Build comprehensive lessons using the sections below.</p>
        </div>
        <button type="button" onClick={() => setAdvanced(true)}>
          Advanced JSON
        </button>
      </div>

      <div className="lesson-editor-section">
        <h4>Learning objectives</h4>
        {lesson.objectives.map((item, index) => (
          <div className="lesson-editor-row" key={index}>
            <input
              value={item}
              disabled={disabled}
              onChange={event => updateList('objectives', index, event.target.value)}
              placeholder="Enter a measurable learning objective"
            />
            <button type="button" disabled={disabled} onClick={() => removeListItem('objectives', index)}>Remove</button>
          </div>
        ))}
        <button type="button" disabled={disabled} onClick={() => addListItem('objectives', '')}>+ Add objective</button>
      </div>

      <div className="lesson-editor-section">
        <h4>Comprehensive study notes</h4>
        {lesson.notes.map((item, index) => (
          <article className="lesson-editor-card" key={index}>
            <label>Section heading</label>
            <input
              value={item.heading || item.title || ''}
              disabled={disabled}
              onChange={event => updateList('notes', index, { ...item, heading: event.target.value })}
              placeholder="e.g. Pathophysiology"
            />
            <label>Detailed explanation</label>
            <textarea
              value={item.body || item.content || ''}
              disabled={disabled}
              rows={5}
              onChange={event => updateList('notes', index, { ...item, body: event.target.value })}
              placeholder="Write comprehensive university-level notes..."
            />
            <button type="button" disabled={disabled} onClick={() => removeListItem('notes', index)}>Remove section</button>
          </article>
        ))}
        <button type="button" disabled={disabled} onClick={() => addListItem('notes', { heading: '', body: '' })}>+ Add note section</button>
      </div>

      <div className="lesson-editor-section">
        <h4>Clinical application</h4>
        <textarea
          value={typeof lesson.clinical === 'string' ? lesson.clinical : JSON.stringify(lesson.clinical, null, 2)}
          disabled={disabled}
          rows={5}
          onChange={event => {
            const raw = event.target.value
            if (typeof lesson.clinical === 'string') {
              update({ ...lesson, clinical: raw })
              return
            }
            try {
              update({ ...lesson, clinical: JSON.parse(raw) })
            } catch {
              // Keep structured clinical content unchanged until valid JSON is entered.
            }
          }}
          placeholder={typeof lesson.clinical === 'string'
            ? "Explain how nurses apply this knowledge in patient care..."
            : "This content is structured JSON. Keep it valid when editing, or use Advanced JSON."}
        />
      </div>

      <div className="lesson-editor-section">
        <h4>Clinical case studies</h4>
        {lesson.clinicalCases.map((item, index) => (
          <article className="lesson-editor-card" key={index}>
            <label>Case title</label>
            <input
              value={item.title || item.heading || ''}
              disabled={disabled}
              onChange={event => updateList('clinicalCases', index, { ...item, title: event.target.value })}
            />
            <label>Patient scenario and nursing application</label>
            <textarea
              value={item.content || item.body || ''}
              disabled={disabled}
              rows={5}
              onChange={event => updateList('clinicalCases', index, { ...item, content: event.target.value })}
            />
            <button type="button" disabled={disabled} onClick={() => removeListItem('clinicalCases', index)}>Remove case</button>
          </article>
        ))}
        <button type="button" disabled={disabled} onClick={() => addListItem('clinicalCases', { title: '', content: '' })}>+ Add clinical case</button>
      </div>

      <div className="lesson-editor-section">
        <h4>High-yield examination points</h4>
        {lesson.examPoints.map((item, index) => (
          <div className="lesson-editor-row" key={index}>
            <input
              value={item}
              disabled={disabled}
              onChange={event => updateList('examPoints', index, event.target.value)}
              placeholder="Enter an important examination point"
            />
            <button type="button" disabled={disabled} onClick={() => removeListItem('examPoints', index)}>Remove</button>
          </div>
        ))}
        <button type="button" disabled={disabled} onClick={() => addListItem('examPoints', '')}>+ Add examination point</button>
      </div>

      <div className="lesson-editor-section">
        <h4>Multiple-choice questions</h4>
        {lesson.questions.map((item, index) => (
          <article className="lesson-editor-card" key={index}>
            <label>Question</label>
            <textarea
              value={item.question || item.q || ''}
              disabled={disabled}
              rows={2}
              onChange={event => updateMCQ(index, 'question', event.target.value)}
            />
            {(Array.isArray(item.options) ? item.options : []).map((option, optionIndex) => (
              <label key={optionIndex}>
                Option {String.fromCharCode(65 + optionIndex)}
                <input
                  value={option}
                  disabled={disabled}
                  onChange={event => {
                    const options = [...item.options]
                    options[optionIndex] = event.target.value
                    updateMCQ(index, 'options', options)
                  }}
                />
              </label>
            ))}
            <button type="button" disabled={disabled} onClick={() => updateMCQ(index, 'options', [...(item.options || []), ''])}>+ Add option</button>
            <label>Correct answer (A, B, C or D)</label>
            <input
              value={typeof item.answer === 'number' ? String.fromCharCode(65 + item.answer) : item.answer || ''}
              disabled={disabled}
              maxLength={1}
              onChange={event => updateMCQ(index, 'answer', event.target.value.toUpperCase())}
            />
            <label>Explanation</label>
            <textarea
              value={item.explanation || ''}
              disabled={disabled}
              rows={3}
              onChange={event => updateMCQ(index, 'explanation', event.target.value)}
            />
            <button type="button" disabled={disabled} onClick={() => removeListItem('questions', index)}>Remove question</button>
          </article>
        ))}
        <button type="button" disabled={disabled} onClick={() => addListItem('questions', { question: '', options: ['', '', '', ''], answer: 'A', explanation: '' })}>+ Add MCQ</button>
      </div>

      <div className="lesson-editor-section">
        <h4>Written and short-answer questions</h4>
        {lesson.writtenQuestions.map((item, index) => (
          <article className="lesson-editor-card" key={index}>
            <label>Question</label>
            <textarea
              value={item.question || ''}
              disabled={disabled}
              rows={2}
              onChange={event => updateWritten(index, 'question', event.target.value)}
            />
            <label>Model answer</label>
            <textarea
              value={item.modelAnswer || ''}
              disabled={disabled}
              rows={5}
              onChange={event => updateWritten(index, 'modelAnswer', event.target.value)}
            />
            <label>Marking points / guide</label>
            <textarea
              value={item.markingGuide || ''}
              disabled={disabled}
              rows={3}
              onChange={event => updateWritten(index, 'markingGuide', event.target.value)}
            />
            <button type="button" disabled={disabled} onClick={() => removeListItem('writtenQuestions', index)}>Remove question</button>
          </article>
        ))}
        <button type="button" disabled={disabled} onClick={() => addListItem('writtenQuestions', { question: '', modelAnswer: '', markingGuide: '' })}>+ Add written question</button>
      </div>

      <details className="lesson-editor-preview">
        <summary>Preview lesson JSON</summary>
        <pre>{JSON.stringify(lesson, null, 2)}</pre>
      </details>
    </section>
  )
}
