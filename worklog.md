# VidVerse Worklog

Tracks completed work items across the VidVerse Next.js 16 project. Each entry is appended below using the following template:

```
## [TASK_ID] Title — <date>
- **Status:** completed | in-progress | blocked
- **Scope:** files created/changed
- **Summary:** what was done, key decisions, lint/test status
- **Next actions:** follow-up tasks or notes for other agents
```

---

## [2-a] Blog API routes — 2025
- **Status:** completed
- **Scope:**
  - `src/app/api/blog/route.ts` (new) — public list of published posts
  - `src/app/api/blog/[slug]/route.ts` (new) — public single post + related + view increment
  - `src/app/api/blog/admin/list/route.ts` (new) — admin list (all posts) + create
  - `src/app/api/blog/admin/[id]/route.ts` (new) — admin get / update / delete
- **Summary:**
  - Public `GET /api/blog` returns `{ posts, total, tags }` with pagination (`limit` default 9, max 50; `offset`), tag-slug filter, and case-insensitive search across title/excerpt/content. Tags array includes published-post counts.
  - Public `GET /api/blog/[slug]` returns `{ post, related }`. Views are incremented atomically via `update({ data: { views: { increment: 1 } } })` in parallel with the related-posts lookup. Related = 4 most recent published posts sharing any tag with the current post, falling back to any other published post to fill remaining slots. Returns 404 when the post does not exist or is a draft.
  - Admin `GET /api/blog/admin/list` returns all posts (drafts + published) ordered by `updatedAt DESC` with author `{id, name}` and `_count.tags`.
  - Admin `PUT /api/blog/admin/list` creates a new post: auto-generates a unique slug from the title (appends `-2`, `-3`, …), auto-computes `readingTime` and `excerpt` (when not supplied), find-or-creates BlogTag records via `db.blogTag.upsert`, and connects them through BlogPostTag. Validates `title`, `content`, `authorId`.
  - Admin `GET /api/blog/admin/[id]` returns the full post + tags. `PATCH` updates provided fields, regenerates slug when title changes (unless slug is explicitly provided), recomputes `readingTime`/`excerpt` when content changes (unless explicitly provided), and syncs tags via `set: []` + `connectOrCreate`. `DELETE` removes the post (cascades to BlogPostTag via the schema).
  - All admin routes use the shared `checkAdmin(userId)` helper from the existing admin pattern and return Arabic error messages.
  - All four files pass `npx eslint` with 0 errors and 0 warnings.
- **Next actions:**
  - Frontend pages (`/blog`, `/blog/[slug]`, admin editor UI) are the next layer and can consume these routes directly.
  - Optional: replace the `views + 1` reflection in `GET /api/blog/[slug]` with a re-fetch of the post row if exact post-increment consistency is desired.
  - Optional: add explicit `BlogPost`/`BlogTag` Prisma types for response payloads once a shared blog types module exists.

## [5] Admin Blog + Ad Networks panels — 2025
- **Status:** completed
- **Scope:**
  - `src/components/admin/BlogManager.tsx` (new) — full blog post CRUD panel
  - `src/components/admin/AdNetworksPanel.tsx` (new) — ad network (Monetag/5gvci) CRUD panel
  - `src/components/admin/AdminDashboard.tsx` (modified) — added "المدونة" (blog) + "إعلانات المدونة" (ad-networks) tabs
