import { supabase } from './supabase'

const PAGE_SIZE = 500

export async function readPublishedRows(
  table,
  columns,
  { unitId, courseIds, signal } = {}
) {
  const rows = []

  for (let offset = 0; ; offset += PAGE_SIZE) {
    if (signal?.aborted) {
      throw new Error('Content request cancelled')
    }

    let query = supabase
      .from(table)
      .select(columns)
      .eq('status', 'published')

    if (unitId) {
      query = query.eq('unit_id', unitId)
    }

    if (courseIds) {
      if (!courseIds.length) return []
      query = query.in('course_id', courseIds)
    }

    if (table !== 'courses') {
      query = query.order('sort_order', {
        ascending: true
      })
    }

    query = query
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (signal) {
      query = query.abortSignal(signal)
    }

    const { data, error } = await query

    if (error) throw error

    rows.push(...(data || []))

    if (!data || data.length < PAGE_SIZE) {
      return rows
    }
  }
}

export function parsePublishedLessons(rows, unitKeys) {
  const lessons = {}

  for (const material of rows) {
    const key = unitKeys.get(material.unit_id)

    if (!key || !material.content) continue

    try {
      const parsed = typeof material.content === 'string'
        ? JSON.parse(material.content)
        : material.content

      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        lessons[key] = parsed
      }
    } catch {
      console.warn('Invalid published lesson:', key)
    }
  }

  return lessons
}
