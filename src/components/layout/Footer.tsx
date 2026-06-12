'use client'

import { Play, Mail, MapPin, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-auto bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl gradient-emerald-teal flex items-center justify-center">
                <Play className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-white">VidVerse</span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              مجتمع الفيديو الأكثر تطوراً - شارك وتعلم من أفضل الفيديوهات والدورات التعليمية باللغة العربية.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              {['الرئيسية', 'الفيديوهات', 'الكورسات', 'التصنيفات', 'الأكثر مشاهدة'].map((item) => (
                <li key={item}>
                  <button className="text-sm text-stone-400 hover:text-emerald-400 transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4">التصنيفات</h3>
            <ul className="space-y-2">
              {['البرمجة', 'التصميم', 'التسويق', 'الأعمال', 'التصوير'].map((item) => (
                <li key={item}>
                  <button className="text-sm text-stone-400 hover:text-emerald-400 transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">تواصل معنا</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-stone-400">
                <Mail className="h-4 w-4 text-emerald-400" />
                <span>info@vidverse.com</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-stone-400">
                <Phone className="h-4 w-4 text-emerald-400" />
                <span>+966 50 123 4567</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-stone-400">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>الرياض، المملكة العربية السعودية</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-stone-500">
            © {new Date().getFullYear()} VidVerse. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4">
            <button className="text-sm text-stone-500 hover:text-stone-300 transition-colors">سياسة الخصوصية</button>
            <button className="text-sm text-stone-500 hover:text-stone-300 transition-colors">الشروط والأحكام</button>
          </div>
        </div>
      </div>
    </footer>
  )
}