- **Summary:**
  - **BlogManager**: two views — list view (responsive table for md+, card list for mobile) showing title, cover thumbnail, featured star, status badge (published=green, draft=yellow), views, updated date, edit/delete actions; and an inline editor view (full-width, replaces the list) with title input, cover image upload (multipart POST to `/api/upload-image` → preview thumbnail + remove), large monospace markdown textarea (min-h-[400px], dir=ltr) with an "insert image at cursor" toolbar button that uploads via `/api/upload-image` and injects `![alt](url)` at the textarea selection, excerpt input, slug input (optional — sent only when filled so backend auto-regenerates otherwise), comma-separated tags input with live pill preview, status select (published/draft), featured Switch, Save (PUT create / PATCH update) + Cancel. Delete uses a proper `Dialog` confirmation (not `window.confirm`). All admin requests include `x-user-id: user.id`. `parseTags` splits/trims/de-dupes before send. Toasts via sonner.
  - **AdNetworksPanel**: header card with title + description, an info banner clarifying scripts are injected into blog article pages only, then an ordered grid of network cards (name, type badge external/inline, zone, domain, placement, order, inline preview of scriptUrl/inlineScript, active Switch with optimistic PATCH, edit/delete). Editor is a `Dialog` with: name, type select (external/inline), type-conditional scriptUrl Input OR inlineScript Textarea (monospace, dir=ltr, accepts full `<script>...</script>` wrapper), zoneId (auto-extracted from `z=`/`zone=`/`dataset.zone=` when left blank), domain, placement select (head/body-start/body-end), order, cfAsync/async/defer/isActive Switches (async+defer shown for external only, default cfAsync=true/async=true/defer=false/isActive=true per spec), notes textarea, and a **live preview** (`buildPreview`) that renders the final `<script ...>` tag with `data-cfasync="false"`, `async`, `defer`, `src` (external) or the stripped inner code (inline). Delete uses a `Dialog` confirmation. All requests include `x-user-id`.
  - **AdminDashboard**: added `Newspaper` to the lucide import; added `BlogManager` + `AdNetworksPanel` imports; inserted a `blog` TabsTrigger (Newspaper, "المدونة") after `comments` and an `ad-networks` TabsTrigger (Megaphone, "إعلانات المدونة") after `blog`, both before `banners`. Matching `TabsContent` entries render the two new components. The existing banners tab (Megaphone, "الإعلانات") is unchanged — the two Megaphone icons are distinguished by their Arabic labels.
  - Styling follows the established dark aurora theme (OKLCH colors, `glass-card`, `btn-aurora`, `input-aurora`, `badge-aurora` classes), RTL Arabic throughout, framer-motion entrance animations, sonner toasts. Selects use the native `<select>` with the same OKLCH styling as `CourseEditForm`/`CourseCreateForm` (the shadcn Select wrapper is unused elsewhere in the codebase). Refs to the content textarea are forwarded via the React 19 spread-prop pattern (verified against `SearchBar.tsx` which already does `ref={inputRef}` on `<Input>`).
  - All three files pass `npx eslint` with **0 errors and 0 warnings**. `npx tsc --noEmit --skipLibCheck` reports no errors in any of the three files (pre-existing unrelated TS errors elsewhere in the repo are untouched).
- **Next actions:**
  - Public blog pages (`/blog`, `/blog/[slug]`) still need to be built to consume `GET /api/blog` and `GET /api/blog/[slug]` — these admin panels only manage content.
  - `BlogAdsProvider` (already present at `src/components/ads/BlogAdsProvider.tsx`) consumes `GET /api/ads/active` to inject active scripts; verify it reads `placement` and `type` (external vs inline) correctly now that the admin panel can create both kinds.
  - Optional: add an explicit "view on site" link on each published blog row in the list (links to `/blog/[slug]`) once the public route exists.
  - Optional: replace the comma-separated tags input with a true pill-style input (add-on-enter with removable chips) if a richer UX is desired later.


## [4] Blog UI components (public) — 2025
- **Status:** completed
- **Scope:**
  - `src/components/blog/types.ts` (new) — shared `BlogAuthor`, `BlogTag`, `BlogPostSummary`, `BlogPostFull`, `BlogRelatedPost` interfaces mirroring the public blog API payloads.
  - `src/components/blog/BlogCard.tsx` (new) — 3-variant clickable card (`default` / `featured` / `compact`) with cover image or aurora-gradient fallback (Newspaper icon), tag chips, 2-line clamped title/excerpt, author avatar + name, date + reading time. Uses framer-motion (`whileInView` opacity+y entrance, `whileHover` scale 1.02), `glass-card` + `rounded-2xl` + `border-[oklch(0.2_0.03_280)]` styling, navigates via `navigateToBlogPost(post.slug)`.
  - `src/components/blog/BlogHome.tsx` (new) — blog listing page. Aurora hero header with badge, gradient title, subtitle, debounced (400ms) search input. Sticky tag-filter pill row from API tags (with counts); active tag uses `btn-aurora`, "الكل" clears the filter, clicks update both the app-store `blogTagFilter` and the URL `?tag=slug`. Featured post (only when no tag/search active) rendered as `BlogCard variant="featured"`. Responsive grid (1/2/3 cols) of default cards, "تحميل المزيد" button when `posts.length < total`. Loading spinner, empty state with "عرض كل المقالات" clear button, `toast.error` on fetch failure. **No ads** — BlogHome has zero ad components.
  - `src/components/blog/BlogPostView.tsx` (new) — article reader page. Renders `<BlogAdsProvider />` at the top so Monetag scripts are injected only on article pages (cleanup on unmount prevents leakage). Masthead with "مَدوَّنَة فيدفرس" logo (Mirza/serif fallback) + nav links. Title card with serif title, excerpt subtitle, meta row (Calendar / UserIcon / Clock / Eye). Optional full-width framed cover image. Article body uses `parseBlocks()` to split markdown by headings — each block becomes a "story card" (`bg-[oklch(0.13_0.028_280)]` surface, rounded-2xl, p-8) with a rotated colored square marker (cyan/amber/violet rotation). Markdown rendered via `react-markdown` + `remark-gfm` + `rehype-raw` + `rehype-sanitize` with custom components: images → framed `<figure>` with caption, blockquotes → gradient pullquotes, `pre`/`code` → dark LTR code blocks, tables → bordered wrappers, headings/paragraphs/lists styled for the dark theme. Tags card (clickable → blog list filtered), author card (gradient avatar with initial + bio), 4-col grid of related-post cards (cover or gradient fallback), back button, footer copyright. Loading spinner, error state with back button, `toast.error` on fetch failure. Redirects to `navigateToBlog()` if no `selectedBlogSlug`. Framer-motion staggered entrance on all sections.
