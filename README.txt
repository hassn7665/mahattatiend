محطاتي — النسخة المرتبطة بقاعدة بيانات (Supabase)

1) قاعدة البيانات: شغّل supabase/schema.sql في Supabase (SQL Editor)، ثم أنشئ مستخدم المدير:
   Authentication > Users > Add user: البريد oil@mahattati.app + كلمة المرور التي تختارها (Auto Confirm)،
   ثم شغّل سطر INSERT الموجود في آخر schema.sql لتحويله إلى مدير باسم oil.
   كلمة المرور تُكتب في لوحة Supabase فقط، ولا تُكتب في أي ملف من ملفات المشروع.
2) الربط: افتح js/config.js وضع Project URL ومفتاح anon العام بين علامتي الاقتباس. لا تضع service_role.
3) النشر: ارفع كل الملفات إلى GitHub Pages / Cloudflare Pages، وارفع sw.js مع أي تحديث.
4) الدخول: اسم المستخدم oil وكلمة المرور التي أنشأتها. من لوحة المدير أنشئ المحطات وحسابات أصحابها.

الهيكل: index.html | css/style.css | js/config.js (الإعدادات) | js/core.js | js/i18n.js | js/db.js (الاتصال بقاعدة البيانات)
| js/views.js | js/auth.js | js/app.js | sw.js | manifest.json | supabase/schema.sql | build.py
