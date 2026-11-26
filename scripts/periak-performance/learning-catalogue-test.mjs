import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(
  'src/lib/learningCatalogue.js',
  'utf8'
)

let requests = []
let records = []
let fail = false

const mockSupabase = {
  from(table) {
    const request = {
      table,
      filters: [],
      orders: []
    }

    const query = {
      select(columns) {
        request.columns = columns
        return this
      },

      eq(column, value) {
        request.filters.push([column, value])
        return this
      },

      in(column, value) {
        request.filters.push([column, value])
        return this
      },

      order(column) {
        request.orders.push(column)
        return this
      },

      range(start, end) {
        request.start = start
        request.end = end
        return this
      },

      abortSignal(signal) {
        request.signal = signal
        return this
      },

      then(resolve, reject) {
        requests.push(request)

        let selected = records

        for (const [column, value] of request.filters) {
          selected = selected.filter(row =>
            Array.isArray(value)
              ? value.includes(row[column])
              : row[column] === value
          )
        }

        return Promise.resolve(
          fail
            ? { data: null, error: new Error('Network failure') }
            : {
                data: selected.slice(
                  request.start,
                  request.end + 1
                ),
                error: null
              }
        ).then(resolve, reject)
      }
    }

    return query
  }
}

const transformed = source
  .replace(
    /import\s+\{\s*supabase\s*\}\s+from\s+['"]\.\/supabase['"]/,
    'const supabase = mockSupabase'
  )
  .replace(/\bexport\s+/g, '')

const {
  readPublishedRows,
  parsePublishedLessons
} = new Function(
  'mockSupabase',
  transformed +
  '\nreturn { readPublishedRows, parsePublishedLessons };'
)(mockSupabase)

let passed = 0

function pass(label) {
  passed++
  console.log('PASS:', label)
}

// 1. Pagination beyond the usual API row limits.

records = Array.from(
  { length: 1201 },
  (_, i) => ({
    id: i,
    status: 'published',
    unit_id: 'unit-a'
  })
)

requests = []

const paginated = await readPublishedRows(
  'learning_materials',
  'id,unit_id,status'
)

assert.equal(paginated.length, 1201)
assert.equal(requests.length, 3)
assert.deepEqual(
  requests.map(r => r.start),
  [0, 500, 1000]
)

pass('Pagination across 1,201 records')

// 2. Metadata-only queries.

assert.ok(
  requests.every(r =>
    !r.columns.split(',').includes('content')
  )
)

pass('Metadata queries exclude lesson content')

// 3. Published content only.

records.push({
  id: 1202,
  status: 'draft',
  unit_id: 'unit-a'
})

const published = await readPublishedRows(
  'learning_materials',
  'id,status'
)

assert.equal(published.length, 1201)

pass('Draft materials excluded')

// 4. Individual lesson filtering.

records = [
  {
    id: 1,
    status: 'published',
    unit_id: 'unit-a',
    content: '{"notes":["A"]}'
  },
  {
    id: 2,
    status: 'published',
    unit_id: 'unit-b',
    content: '{"notes":["B"]}'
  }
]

const individual = await readPublishedRows(
  'learning_materials',
  'id,unit_id,content,status',
  { unitId: 'unit-a' }
)

assert.equal(individual.length, 1)
assert.equal(individual[0].unit_id, 'unit-a')

pass('Individual lesson retrieval')

// 5. Composite lesson identities.

const keyA = JSON.stringify(['course-a', 'Introduction'])
const keyB = JSON.stringify(['course-b', 'Introduction'])

const keys = new Map([
  ['unit-a', keyA],
  ['unit-b', keyB]
])

const parsed = parsePublishedLessons(records, keys)

assert.deepEqual(parsed[keyA].notes, ['A'])
assert.deepEqual(parsed[keyB].notes, ['B'])

pass('Identical unit names across courses remain distinct')

// 6. JSON object content.

const objectContent = parsePublishedLessons([
  {
    unit_id: 'unit-a',
    content: { objectives: ['Test'] }
  }
], keys)

assert.deepEqual(
  objectContent[keyA].objectives,
  ['Test']
)

pass('Structured JSON content supported')

// 7. Invalid content handling.

const previousWarn = console.warn

try {
  console.warn = () => {}

  const invalid = parsePublishedLessons([
    { unit_id: 'unit-a', content: 'invalid JSON' },
    { unit_id: 'unit-b', content: '[]' }
  ], keys)

  assert.deepEqual(invalid, {})
} finally {
  console.warn = previousWarn
}

pass('Invalid lesson content safely excluded')

// 8. Cancelled requests.

const controller = new AbortController()
controller.abort()

await assert.rejects(
  readPublishedRows(
    'learning_materials',
    'id',
    { signal: controller.signal }
  )
)

pass('Cancelled requests rejected')

// 9. Failed network requests.

fail = true

await assert.rejects(
  readPublishedRows(
    'learning_materials',
    'id'
  )
)

fail = false

pass('Network errors propagated for retry')

// 10. Empty course filters.

requests = []

const empty = await readPublishedRows(
  'course_units',
  'id',
  { courseIds: [] }
)

assert.deepEqual(empty, [])
assert.equal(requests.length, 0)

pass('Empty course selection avoids database requests')

console.log(`\nSUCCESS: ${passed}/10 content-reader tests passed.`)
