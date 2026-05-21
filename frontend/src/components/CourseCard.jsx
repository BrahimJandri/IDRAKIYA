import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const EMOJIS = ['📚', '🎓', '💡', '🚀', '🌟', '🔥', '⚡', '🧠']
const LEVEL_KEYS = { beginner: 'catalog.beginner', intermediate: 'catalog.intermediate', advanced: 'catalog.advanced' }

export default function CourseCard({ course }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const emoji = EMOJIS[course.title.charCodeAt(0) % EMOJIS.length]
  const isFree = course.is_free || Number(course.price) === 0

  return (
    <article className="course-card" onClick={() => navigate(`/courses/${course.id}`)}>
      {course.thumbnail_url
        ? <img className="course-thumb" src={course.thumbnail_url} alt={course.title} />
        : <div className="course-thumb-blank"><span>{emoji}</span></div>
      }
      <div className="course-card-body">
        <div className="course-badges">
          <span className="badge badge-dark">{t(LEVEL_KEYS[course.level]) || course.level}</span>
          {isFree
            ? <span className="badge badge-mint">{t('common.free')}</span>
            : <span className="badge badge-amber">${Number(course.price).toFixed(2)}</span>
          }
          {course.category && <span className="badge badge-neutral">{course.category.name}</span>}
        </div>
        <h3 className="course-title">{course.title}</h3>
        <p className="course-desc">{course.description || t('course.noDescription')}</p>
        <div className="course-meta-row">
          <span>📖 {course.total_lessons} {t('common.lessons')}</span>
          {course.duration_hours && <span>⏱ {course.duration_hours}h</span>}
          <span>🌐 {course.language}</span>
        </div>
      </div>
    </article>
  )
}
