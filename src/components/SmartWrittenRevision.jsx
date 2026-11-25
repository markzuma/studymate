import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SmartWrittenRevision({
  courseId,
  unitId,
  onBack,
  onUpgrade
}) {
  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [response, setResponse] = useState('')
  const [revealed, setRevealed] = useState(null)
  const [remaining, setRemaining] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [finished, setFinished] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [error, setError] = useState('')

  const lock = useRef(false)
  const question = questions[index]

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        let query = supabase
          .from('live_written_question_bank')
          .select(
            'question_id,question_text,' +
            'unit_title,unit_order'
          )
          .eq('course_id', courseId)
          .order('unit_order')
          .order('question_id')
          .limit(100)

        if (unitId) {
          query = query.eq('unit_id', unitId)
        }

        const { data, error } = await query

        if (error) throw error

        if (!cancelled) {
          setQuestions(data || [])
          setIndex(0)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => { cancelled = true }
  }, [courseId, unitId])

  async function reveal() {
    if (!question || revealed || lock.current) return

    lock.current = true
    setBusy(true)
    setError('')

    try {
      const { data, error } = await supabase.rpc(
        'smart_written_reveal',
        {
          p_question_id: question.question_id
        }
      )

      if (error) throw error

      if (!data?.allowed) {
        throw new Error(
          data?.message || 'Access unavailable.'
        )
      }

      setRevealed(data)
      setReviewed(previous => previous + 1)

      setRemaining(
        Number.isInteger(data.remaining)
          ? data.remaining
          : null
      )
    } catch (err) {
      setError(err.message)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  function next() {
    if (busy || !revealed) return

    if (index + 1 >= questions.length) {
      setFinished(true)
      return
    }

    setIndex(previous => previous + 1)
    setResponse('')
    setRevealed(null)
    setError('')
  }

  return (
    <section className="sev2-card">
      <h2>Written Revision</h2>

      <small className="sev2-muted">
        Attempt the question, then compare your
        response with the model answer.
      </small>

      {error && (
        <div role="alert" className="sev2-error">
          {error}

          {/premium|free|allowance/i.test(error) && (
            <button onClick={onUpgrade}>
              Upgrade
            </button>
          )}
        </div>
      )}

      {remaining !== null && (
        <small>
          {remaining} free revision answers remaining
        </small>
      )}

      {loading ? (
        <p role="status">
          Loading written questions…
        </p>
      ) : finished ? (
        <>
          <h2>Revision complete</h2>

          <p>
            You reviewed {reviewed} written questions.
          </p>

          <button
            className="sev2-primary"
            onClick={onBack}
          >
            Back to Exam Centre
          </button>
        </>
      ) : !question ? (
        <>
          <p>
            No written questions are available
            for this selection.
          </p>

          <button
            className="sev2-back"
            onClick={onBack}
          >
            Choose another course or unit
          </button>
        </>
      ) : (
        <>
          <div className="sev2-progress">
            <small>{question.unit_title}</small>

            <small>
              {index + 1}/{questions.length}
            </small>
          </div>

          <progress
            value={reviewed}
            max={questions.length}
            aria-label="Written revision progress"
          />

          <h2>{question.question_text}</h2>

          <label htmlFor="sev2-written-response">
            Your answer
          </label>

          <textarea
            id="sev2-written-response"
            className="sev2-written-response"
            placeholder="Write your answer here…"
            rows={7}
            maxLength={15000}
            value={response}
            disabled={busy || Boolean(revealed)}
            onChange={event =>
              setResponse(event.target.value)
            }
          />

          {!revealed ? (
            <button
              className="sev2-primary"
              disabled={busy}
              onClick={reveal}
            >
              {busy
                ? 'Checking access…'
                : 'Reveal model answer'}
            </button>
          ) : (
            <>
              <div className="sev2-explanation">
                <strong>Model answer</strong>

                <p className="sev2-model-answer">
                  {revealed.model_answer}
                </p>

                {revealed.marking_guide && (
                  <>
                    <strong>Marking guide</strong>

                    <p className="sev2-model-answer">
                      {revealed.marking_guide}
                    </p>
                  </>
                )}
              </div>

              <small className="sev2-muted">
                Compare your key points with the model
                answer. Written responses are self-assessed.
              </small>

              <button
                className="sev2-primary"
                onClick={next}
              >
                {index + 1 === questions.length
                  ? 'Complete revision'
                  : 'Next question'}
              </button>
            </>
          )}
        </>
      )}
    </section>
  )
}