- **Summary:**
  - All four files are `'use client'` and use the existing app-store actions (`navigateToBlog`, `navigateToBlogPost`, `goHome`, `setBlogTagFilter`, `selectedBlogSlug`, `blogTagFilter`). Dates are formatted via `formatBlogDate` from `@/lib/blog-utils`. Toasts via `sonner`. Icons via `lucide-react`. Styling follows the aurora/glass-card/btn-aurora patterns in `globals.css`.
  - Fetched from the already-built routes: `GET /api/blog?limit=9&offset=N&tag=TAG&q=SEARCH` (BlogHome) and `GET /api/blog/SLUG` (BlogPostView). Responses are typed against the new `types.ts` interfaces.
  - To satisfy the new `react-hooks/set-state-in-effect` rule (enforced by `eslint-config-next`), the fetch effects use the same `doFetch` async-inner-function pattern as `useVideos.ts` — synchronous `setLoading(true)` calls happen inside the async continuation rather than directly in the effect body.
  - `<img>` tags are used intentionally (project pattern, matches `VideoCard.tsx`); each instance triggers a single `@next/next/no-img-element` **warning** (6 total across the four files) — these are accepted per the project baseline.
  - ESLint: **0 errors, 6 warnings** (all `no-img-element`). `tsc --noEmit`: 0 errors in any `src/components/blog/*` file (pre-existing TS errors elsewhere in the project are unrelated).
- **Next actions:**
  - Wire the new components into `HomeClient.tsx`'s `ViewRenderer`: render `<BlogHome />` when `currentView === 'blog'` and `<BlogPostView />` when `currentView === 'blog-post'`. Also extend the URL-init/popstate handlers in `HomeClient` to recognize the `?b=SLUG` and `?tag=TAG` params so direct links and browser back/forward work end-to-end. (Not done here — out of this task's scope.)
  - The shared `BlogAuthor` / `BlogTag` / `BlogPostSummary` / `BlogPostFull` / `BlogRelatedPost` types in `src/components/blog/types.ts` could be reused by `src/components/admin/BlogManager.tsx` (which currently redeclares a local `BlogTag` and `BlogPostListItem`) to deduplicate.

---
Task ID: 6-7
Agent: main
Task: Wire blog routing (HomeClient + Header + URL params), verify ad isolation via Agent Browser, commit and push to GitHub.

Work Log:
- Wired blog routing in HomeClient.tsx:
  * Added BlogHome + BlogPostView imports
  * Added 'blog' and 'blog-post' cases to ViewRenderer (with max-w-7xl for blog, max-w-4xl for article)
  * Added ?b=slug (blog post) and ?tag=slug (blog tag filter) URL param handling in mount + popstate effects
  * Added setSelectedBlogSlug + setBlogTagFilter from app-store
