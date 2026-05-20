import { useNavigate } from 'react-router-dom'

const LEVEL_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
const EMOJIS = ['📚', '🎓', '💡', '🚀', '🌟', '🔥']

export default function CourseCard({ course }) {
  const navigate = useNavigate()
  const emoji = EMOJIS[course.title.charCodeAt(0) % EMOJIS.length]

  return (
    <div className="card course-card" onClick={() => navigate(`/courses/${course.id}`)}>
      {course.thumbnail_url
        ? <img src={course.thumbnail_url} alt={course.title} />
        : <div className="thumb-placeholder">{emoji}</div>
      }
      <div className="card-body">
        <div className="course-meta">
          <span className="badge badge-primary">{LEVEL_LABELS[course.level] || course.level}</span>
          {course.is_free || Number(course.price) === 0
            ? <span className="badge badge-success">Free</span>
            : <span className="badge badge-accent">${Number(course.price).toFixed(2)}</span>
          }
          {course.category && <span className="badge badge-muted">{course.category.name}</span>}
        </div>
        <h3 style={{ margin: '.6rem 0 .3rem', fontSize: '1rem', fontWeight: 700 }}>{course.title}</h3>
        <p className="text-muted text-sm" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {course.description || 'No description provided.'}
        </p>
        <div className="flex items-center gap-2 mt-4 text-sm text-muted">
          <span>📖 {course.total_lessons} lessons</span>
          {course.duration_hours && <span>⏱ {course.duration_hours}h</span>}
          <span>🌐 {course.language}</span>
        </div>
      </div>
    </div>
  )
}
