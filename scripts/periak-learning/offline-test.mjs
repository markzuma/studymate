import assert from 'node:assert/strict'

const storage = new Map()

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  }
})

Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { onLine: true }
})

const {
  saveOfflineLesson,
  getOfflineLessons,
  removeOfflineLesson,
  clearOfflineLessons
} = await import('../../src/lib/offlineLearning.js')

const course = {
  id: 'test-course',
  title: 'Test Nursing Course'
}

const lesson = {
  objectives: ['Explain the concept'],
  notes: [{
    heading: 'Introduction',
    body: 'Example study notes.'
  }],
  examPoints: ['Example revision point'],
  questions: ['Must not be copied'],
  clinicalCases: ['Must not be copied'],
  writtenQuestions: ['Must not be copied']
}

saveOfflineLesson(
  'student-a', course, 'Unit One', lesson
)

assert.equal(getOfflineLessons('student-a').length, 1)
console.log('PASS: Save and retrieve offline lesson')

assert.equal(getOfflineLessons('student-b').length, 0)
console.log('PASS: Account-specific storage')

const saved = getOfflineLessons('student-a')[0]

assert.equal(saved.questions, undefined)
assert.equal(saved.clinicalCases, undefined)
assert.equal(saved.writtenQuestions, undefined)
console.log('PASS: Only selected note fields retained')

saveOfflineLesson(
  'student-a', course, 'Unit One', lesson
)

assert.equal(getOfflineLessons('student-a').length, 1)
console.log('PASS: Duplicate download prevented')

saveOfflineLesson(
  'student-a',
  { id: 'another-course', title: 'Another Course' },
  'Unit One',
  lesson
)

assert.equal(getOfflineLessons('student-a').length, 2)
console.log('PASS: Same-title lessons remain separate')

navigator.onLine = false

assert.throws(() =>
  saveOfflineLesson(
    'student-a', course, 'Unit Two', lesson
  )
)

assert.equal(getOfflineLessons('student-a').length, 2)
console.log('PASS: Offline reading and download restriction')

removeOfflineLesson(
  'student-a', course.id, 'Unit One'
)

assert.equal(getOfflineLessons('student-a').length, 1)
console.log('PASS: Offline resource removal')

clearOfflineLessons('student-a')

assert.equal(getOfflineLessons('student-a').length, 0)
console.log('PASS: Offline library cleanup')
