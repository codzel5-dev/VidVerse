import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function checkAdmin(userId: string | null) {
  if (!userId) return false
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.role === 'admin'
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!await checkAdmin(userId)) {
      return NextResponse.json({ error: 'صلاحيات المسؤول مطلوبة' }, { status: 403 })
    }

    const [
      totalVideos,
      publishedVideos,
      unpublishedVideos,
      featuredVideos,
      freeVideos,
      totalUsers,
      bannedUsers,
      totalCourses,
      publishedCourses,
      totalOrders,
      completedOrders,
      totalRevenue,
      totalViews,
      totalComments,
      reportedComments,
      totalEnrollments,
    ] = await Promise.all([
      db.video.count(),
      db.video.count({ where: { isPublished: true } }),
      db.video.count({ where: { isPublished: false } }),
      db.video.count({ where: { isFeatured: true } }),
      db.video.count({ where: { isFree: true } }),
      db.user.count(),
      db.user.count({ where: { isBanned: true } }),
      db.course.count(),
      db.course.count({ where: { isPublished: true } }),
      db.order.count(),
      db.order.count({ where: { status: 'completed' } }),
      db.order.aggregate({ _sum: { amount: true }, where: { status: 'completed' } }),
      db.video.aggregate({ _sum: { views: true } }),
      db.comment.count(),
      db.comment.count({ where: { isReported: true } }),
      db.enrollment.count(),
    ])

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentVideos = await db.video.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    })
    const recentUsers = await db.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    })
    const recentOrders = await db.order.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    })

    return NextResponse.json({
      stats: {
        videos: {
          total: totalVideos,
          published: publishedVideos,
          unpublished: unpublishedVideos,
          featured: featuredVideos,
          free: freeVideos,
          recent: recentVideos,
        },
        users: {
          total: totalUsers,
          banned: bannedUsers,
          recent: recentUsers,
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          enrollments: totalEnrollments,
        },
        orders: {
          total: totalOrders,
          completed: completedOrders,
          pending: totalOrders - completedOrders,
          revenue: totalRevenue._sum.amount || 0,
          recent: recentOrders,
        },
        engagement: {
          totalViews: totalViews._sum.views || 0,
          totalComments,
          reportedComments,
        },
      },
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الإحصائيات' }, { status: 500 })
  }
}
