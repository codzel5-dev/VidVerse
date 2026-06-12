import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import path from 'path'

const dbPath = path.join(__dirname, '..', 'db', 'custom.db')
const adapter = new PrismaBetterSqlite3({ url: 'file:' + dbPath })
const prisma = new PrismaClient({ adapter })

// YouTube-style share code generator
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
function generateShareCode(): string {
  const bytes = crypto.randomBytes(8)
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += CHARSET[bytes[i] % CHARSET.length]
  }
  return code
}

async function generateUniqueShareCode(): Promise<string> {
  let code = generateShareCode()
  let attempts = 0
  while (attempts < 100) {
    const existing = await prisma.video.findUnique({ where: { shareCode: code } })
    if (!existing) return code
    code = generateShareCode()
    attempts++
  }
  return generateShareCode() + Date.now().toString(36).slice(-4)
}

async function main() {
  console.log('🌱 Seeding database...')

  // Clean up existing data
  await prisma.rating.deleteMany()
  await prisma.watchHistory.deleteMany()
  await prisma.savedVideo.deleteMany()
  await prisma.like.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.order.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.videoTag.deleteMany()
  await prisma.courseTag.deleteMany()
  await prisma.video.deleteMany()
  await prisma.course.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.category.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.user.deleteMany()

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      name: 'مدير المنصة',
      email: 'admin@vidverse.com',
      password: adminPassword,
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      bio: 'مدير منصة VidVerse للمحتوى التعليمي',
    },
  })

  // Create regular users
  const user1 = await prisma.user.create({
    data: {
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      password: await bcrypt.hash('password123', 12),
      role: 'user',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed',
      bio: 'مطور ويب ومهتم بالتقنية',
    },
  })

  const user2 = await prisma.user.create({
    data: {
      name: 'سارة علي',
      email: 'sara@example.com',
      password: await bcrypt.hash('password123', 12),
      role: 'user',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sara',
      bio: 'مصممة جرافيك وخبيرة في التصميم الرقمي',
    },
  })

  const user3 = await prisma.user.create({
    data: {
      name: 'خالد حسن',
      email: 'khaled@example.com',
      password: await bcrypt.hash('password123', 12),
      role: 'user',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=khaled',
      bio: 'مسوّق رقمي وصانع محتوى',
    },
  })

  console.log('✅ Users created')

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: 'الكورسات', slug: 'courses', description: 'كورسات تعليمية شاملة', icon: 'GraduationCap', color: '#8B5CF6', order: 1 },
    }),
    prisma.category.create({
      data: { name: 'الذكاء الاصطناعي', slug: 'artificial-intelligence', description: 'محتوى متعلق بالذكاء الاصطناعي وتعلم الآلة', icon: 'Brain', color: '#EC4899', order: 2 },
    }),
    prisma.category.create({
      data: { name: 'البرمجة', slug: 'programming', description: 'دروس البرمجة وتطوير البرمجيات', icon: 'Code', color: '#10B981', order: 3 },
    }),
    prisma.category.create({
      data: { name: 'التسويق', slug: 'marketing', description: 'التسويق الرقمي والتسويق عبر الإنترنت', icon: 'TrendingUp', color: '#F59E0B', order: 4 },
    }),
    prisma.category.create({
      data: { name: 'التصميم', slug: 'design', description: 'التصميم الجرافيكي وتصميم واجهات المستخدم', icon: 'Palette', color: '#6366F1', order: 5 },
    }),
    prisma.category.create({
      data: { name: 'الأعمال', slug: 'business', description: 'ريادة الأعمال وإدارة المشاريع', icon: 'Briefcase', color: '#EF4444', order: 6 },
    }),
    prisma.category.create({
      data: { name: 'الفيديوهات المجانية', slug: 'free-videos', description: 'محتوى مجاني متنوع', icon: 'Play', color: '#14B8A6', order: 7 },
    }),
    prisma.category.create({
      data: { name: 'الشروحات', slug: 'tutorials', description: 'شروحات تقنية وخطوة بخطوة', icon: 'BookOpen', color: '#F97316', order: 8 },
    }),
  ])

  console.log('✅ Categories created')

  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'JavaScript', slug: 'javascript' } }),
    prisma.tag.create({ data: { name: 'React', slug: 'react' } }),
    prisma.tag.create({ data: { name: 'Python', slug: 'python' } }),
    prisma.tag.create({ data: { name: 'Next.js', slug: 'nextjs' } }),
    prisma.tag.create({ data: { name: 'AI', slug: 'ai' } }),
    prisma.tag.create({ data: { name: 'تصميم', slug: 'design-ar' } }),
    prisma.tag.create({ data: { name: 'تسويق رقمي', slug: 'digital-marketing' } }),
    prisma.tag.create({ data: { name: 'مبتدئ', slug: 'beginner' } }),
    prisma.tag.create({ data: { name: 'متقدم', slug: 'advanced' } }),
    prisma.tag.create({ data: { name: 'تطبيقات', slug: 'apps' } }),
  ])

  console.log('✅ Tags created')

  // Create 12 sample videos
  const videoData = [
    {
      title: 'تعلم JavaScript من الصفر إلى الاحتراف',
      description: 'كورس شامل لتعلم لغة JavaScript من البداية حتى المستوى المتقدم. يتضمن المفاهيم الأساسية والبرمجة الكائنية والبرمجة غير المتزامنة.',
      categoryId: categories[2].id, // البرمجة
      userId: admin.id,
      duration: 7200,
      views: 15420,
      isFeatured: true,
      tagIds: [tags[0].id, tags[7].id],
    },
    {
      title: 'بناء تطبيقات React الاحترافية',
      description: 'تعلم بناء تطبيقات React حقيقية مع أفضل الممارسات. يشمل Hooks، Context API، وادارة الحالة.',
      categoryId: categories[2].id,
      userId: admin.id,
      duration: 5400,
      views: 8350,
      isFeatured: true,
      tagIds: [tags[1].id],
    },
    {
      title: 'مقدمة في الذكاء الاصطناعي وتعلم الآلة',
      description: 'دورة تمهيدية في الذكاء الاصطناعي وتعلم الآلة. تعرف على المفاهيم الأساسية وكيفية تطبيقها.',
      categoryId: categories[1].id,
      userId: user1.id,
      duration: 4800,
      views: 22100,
      isFeatured: true,
      tagIds: [tags[4].id, tags[7].id],
    },
    {
      title: 'تطوير تطبيقات Next.js الكاملة',
      description: 'تعلم بناء تطبيقات ويب كاملة باستخدام Next.js مع TypeScript وTailwind CSS.',
      categoryId: categories[2].id,
      userId: admin.id,
      duration: 9000,
      views: 6730,
      isFeatured: false,
      tagIds: [tags[3].id, tags[8].id],
    },
    {
      title: 'أساسيات Python للمبتدئين',
      description: 'ابدأ رحلتك في البرمجة مع Python. دورة مصممة خصيصاً للمبتدئين بدون أي خبرة سابقة.',
      categoryId: categories[2].id,
      userId: user1.id,
      duration: 3600,
      views: 31500,
      isFeatured: false,
      tagIds: [tags[2].id, tags[7].id],
    },
    {
      title: 'التسويق الرقمي في 2024',
      description: 'تعلم أحدث استراتيجيات التسويق الرقمي ووسائل التواصل الاجتماعي لتنمية أعمالك.',
      categoryId: categories[3].id,
      userId: user3.id,
      duration: 4200,
      views: 12780,
      isFeatured: false,
      tagIds: [tags[6].id],
    },
    {
      title: 'تصميم واجهات المستخدم UI/UX',
      description: 'تعلم أساسيات ومبادئ تصميم واجهات المستخدم وتجربة المستخدم باستخدام Figma.',
      categoryId: categories[4].id,
      userId: user2.id,
      duration: 5600,
      views: 9430,
      isFeatured: true,
      tagIds: [tags[5].id, tags[7].id],
    },
    {
      title: 'ريادة الأعمال وبناء المشاريع',
      description: 'دليل شامل لبدء مشروعك الخاص. من الفكرة إلى التنفيذ والتسويق.',
      categoryId: categories[5].id,
      userId: user3.id,
      duration: 3200,
      views: 7820,
      isFeatured: false,
      tagIds: [],
    },
    {
      title: 'شروحات تقنية متنوعة',
      description: 'مجموعة من الشروحات التقنية في مختلف المجالات. نصائح وحيل مفيدة للمطورين.',
      categoryId: categories[7].id,
      userId: user1.id,
      duration: 1800,
      views: 4560,
      isFeatured: false,
      tagIds: [tags[9].id],
    },
    {
      title: 'بناء تطبيقات الجوال مع React Native',
      description: 'تعلم بناء تطبيقات الجوال للأندرويد والآيفون باستخدام React Native وExpo.',
      categoryId: categories[2].id,
      userId: admin.id,
      duration: 6800,
      views: 11230,
      isFeatured: false,
      tagIds: [tags[1].id, tags[9].id],
    },
    {
      title: 'أدوات الذكاء الاصطناعي في العمل',
      description: 'كيفية استخدام أدوات الذكاء الاصطناعي مثل ChatGPT لتحسين إنتاجيتك في العمل.',
      categoryId: categories[1].id,
      userId: user1.id,
      duration: 2400,
      views: 28900,
      isFeatured: true,
      tagIds: [tags[4].id],
    },
    {
      title: 'فن التصميم الجرافيكي',
      description: 'تعلم أساسيات التصميم الجرافيكي والألوان والطباعة. دورة عملية مع مشاريع حقيقية.',
      categoryId: categories[4].id,
      userId: user2.id,
      duration: 4100,
      views: 6750,
      isFeatured: false,
      tagIds: [tags[5].id],
    },
  ]

  const videos = []
  for (const vd of videoData) {
    const { tagIds, ...data } = vd
    const slug = data.title
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, '')
      .replace(/\s+/g, '-')
      .concat('-', Date.now().toString(36) + Math.random().toString(36).slice(2, 6))

    const shareCode = await generateUniqueShareCode()
    const video = await prisma.video.create({
      data: {
        ...data,
        slug,
        shareCode,
        isFree: true,
        isPublished: true,
        thumbnail: `https://picsum.photos/seed/${slug.slice(0, 10)}/640/360`,
        videoTags: tagIds.length > 0
          ? { create: tagIds.map((tagId: string) => ({ tagId })) }
          : undefined,
      },
    })
    videos.push(video)
  }

  console.log('✅ Videos created')

  // Create 2 courses with lessons
  const course1 = await prisma.course.create({
    data: {
      title: 'دورة تطوير الويب الشاملة',
      slug: 'full-stack-web-dev',
      description: 'دورة شاملة لتعلم تطوير الويب من الصفر حتى الاحتراف. تشمل HTML, CSS, JavaScript, React, Node.js وقواعد البيانات.',
      thumbnail: 'https://picsum.photos/seed/webdev/640/360',
      price: 49.99,
      currency: 'USD',
      level: 'beginner',
      isPublished: true,
      isFeatured: true,
      categoryId: categories[2].id,
      userId: admin.id,
      courseTags: {
        create: [
          { tagId: tags[0].id },
          { tagId: tags[1].id },
          { tagId: tags[7].id },
        ],
      },
    },
  })

  // Add lessons for course 1
  const course1Lessons = [
    { title: 'مقدمة في تطوير الويب', description: 'نظرة عامة على تطوير الويب والأدوات المطلوبة', order: 1, duration: 1800 },
    { title: 'أساسيات HTML5', description: 'تعلم بنية HTML والعناصر الأساسية', order: 2, duration: 2400 },
    { title: 'تنسيق الصفحات بـ CSS3', description: 'تعلم تنسيق صفحات الويب مع Flexbox وGrid', order: 3, duration: 3600 },
    { title: 'برمجة JavaScript', description: 'المفاهيم الأساسية والبرمجة الكائنية', order: 4, duration: 5400 },
    { title: 'مكتبة React', description: 'بناء واجهات تفاعلية مع React', order: 5, duration: 4800 },
    { title: 'مشروع تطبيقي', description: 'بناء مشروع كامل يدمج كل ما تعلمته', order: 6, duration: 3600 },
  ]

  for (const lesson of course1Lessons) {
    const isFree = lesson.order <= 2
    await prisma.lesson.create({
      data: {
        ...lesson,
        courseId: course1.id,
        isFree,
        videoId: lesson.order <= videos.length ? videos[lesson.order - 1]?.id : null,
      },
    })
  }

  const course2 = await prisma.course.create({
    data: {
      title: 'احتراف التصميم الرقمي',
      slug: 'digital-design-masterclass',
      description: 'تعلم التصميم الرقمي من الأساسيات حتى الاحتراف. يشمل تصميم الشعارات، واجهات المستخدم، والهوية البصرية.',
      thumbnail: 'https://picsum.photos/seed/design/640/360',
      price: 39.99,
      currency: 'USD',
      level: 'beginner',
      isPublished: true,
      isFeatured: true,
      categoryId: categories[4].id,
      userId: user2.id,
      courseTags: {
        create: [
          { tagId: tags[5].id },
          { tagId: tags[7].id },
        ],
      },
    },
  })

  // Add lessons for course 2
  const course2Lessons = [
    { title: 'مبادئ التصميم الأساسية', description: 'تعلم مبادئ التصميم من التوازن والتباين والتسلسل الهرمي', order: 1, duration: 1800 },
    { title: 'نظرية الألوان', description: 'كيفية اختيار الألوان المناسبة وإنشاء لوحات ألوان متناسقة', order: 2, duration: 2400 },
    { title: 'الطباعة والخطوط', description: 'فهم أنواع الخطوط وكيفية استخدامها بفعالية', order: 3, duration: 2000 },
    { title: 'تصميم الشعارات', description: 'خطوات إنشاء شعار احترافي من الفكرة إلى التنفيذ', order: 4, duration: 3200 },
    { title: 'تصميم واجهات التطبيقات', description: 'تصميم واجهات مستخدم جذابة وسهلة الاستخدام', order: 5, duration: 4000 },
    { title: 'مشروع الهوية البصرية', description: 'بناء هوية بصرية كاملة لمشروع وهمي', order: 6, duration: 3600 },
  ]

  for (const lesson of course2Lessons) {
    const isFree = lesson.order <= 2
    await prisma.lesson.create({
      data: {
        ...lesson,
        courseId: course2.id,
        isFree,
        videoId: lesson.order + 5 <= videos.length ? videos[lesson.order + 5]?.id : null,
      },
    })
  }

  console.log('✅ Courses and lessons created')

  // Create sample comments
  const commentData = [
    { content: 'شرح رائع! استفدت كثيراً من هذا الدرس', videoId: videos[0].id, userId: user1.id },
    { content: 'هل يمكنكم عمل فيديو عن TypeScript أيضاً؟', videoId: videos[0].id, userId: user2.id },
    { content: 'ممتاز! أنصح الجميع بمتابعة هذه السلسلة', videoId: videos[2].id, userId: user3.id },
    { content: 'محتوى مفيد جداً، شكراً لكم', videoId: videos[4].id, userId: user1.id },
    { content: 'تم التطبيق بنجاح، شكراً على الشرح الواضح', videoId: videos[6].id, userId: user2.id },
    { content: 'أخيراً وجدت شرح مبسط لهذا الموضوع', videoId: videos[10].id, userId: user3.id },
    { content: 'متى سيكون هناك دورة متقدمة عن هذا الموضوع؟', videoId: videos[3].id, userId: user1.id },
    { content: 'رائع جداً، أنصح به بشدة للمبتدئين', videoId: videos[1].id, userId: user3.id },
  ]

  const comments = []
  for (const cd of commentData) {
    const comment = await prisma.comment.create({ data: cd })
    comments.push(comment)
  }

  // Add a reply comment
  await prisma.comment.create({
    data: {
      content: 'بالتأكيد! سنعمل على دوره TypeScript قريباً',
      videoId: videos[0].id,
      userId: admin.id,
      parentId: comments[1].id,
    },
  })

  console.log('✅ Comments created')

  // Create sample ratings
  const ratingData = [
    { score: 5, videoId: videos[0].id, userId: user1.id },
    { score: 4, videoId: videos[1].id, userId: user2.id },
    { score: 5, videoId: videos[2].id, userId: user3.id },
    { score: 4, videoId: videos[4].id, userId: user1.id },
    { score: 3, videoId: videos[5].id, userId: user2.id },
    { score: 5, videoId: videos[6].id, userId: user3.id },
    { score: 4, videoId: videos[10].id, userId: user1.id },
    { score: 5, videoId: videos[3].id, userId: user2.id },
  ]

  for (const rd of ratingData) {
    await prisma.rating.create({ data: rd })
  }

  console.log('✅ Ratings created')

  // Create some likes
  const likeData = [
    { type: 'like', videoId: videos[0].id, userId: user1.id },
    { type: 'like', videoId: videos[0].id, userId: user2.id },
    { type: 'like', videoId: videos[1].id, userId: user3.id },
    { type: 'dislike', videoId: videos[5].id, userId: user1.id },
    { type: 'like', videoId: videos[2].id, userId: user1.id },
    { type: 'like', videoId: videos[6].id, userId: user2.id },
    { type: 'like', videoId: videos[10].id, userId: user3.id },
    { type: 'like', commentId: comments[0].id, userId: user2.id },
    { type: 'like', commentId: comments[2].id, userId: user1.id },
  ]

  for (const ld of likeData) {
    await prisma.like.create({ data: ld })
  }

  console.log('✅ Likes created')

  // Create saved videos
  await prisma.savedVideo.create({ data: { userId: user1.id, videoId: videos[2].id } })
  await prisma.savedVideo.create({ data: { userId: user1.id, videoId: videos[6].id } })
  await prisma.savedVideo.create({ data: { userId: user2.id, videoId: videos[0].id } })
  await prisma.savedVideo.create({ data: { userId: user3.id, videoId: videos[10].id } })

  console.log('✅ Saved videos created')

  // Create enrollments
  await prisma.enrollment.create({
    data: { userId: user1.id, courseId: course1.id, progress: 45 },
  })
  await prisma.enrollment.create({
    data: { userId: user2.id, courseId: course1.id, progress: 80 },
  })
  await prisma.enrollment.create({
    data: { userId: user3.id, courseId: course2.id, progress: 30 },
  })

  // Create orders for enrollments
  await prisma.order.create({
    data: { userId: user1.id, courseId: course1.id, amount: course1.price, currency: 'USD', status: 'completed', paymentMethod: 'card' },
  })
  await prisma.order.create({
    data: { userId: user2.id, courseId: course1.id, amount: course1.price, currency: 'USD', status: 'completed', paymentMethod: 'paypal' },
  })
  await prisma.order.create({
    data: { userId: user3.id, courseId: course2.id, amount: course2.price, currency: 'USD', status: 'completed', paymentMethod: 'card' },
  })

  console.log('✅ Enrollments and orders created')

  // Create notifications
  await prisma.notification.create({
    data: { userId: user1.id, title: 'مرحباً بك!', message: 'شكراً لتسجيلك في منصة VidVerse', type: 'info' },
  })
  await prisma.notification.create({
    data: { userId: user2.id, title: 'كورس جديد!', message: 'تم إضافة كورس جديد في التصميم', type: 'info', link: `/courses/${course2.id}` },
  })

  console.log('✅ Notifications created')

  // Create activities
  await prisma.activity.create({
    data: { type: 'register', userId: user1.id, metadata: '{}' },
  })
  await prisma.activity.create({
    data: { type: 'enroll', userId: user1.id, metadata: JSON.stringify({ courseId: course1.id }) },
  })

  console.log('✅ Activities created')
  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
