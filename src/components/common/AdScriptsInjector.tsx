"use client";

import { useEffect } from "react";

/**
 * AdScriptsInjector
 * يقوم بجلب شبكات الإعلانات المُفعّلة من /api/ads/active ويحقن سكربتاتها
 * في الموقع حسب مكان الحقن المحدد لكل شبكة (head / body-start / body-end).
 *
 * يدعم نوعين من السكربتات:
 *  - "external": سكربت خارجي بـ src (مع async/defer/data-cfasync)
 *  - "inline":   سكربت مضمّن بـ textContent (async/defer لا تنطبق)
 *
 * مهم: عند إلغاء تركيب المكوّن (unmount)، تتم إزالة جميع السكربتات المحقونة
 * من الـ DOM. هذا يمنع تسرب الإعلانات إلى صفحات أخرى (مثل لوحة الإدارة)
 * في تطبيق الصفحة الواحدة (SPA).
 *
 * السكربت الخام يُحقن كما هو — شركة الإعلانات نفسها (Monetag, 5gvci ...)
 * تقرّر أين وكيف يظهر الإعلان عبر ملف السكربت الخاص بها (vignette.min.js ...).
 */
interface AdNetwork {
  id: string;
  name: string;
  type: string; // "external" | "inline"
  scriptUrl: string | null;
  inlineScript: string | null;
  async: boolean;
  defer: boolean;
  cfAsync: boolean;
  placement: string; // head | body-start | body-end
  order: number;
}

export function AdScriptsInjector() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    // تتبّع السكربتات التي أنشأناها لإزالتها عند unmount
    const createdScripts: HTMLScriptElement[] = [];

    async function injectAds() {
      try {
        const res = await fetch("/api/ads/active", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const networks: AdNetwork[] = data.networks || [];
        if (cancelled || networks.length === 0) return;

        // Sort by order ascending
        networks.sort((a, b) => a.order - b.order);

        for (const network of networks) {
          // منع التكرار: إذا السكربت موجود بالفعل، نتخطاه
          const existing = document.querySelector(
            `script[data-ad-network-id="${network.id}"]`
          );
          if (existing) continue;

          const script = document.createElement("script");

          // تعيين المحتوى حسب النوع
          if (network.type === "inline" && network.inlineScript) {
            // السكربتات المضمّنة: نضع الكود في textContent
            // نزيل وسوم <script> و </script> إذا تم لصقها بالكامل
            let code = network.inlineScript.trim();
            code = code.replace(/^<script\b[^>]*>/i, "").replace(/<\/script>\s*$/i, "").trim();
            if (!code) continue;
            script.textContent = code;
          } else if (network.type === "external" && network.scriptUrl) {
            script.src = network.scriptUrl;
            script.async = network.async;
            script.defer = network.defer;
          } else {
            continue;
          }

          script.setAttribute("data-ad-network-id", network.id);
          script.setAttribute("data-ad-name", network.name);
          if (network.cfAsync) {
            script.setAttribute("data-cfasync", "false");
          }

          // مكان الحقن
          let container: HTMLElement | null = null;
          if (network.placement === "head") {
            container = document.head;
          } else if (network.placement === "body-start") {
            container = document.body;
            if (container.firstChild) {
              container.insertBefore(script, container.firstChild);
              createdScripts.push(script);
              continue;
            }
          } else if (network.placement === "body-end") {
            container = document.body;
          } else {
            container = document.head;
          }

          container.appendChild(script);
          createdScripts.push(script);
        }
      } catch (error) {
        console.warn("Ad scripts injection failed:", error);
      }
    }

    // الحقن في أقرب وقت ممكن — بمجرد أن يكون DOM جاهزاً.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", injectAds, { once: true });
    } else {
      injectAds();
    }

    return () => {
      cancelled = true;
      // إزالة جميع السكربتات التي حقنها هذا المكوّن عند إلغاء التركيب.
      // هذا يمنع تسرب الإعلانات إلى صفحات أخرى (لوحة الإدارة، الرئيسية ...).
      for (const script of createdScripts) {
        try {
          script.remove();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return null;
}