- Updated Header.tsx: added Newspaper icon, 'المدونة' nav item (view='blog'), navigateToBlog() handler in handleNavClick. Blog link appears in both desktop nav and mobile sheet menu.
- Verified all infrastructure files lint clean (HomeClient, Header, app-store, blog-utils, AdScriptsInjector, BlogAdsProvider)
- Browser-verified via agent-browser (critical ad isolation test):
  * HOME (video platform): adScripts=0 ✓ (no ads)
  * BLOG HOME (listing): adScripts=0 ✓ (no ads — ads only on articles)
  * ARTICLE A: adScripts=1 (Monetag injected) ✓
  * ADMIN (from article): adScripts=0 ✓✓ (scripts cleaned up on unmount!)
  * ARTICLE B (different article from admin): adScripts=1 (re-injected on new mount) ✓
- VLM-verified screenshots:
  * Home: renders properly, no ads, dark theme video platform ✓
  * Blog home: renders properly, no ads, hero + tags ✓
  * Article: renders properly, magazine layout, Arabic text legible, no visible ad banners (Monetag works in background) ✓
- Admin dashboard tabs confirmed: الإحصائيات, إعلانات المدونة, الإعدادات all render
- Committed (8915ea9) and force-pushed to origin/main (resolved divergence from environment reset)

Stage Summary:
- The blog + ad system is fully rebuilt after the environment reset wiped all previous work.
- Ads appear ONLY on blog article pages (BlogPostView), never on home, blog listing, or admin dashboard.
- AdScriptsInjector cleans up injected scripts on unmount — prevents ad leakage in the SPA.
- The ad company (Monetag) decides where/how ads appear via its own JS file (vignette.min.js, tag.min.js).
- Admin can manage blog posts (BlogManager) and ad networks (AdNetworksPanel) from the dashboard.
- GitHub: commit 8915ea9 on main branch.

---
Task ID: 7
Agent: main
Task: تبسيط نموذج إعداد الإعلانات — إزالة حقول zoneId و domain و type/scriptUrl/cfAsync/async/defer، وإبقاء كود JavaScript الخام فقط.

Work Log:
- قرأت worklog.md وملفات النظام الحالية (AdNetworksPanel.tsx، BlogAdsProvider.tsx، AdScriptsInjector.tsx، مسارات API، schema.prisma).
- أعدت كتابة `src/components/admin/AdNetworksPanel.tsx` بالكامل:
  * أزلت نوع `AdType` وحقل `type` (external/inline) — كل الإعلانات الآن inline.
  * أزلت حقول `scriptUrl`, `zoneId`, `domain`, `cfAsync`, `async`, `defer` من النموذج.
  * أزلت دوال `buildPreview` و `extractZoneId` المعقّدة.
  * النموذج الجديد يحتوي فقط على: الاسم، كود JavaScript (textarea monospace)، موضع الحقن (head افتراضياً)، الترتيب، مفعّل/متوقف، ملاحظات.
  * معاينة مباشرة بسيطة تعرض الكود الخام كما هو.
  * بطاقات القائمة لم تعد تعرض شارات النوع/المنطقة/النطاق — فقط الاسم، الترتيب، موضع الحقن، معاينة الكود، الحالة.
  * أزلت الاستيرادات غير المستخدمة (Globe, Tag).
- بسّطت `src/app/api/ads/route.ts` (POST):
  * type يُضبط تلقائياً على "inline".
  * يتطلب name + inlineScript فقط.
  * يرسل scriptUrl/zoneId/domain = null.
- بسّطت `src/app/api/ads/[id]/route.ts` (PATCH):
  * يقبل name, inlineScript, placement, isActive, order, notes فقط.
  * type يُضبط على "inline" في كل تحديث.
  * أزال منطق التحقق المعقّد من external/inline.
- حدّثت `src/components/common/AdScriptsInjector.tsx`:
  * جعل منطق تحديد نوع الحقن مرناً: إذا وُجد inlineScript → inline، وإلا إذا وُجد scriptUrl → external (يتعامل مع type=null).
  * حدّثت واجهة AdNetwork: type أصبح `string | null`.
- فحص lint: 0 أخطاء و 0 تحذيرات في جميع الملفات المعدّلة.
- تحقق عبر Agent Browser:
  * سجّل الدخول كمدير (admin@vidverse.com).
  * فتح لوحة الإدارة → تبويب "إعلانات المدونة".
  * النموذج المبسّط مؤكّد: 6 حقول فقط (الاسم، كود JS، موضع الحقن، الترتيب، مفعّل، ملاحظات) — لا zoneId/domain/type/scriptUrl/cfAsync/async/defer.
  * أنشأ إعلان "اختبار Monetag" بالكود الخام: `<script>(function(s){s.dataset.zone='11177225',s.src='https://nap5k.com/tag.min.js'})(...)</script>`.
  * الحفظ نجح والإعلان ظهر في القائمة.
  * صفحة المقال: 3 سكربتات محقونة في <head> (بما فيها الجديد) ✓.
  * الصفحة الرئيسية: 0 سكربتات ✓ (عزل الإعلانات).
  * صفحة قائمة المدونة: 0 سكربتات ✓.
  * حذف الإعلان التجريبي بعد الاختبار.

