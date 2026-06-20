'use client'

import { AdScriptsInjector } from '@/components/common/AdScriptsInjector'

/**
 * BlogAdsProvider
 * يحقن سكربتات شركات الإعلانات المُفعّلة في صفحات المقالات فقط.
 *
 * - يُستخدم داخل BlogPostView (صفحة المقال) فقط — NOT in BlogHome, NOT in admin.
 * - يقوم AdScriptsInjector بجلب الشبكات من /api/ads/active وحقن أكوادها الخام
 *   كما هي (external src أو inline IIFE) دون أي تحديد لأماكن ظهور الإعلان.
 * - شركة الإعلانات نفسها (Monetag / 5gvci ...) تقرّر أين وكيف يظهر الإعلان
 *   عبر ملف السكربت الخاص بها (vignette.min.js / push / native ...).
 * - عند مغادرة صفحة المقال، يزيل AdScriptsInjector السكربتات المحقونة
 *   تلقائياً (cleanup on unmount) حتى لا تظهر الإعلانات في لوحة الإدارة
 *   أو أي صفحة أخرى.
 */
export default function BlogAdsProvider() {
  return <AdScriptsInjector />
}
