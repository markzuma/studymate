import { supabase } from './supabase'

const CACHE_TTL = 5 * 60 * 1000

let cached = null
let pending = null
let generation = 0

async function readAll(table, columns) {
  const rows = []
  const pageSize = 500
  const id = table === 'smart_exam_course_catalogue'
    ? 'course_id'
    : 'unit_id'

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(id)
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    rows.push(...(data || []))

    if (!data || data.length < pageSize) break
  }

  return rows
}

export function getCachedCatalogue() {
  return cached
}

export function loadExamCatalogue({ force = false } = {}) {
  if (pending) return pending

  if (
    !force &&
    cached &&
    Date.now() - cached.loadedAt < CACHE_TTL
  ) {
    return Promise.resolve(cached)
  }

  const requestGeneration = generation

  const request = Promise.all([
    readAll(
      'smart_exam_course_catalogue',
      'course_id,course_title,mcq_count,written_count'
    ),
    readAll(
      'smart_exam_unit_catalogue',
      'unit_id,course_id,unit_title,sort_order,mcq_count,written_count'
    )
  ]).then(([courses, units]) => {
    const result = {
      courses: courses.sort((a, b) =>
        a.course_title.localeCompare(b.course_title)
      ),
      units: units.sort((a, b) =>
        Number(a.sort_order || 0) -
        Number(b.sort_order || 0) ||
        a.unit_title.localeCompare(b.unit_title)
      ),
      loadedAt: Date.now()
    }

    if (requestGeneration !== generation) {
      throw new Error('Catalogue session changed. Please refresh.')
    }

    cached = result

    return result
  }).finally(() => {
    if (pending === request) pending = null
  })

  pending = request
  return request
}

supabase.auth.onAuthStateChange(event => {
  if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
    generation += 1
    cached = null
    pending = null
  }
})