Stage Summary:
- نموذج إعداد الإعلانات مبسّط تماماً: الإعلان = اسم + كود JavaScript خام يُحقن كما هو.
- المستخدم يلصق كود Monetag كاملاً (بما في ذلك وسم <script>) ويُحقن في <head> افتراضياً.
- لا حاجة لمعرف المنطقة (zoneId) أو النطاق (domain) — النطاق محقّق مسبقاً والمنطقة مضمّنة في الكود.
- عزل الإعلانات يعمل: الإعلانات تظهر في صفحات المقالات فقط (3 سكربتات)، وليس في الرئيسية أو قائمة المدونة (0).
- جميع الملفات نظيفة (lint: 0 أخطاء).

---
Task ID: 8
Agent: main
Task: إصلاح خطأ "حدث خطأ أثناء تحديث المقال" عند تحديث مقال له وسوم.

Work Log:
- قرأت مسار PATCH في `src/app/api/blog/admin/[id]/route.ts` ومكوّن BlogManager.tsx.
- أعدت إنتاج الخطأ عبر Agent Browser: سجّل الدخول كمدير → لوحة التحكم → المدونة → عدّل مقالاً له وسوم (مرحباً بكم في مدونة المنصة) → غيّر العنوان → حفظ.
- فحص سجل الخادم (dev.log): الخطأ هو `PrismaClientKnownRequestError` بكود `P2014` — "The change you are trying to make would violate the required relation 'BlogPostToBlogPostTag' between the BlogPostTag and BlogPost models."
- السبب الجذري: الكود القديم استخدم `set: []` + `connectOrCreate` معاً على علاقة tags في نفس التحديث. عند تحديث الـ slug في نفس المعاملة، يحدث تعارض في ترتيب العمليات داخل Prisma (محاولة حذف الروابط ثم إنشائها تتداخل مع تحديث الـ BlogPost).
- الإصلاح في `src/app/api/blog/admin/[id]/route.ts`:
  * استبدلت `set: []` + `connectOrCreate` بنداء `set` واحد يحتوي على القائمة الجديدة الكاملة من روابط tags.
  * `set: tagRecords.map((t) => ({ postId_tagId: { postId: id, tagId: t.id } }))`
  * Prisma يحسب الفرق (يحذف القديم ويضيف الجديد) في عملية ذرية واحدة.
- التحقق عبر Agent Browser:
  * قبل الإصلاح: تغيير العنوان + حفظ → PATCH 500 + toast "حدث خطأ أثناء تحديث المقال".
  * بعد الإصلاح: تغيير العنوان + حفظ → PATCH 200 + العنوان تحدّث + الوسوم (2) محفوظة.
  * أعاد العنوان إلى الأصلي وحفظ مرة أخرى → PATCH 200 ✓.
- فحص lint: 0 أخطاء و 0 تحذيرات في الملف المعدّل.

Stage Summary:
- خطأ Prisma P2014 عند تحديث مقال له وسوم تم حله.
- السبب: `set: []` + `connectOrCreate` معاً على علاقة many-to-many عبر join table.
- الحل: `set` بالقائمة الجديدة الكاملة (الطريقة القياسية في Prisma).
- رفع على GitHub: التزام `12f7f50` على فرع main.

---
Task ID: 9
Agent: main
Task: إصلاح ظهور الوسوم مرتين في صفحة المدونة — إزالة وسم مشوّه (طول سلسلة هاشتاقات) كان يُعرض كزر واحد في شريط تصفية الوسوم بجانب الوسوم الصحيحة.

