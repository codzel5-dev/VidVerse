'use client'

import { Play, Mail, MapPin, Phone, Sparkles, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-auto relative overflow-hidden">
      {/* Top aurora divider */}
      <div className="cosmic-divider" />
      
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.08_0.02_280)] via-[oklch(0.06_0.03_280)] to-[oklch(0.05_0.02_280)]" />
      <div className="absolute inset-0 aurora-bg opacity-30" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-2xl gradient-aurora flex items-center justify-center">
                <Play className="h-4.5 w-4.5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-gradient-aurora">VidVerse</span>
            </div>
            <p className="text-sm text-[oklch(0.55_0.04_280)] leading-relaxed mb-4">
              مجتمع الفيديو الأكثر تطوراً — شارك وتعلم من أفضل الفيديوهات والدورات التعليمية باللغة العربية.
            </p>
            <div className="flex items-center gap-2 badge-aurora rounded-full px-3 py-1.5 w-fit">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">منصة متطورة</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-lg">روابط سريعة</h3>
            <ul className="space-y-3">
              {['الرئيسية', 'الفيديوهات', 'الكورسات', 'التصنيفات', 'الأكثر مشاهدة'].map((item) => (
                <li key={item}>
                  <button className="text-sm text-[oklch(0.55_0.04_280)] hover:text-[oklch(0.827_0.165_303.9)] transition-colors duration-300">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-lg">التصنيفات</h3>
            <ul className="space-y-3">
              {['البرمجة', 'التصميم', 'التسويق', 'الأعمال', 'التصوير'].map((item) => (
                <li key={item}>
                  <button className="text-sm text-[oklch(0.55_0.04_280)] hover:text-[oklch(0.815_0.183_192.5)] transition-colors duration-300">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-5 text-lg">تواصل معنا</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-[oklch(0.55_0.04_280)]">
                <div className="w-8 h-8 rounded-lg bg-[oklch(0.627_0.265_303.9_/_0.1)] flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-[oklch(0.727_0.165_303.9)]" />
                </div>
                <span>info@vidverse.com</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[oklch(0.55_0.04_280)]">
                <div className="w-8 h-8 rounded-lg bg-[oklch(0.715_0.183_192.5_/_0.1)] flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-[oklch(0.815_0.183_192.5)]" />
                </div>
                <span>+966 50 123 4567</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[oklch(0.55_0.04_280)]">
                <div className="w-8 h-8 rounded-lg bg-[oklch(0.645_0.246_16.4_/_0.1)] flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-[oklch(0.745_0.166_16.4)]" />
                </div>
                <span>الرياض، المملكة العربية السعودية</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="cosmic-divider mt-10" />

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[oklch(0.45_0.03_280)]">
            © {new Date().getFullYear()} VidVerse. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-1 text-sm text-[oklch(0.45_0.03_280)]">
            <span>صُنع بـ</span>
            <Heart className="h-3.5 w-3.5 text-[oklch(0.645_0.246_16.4)] fill-[oklch(0.645_0.246_16.4)]" />
            <span>للمجتمع العربي</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-sm text-[oklch(0.45_0.03_280)] hover:text-[oklch(0.7_0.04_280)] transition-colors">سياسة الخصوصية</button>
            <button className="text-sm text-[oklch(0.45_0.03_280)] hover:text-[oklch(0.7_0.04_280)] transition-colors">الشروط والأحكام</button>
          </div>
        </div>
      </div>
    </footer>
  )
}
