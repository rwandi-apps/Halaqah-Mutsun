
# Firestore Schema Documentation

## Collections

### `users`
- `email`: string
- `name`: string
- `role`: string (COORDINATOR | GURU)
- `photoUrl`: string

### `students`
- `name`: string
- `classId`: string
- `teacherId`: string
- `juzTarget`: number
- `currentProgress`: number

### `reports`
- `studentId`: string
- `teacherId`: string
- `date`: timestamp
- `surah`: string
- `verseRange`: string
- `grade`: string
- `aiComment`: string
