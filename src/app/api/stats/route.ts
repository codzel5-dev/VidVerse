import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [
      totalVideos,
      totalUsers,
      totalViews,
      totalCourses,
      totalRevenue,
      publishedVideos,
      freeVideos,
      featuredVideos,
    ] = await Promise.all([
      db.video.count(),
      db.user.count(),
      db.video.aggregate({ _sum: { views: true } }),
      db.course.count(),
      db.order.aggregate({ _sum: { amount: true }, where: { status: 'completed' } }),
      db.video.count({ where: { isPublished: true } }),
      db.video.count({ where: { isFree: true } }),
      db.video.count({ where: { isFeatured: true } }),
    ])

    return NextResponse.json({
      stats: {
        totalVideos,
        totalUsers,
        totalViews: totalViews._sum.views || 0,
        totalCourses,
        totalRevenue: totalRevenue._sum.amount || 0,
        publishedVideos,
        freeVideos,
        featuredVideos,
      },
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الإحصائيات' },
      { status: 500 }
    )
  }
}
