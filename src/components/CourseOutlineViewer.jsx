import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function CourseOutlineViewer({ courseId }) {
  const [outline, setOutline] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    async function load() {
      if (!courseId) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('course_outlines')
        .select('content')
        .eq('course_id', courseId)
        .eq('status', 'published')
        .maybeSingle()

      if (alive) {
        setOutline(error ? null : data?.content || null)
        setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [courseId])

  if (loading || !outline) return null

  const sections = [
    ['Learning outcomes', outline.learning_outcomes],
    ['Course topics', outline.topics],
    ['Teaching methods', outline.teaching_methods],
    ['Assessment methods', outline.assessment_methods],
    ['References', outline.references]
  ]

  return (
    <section style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 14,
      padding: 20,
      margin: '22px 0'
    }}>
      <div className="eyebrow">OFFICIAL COURSE OUTLINE</div>
      <h2>Course outline</h2>
      {outline.course_description && <p>{outline.course_description}</p>}
      {sections.map(([heading, items]) => (
        Array.isArray(items) && items.length > 0 ? (
          <div key={heading}>
            <h3>{heading}</h3>
            <ul>
              {items.map((item, index) => (
                <li key={index}>
                  {typeof item === 'string' ? item : JSON.stringify(item)}
                </li>
              ))}
            </ul>
          </div>
        ) : null
      ))}
    </section>
  )
}