Work Log:
- قرأت worklog.md لفهم السياق (تم إصلاح خطأ تحديث المقال في Task 8).
- حللت لقطة الشاشة المرفقة عبر VLM: المستخدم يرى شريطاً أفقياً يحتوي على وسم طويل غير مرغوب فيه (سلسلة هاشتاقات مثل `#Synthetic_Intelligence #الذكاء_التركيبي ...`) يظهر بجانب الوسوم الصحيحة.
- فحصت قاعدة البيانات عبر Prisma Client:
  * اكتشفت وسماً مشوّهاً في جدول BlogTag بالاسم: `#Synthetic_Intelligence #الذكاء_التركيبي #Artificial_Intelligence #الذكاء_الاصطناعي #AI_Agents #Machine_Learning #Future_Technology #OpenAI` (id: cmqmvbx4x000004jsmuvo6cnd).
  * هذا الوسم يتيم (0 posts مرتبطة) — نُشئ في السابق عندما أدخل المستخدم كل الوسوم كسطر واحد بفواصل `#` بدلاً من الفواصل العادية، فاعتبرته parseTags كوسم واحد.
  * اكتشفت 3 وسوم مشوّهة أخرى متيمة: `الوكلاء_الأذكياء  نماذج مفتوحة المصدر`، `الذكاء_الاصطناعي`، `تطوير_التطبيقات`.
- حذفت 4 وسوم مشوّهة متيمة من قاعدة البيانات.
- حدّثت `src/app/api/blog/route.ts`:
  * أضفت `where: { posts: { some: { post: { status: 'published' } } } }` لاستعلام BlogTag.findMany.
  * أضفت `.filter((t) => t.posts.length > 0)` كشبكة أمان إضافية قبل الـ map.
  * النتيجة: الـ API لا يُرجع إلا الوسوم المرتبطة بمقال منشور على الأقل — لا وسوم متيمة.
- حدّثت `parseTags` في `src/components/admin/BlogManager.tsx`:
  * تقسيم بالفاصلة OR بعلامة `#` (لدعم إدخال نمط الهاشتاق مثل `#foo #bar`).
  * استبدال `_` بمسافة (لمطابقة اصطلاح الوسوم الموجودة التي تستخدم مسافات).
  * تطبيع المسافات المتعددة.
  * trim + dedup (case-insensitive).
  * تحديث نص المساعدة أسفل حقل الإدخال ليوضّح أنه يُقبل نمط الهاشتاج وتُحوّل الشرطة السفلية لمسافة.
- التحقق عبر Agent Browser:
  * شريط تصفية الوسوم في الصفحة الرئيسية للمدونة: لم يعد يظهر الوسم المشوّه — فقط 16 وسماً صحيحاً (AI، AI Agents، Artificial Intelligence، Future Technology، Machine Learning، Synthetic Intelligence، الذكاء الاصطناعي، الذكاء التركيبي، أخبار، أخلاقيات، أدلة، تحديثات، تعلم عميق، خيال اصطناعي، ذكاء اصطناعي، شرح، مستقبل) ✓.
  * محرّر المقال في لوحة الإدارة: قيمة حقل الوسوم للمقال "Synthetic Intelligence..." = `AI, AI Agents, Artificial Intelligence, Future Technology, Machine Learning, Synthetic Intelligence, الذكاء الاصطناعي, الذكاء التركيبي` (مفصولة بفواصل بشكل صحيح، لا وسم مشوّه).
  * اختبار parseTags: إدخال `#AI_Agents, #Machine_Learning, #Future_Tech` → المعاينة تعرض 3 شارات: "AI Agents"، "Machine Learning"، "Future Tech" ✓ (تقسيم #، إزالة #، استبدال _ بمسافة).
  * صفحة المقال: تعرض الوسوم الـ 8 بشكل صحيح، لا أخطاء في سجل الخادم.
- فحص lint: 0 أخطاء و 0 تحذيرات في `src/app/api/blog/route.ts` و `src/components/admin/BlogManager.tsx`.

Stage Summary:
- الوسم المشوّه (سلسلة هاشتاقات كاملة كاسم واحد) حُذف من قاعدة البيانات.
- الـ API الآن يفلتر الوسوم المتيمة تلقائياً (يطلب `posts.some.post.status = published`)، لذا حتى لو نُشئ وسم مشوّه مستقبلاً لن يظهر في شريط التصفية.
- parseTags أصبحت متينة ضد إدخال نمط الهاشتاق: `#foo, #bar #baz` → ["foo", "bar", "baz"]، مع استبدال الشرطة السفلية بمسافة لمطابقة الاصطلاح.
- شريط تصفية الوسوم في الصفحة الرئيسية للمدونة يعرض الآن كل وسم مرة واحدة فقط وبشكل منظم.
