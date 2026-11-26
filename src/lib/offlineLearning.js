const PREFIX = 'periak_offline_library_v1_'
const MAX_LESSONS = 30
const MAX_BYTES = 1500000

function storageKey(userId) {
  if (!userId) throw new Error('Please sign in.')
  return PREFIX + userId
}

function plain(value) {
  return typeof value === 'string' ? value : ''
}

function textArray(value) {
  return Array.isArray(value)
    ? value.filter(item => typeof item === 'string')
    : []
}

export function getOfflineLessons(userId) {
  if (!userId) return []

  try {
    const data = JSON.parse(
      localStorage.getItem(storageKey(userId)) || '[]'
    )

    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function saveOfflineLesson(
  userId, course, unit, lesson
) {
  if (!navigator.onLine) {
    throw new Error('Connect to the internet to save a lesson.')
  }

  if (!course?.id || !unit || !lesson) {
    throw new Error('Lesson unavailable.')
  }

  const notes = Array.isArray(lesson.notes)
    ? lesson.notes.map(item => ({
        heading: plain(item?.heading || item?.title),
        body: plain(item?.body || item?.content),
        points: textArray(item?.points)
      }))
    : []

  if (!notes.length) {
    throw new Error('No study notes available to save.')
  }

  const entry = {
    courseId: course.id,
    courseTitle: course.title,
    unitTitle: unit,
    savedAt: Date.now(),
    objectives: textArray(lesson.objectives),
    notes,
    examPoints: textArray(lesson.examPoints)
  }

  const existing = getOfflineLessons(userId)
    .filter(item =>
      !(item.courseId === entry.courseId &&
        item.unitTitle === entry.unitTitle)
    )

  if (existing.length >= MAX_LESSONS) {
    throw new Error('Remove an offline lesson before saving another.')
  }

  const encoded = JSON.stringify([entry, ...existing])

  if (new Blob([encoded]).size > MAX_BYTES) {
    throw new Error('Offline storage limit reached.')
  }

  localStorage.setItem(storageKey(userId), encoded)

  return entry
}

export function removeOfflineLesson(userId, courseId, unitTitle) {
  const remaining = getOfflineLessons(userId)
    .filter(item =>
      !(item.courseId === courseId &&
        item.unitTitle === unitTitle)
    )

  localStorage.setItem(
    storageKey(userId),
    JSON.stringify(remaining)
  )
}

export function clearOfflineLessons(userId) {
  if (userId) {
    localStorage.removeItem(storageKey(userId))
  }
}
