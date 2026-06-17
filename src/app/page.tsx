import { db } from '@/lib/db'
import HomeClient from '@/components/HomeClient'

export const dynamic = 'force-dynamic'

async function getInitialData() {
  const now = new Date()

  const [videos, courses, categories, banners, stats] = await Promise.all([
    db.video.findMany({
      where: { isPublished: true },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        videoTags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 24,
    }),
    db.course.findMany({
      where: { isPublished: true },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        courseTags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        lessons: { select: { id: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    db.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { videos: true, courses: true } } },
      orderBy: { order: 'asc' },
    }),
    db.adBanner.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          },
          {
            OR: [{ endsAt: null }, { endsAt: { gte: now } }],
          },
        ],
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    }),
    {
      totalVideos: db.video.count({ where: { isPublished: true } }),
      totalUsers: db.user.count(),
      totalViews: db.video.aggregate({ _sum: { views: true } }).then((r) => r._sum.views || 0),
      totalCourses: db.course.count({ where: { isPublished: true } }),
      totalRevenue: db.order
        .aggregate({ _sum: { amount: true }, where: { status: 'completed' } })
        .then((r) => r._sum.amount || 0),
      freeVideos: db.video.count({ where: { isPublished: true, isFree: true } }),
      featuredVideos: db.video.count({ where: { isPublished: true, isFeatured: true } }),
    },
  ])

  const statsResolved = {
    totalVideos: await stats.totalVideos,
    totalUsers: await stats.totalUsers,
    totalViews: await stats.totalViews,
    totalCourses: await stats.totalCourses,
    totalRevenue: await stats.totalRevenue,
    freeVideos: await stats.freeVideos,
    featuredVideos: await stats.featuredVideos,
  }

  return { videos, courses, categories, banners, stats: statsResolved }
}

export default async function Home() {
  const data = await getInitialData()
  return <HomeClient initialData={data} />
}
