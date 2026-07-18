# الدليل التفصيلي لقراءة مشروع Marketly AI

> هذا الملف يشرح ما هو موجود **فعلياً** في المستودع وقت كتابته. الغرض منه أن تقرأ المشروع كأنك تبدأ Next.js وTypeScript لأول مرة، وأن تستطيع مناقشة Stripe والاشتراكات والـ Credits والـ Dashboard بدقة. لا يعرض الملف محتوى `.env.local` لأن ذلك قد يحتوي مفاتيح سرية؛ يشرح فقط الأسماء المطلوبة من الإعدادات.

## 1. ما هو هذا المشروع؟

Marketly AI تطبيق ويب للتسويق بالذكاء الاصطناعي. المستخدم يسجّل حساباً، ثم ينشئ إعلانات وصوراً وفيديوهات وحملات وتسلسلات storyboard، ويستخدم أدوات متقدمة مثل Viral Engine وGrowth Engine وAnalytics وAI Assistant. كل ناتج مهم يُحفظ في MongoDB، وتجمعه لوحة التحكم Dashboard. توجد خطط مدفوعة بواسطة Stripe، وتمنح كل خطة رصيداً شهرياً من الـ credits؛ ويمكن شراء credits إضافية لا تنتهي حسب واجهة التطبيق.

التقنية الأساسية هي:

| المصطلح | معناه هنا |
|---|---|
| Next.js App Router | التطبيق والـ API في نفس المشروع. الصفحات تحت `src/app`، وملفات `route.ts` هي endpoints على الخادم. |
| React | يرسم الواجهة. أي ملف يبدأ بـ `"use client"` يستطيع استعمال state/effect والمتصفح. |
| TypeScript | JavaScript مع أنواع؛ تساعد على كشف عدم تطابق البيانات مبكراً. |
| Mongoose + MongoDB | Mongoose يعرّف schema/model، وMongoDB تحفظ users والحملات والـ ledger… إلخ. |
| React Query | يحتفظ بنتيجة طلبات الواجهة في cache ويعيد تحميلها عند invalidation. |
| Stripe | يستضيف صفحة الدفع Checkout ويرسل webhooks للخادم بعد الدفع أو تغيير الاشتراك. |
| Zod | يتحقق من شكل البيانات الواردة قبل تنفيذ المنطق. |

## 2. قبل قراءة أي feature: كيف يتحرك الطلب؟

```text
المتصفح
  -> صفحة React أو hook داخل features/
  -> fetch / apiJson إلى src/app/api/.../route.ts
  -> auth / feature guard / validation / moderation
  -> service في src/server/... أو src/lib/services/...
  -> Mongoose models <-> MongoDB، أو Stripe / OpenAI / n8n / ImageKit
  -> JSON موحّد غالباً: { success, data, meta }
  -> React Query cache ثم الواجهة
```

ليس كل route يستخدم نفس الغلاف؛ معظم routes الجديدة تستخدم `createApiHandler`، بينما بعض routes الأقدم ترجع `NextResponse` بنفسها. لذلك لا تفترض أن تنسيق كل استجابة متطابق من دون قراءة route.

## 3. خريطة ملفات المشروع كاملة بحسب المسؤولية

### الجذر والإعدادات

| الملف/المجلد | وظيفته |
|---|---|
| `package.json` | تعريف المشروع وscripts: `dev` للتطوير، `build` للبناء، `lint` لفحص ESLint، `typecheck` لفحص TypeScript. يعتمد على Next 15 وReact 19 وMongoose وStripe وReact Query وZod وغيرها. |
| `package-lock.json` | يثبت الإصدارات الدقيقة للحزم؛ لا يُشرح كسورس application ولا يُعدّل يدوياً عادةً. |
| `next.config.ts` | يفعّل الضغط، AVIF/WebP، cache للصور يوماً، Strict Mode، وتحسين import لـ lucide/recharts. كما يتجاوز ESLint أثناء build (`ignoreDuringBuilds: true`)؛ لذا نجاح build لا يثبت نجاح lint. |
| `tsconfig.json` | `strict: true`، alias `@/* -> src/*`، و`noEmit` لأن Next يبني الملفات. |
| `eslint.config.mjs` | إعداد ESLint. |
| `postcss.config.mjs` | يربط PostCSS/Tailwind. |
| `.env.example` | قالب المتغيرات العامة: MongoDB، JWT، ImageKit، n8n، ومزوّدي AI وOAuth. **لا يذكر حالياً مفاتيح Stripe رغم أن الكود يحتاجها.** |
| `.env.local` | إعداد محلي غير معروض هنا؛ يجب ألا يدخل Git. أضف فيه Stripe secrets عند تفعيل الفوترة. |
| `.gitignore` | يستبعد ملفات البيئة ومخرجات البناء والاعتماديات من Git. |
| `README.md` | وثائق عامة عن المنتج والتثبيت والـ API. |
| `CODE_FLOW_MIND_MAP_AR.md` | خريطة عربية مختصرة موجودة مسبقاً لتدفق المشروع. |
| `PROJECT_DISCUSSION_GUIDE_AR.md` | نقاط لمناقشة المشروع في عرض/مقابلة. |
| `check-mongo.ts`, `test-dashboard.ts` | سكربتات فحص يدوية لـ MongoDB وDashboard؛ ليست جزءاً من runtime الإنتاجي. |
| `scratch/` | تجارب/سكربتات مؤقتة (`check-db.ts`, `check-db.js`) وليست feature للمستخدم. |
| `public/` | ملفات ثابتة (شعارات، SVG، وصور screenshots/features). لا يوجد فيها منطق TypeScript؛ المتصفح يقدّمها مباشرة. |
| `.next/`, `node_modules/`, `tsconfig.tsbuildinfo` | مخرجات/اعتماديات مولّدة، لا تُقرأ ككود المشروع ولا تُعدّل يدوياً. |

### `src/app`: صفحات وواجهات HTTP

`app` يستخدم route groups بين قوسين؛ `(auth)` و`(app)` و`(admin)` تنظّم الملفات فقط ولا تظهر في URL.

| المسار | ما يفعله |
|---|---|
| `layout.tsx` | Root layout: الخطوط Inter/Space Grotesk/JetBrains/Cairo، metadata، script مبكر للثيم واللغة، ثم Providers وGlobalToaster. `suppressHydrationWarning` يمنع تحذير اختلاف HTML لأن localStorage لا يُقرأ إلا في المتصفح. |
| `providers.tsx` | ينشئ `QueryClient` واحداً، ويغلف التطبيق بـ React Query وThemeProvider وTranslationProvider وTooltipProvider. الاستعلامات stale لمدة 4 دقائق افتراضياً ولا يعاد جلبها عند focus. |
| `globals.css` | tokens وأسلوب Tailwind العام للتطبيق. |
| `page.tsx` | الصفحة التسويقية الرئيسية؛ تركّب مكونات landing. |
| `contact/page.tsx`, `contact/contact-client.tsx` | واجهة صفحة التواصل ونموذجها. |
| `(auth)/login`, `signup`, `forgot-password`, `reset-password`, `verify-email` | صفحات الدخول وإنشاء الحساب واسترداد كلمة المرور والتحقق من البريد؛ تعتمد على feature auth. |
| `(app)/layout.tsx` | يقرأ access cookie على الخادم، يفك JWT، ويمرر role إلى `AppShell`. الفشل يرجع role افتراضي `user`. |
| `(app)/dashboard/page.tsx` | صفحة رفيعة جداً: metadata ثم `<DashboardView />`. الشغل الحقيقي في `features/dashboard`. |
| `(app)/settings/page.tsx` | صفحة الإعدادات التي تضم BillingTab. |
| `(app)/creator-studio`, `images`, `videos`, `campaign-generator`, `growth-engine`, `viral-engine`, `analytics`, `marketing-strategy`, `ai-assistant` | صفحات ربط لكل feature؛ المكونات ومنطق fetch في مجلد feature المقابل. |
| `(admin)/admin/layout.tsx` | يحمي/ينظم واجهات admin. |
| `(admin)/admin/page.tsx` | واجهة Admin dashboard (وتطلب `/api/admin/analytics`). |
| `(admin)/admin/users/page.tsx` | إدارة المستخدمين وعرض بيانات subscription/credits. |
| `(admin)/admin/promo/page.tsx` | إنشاء واستعراض promotion codes في Stripe. |
| `api/**/route.ts` | طبقة HTTP: تقرأ request، تتحقق من الهوية/الصلاحية/الـ schema، ثم تستدعي service. قائمة المسارات في القسم 13. |

### `src/components`: قطع واجهة مشتركة

| المسار | ما يحتويه |
|---|---|
| `components/ui/` | primitives: `button`, `card`, `dialog`, `input`, `select`, `table`, `tabs`, `progress`, `toast`, `tooltip`… وهي طبقة تصميم قابلة لإعادة الاستخدام فوق Radix/HTML. لا تحتوي business logic. |
| `components/layout/` | `app-shell`, `sidebar`, `topbar`, `page-shell`, `responsive-grid`, `brand-mark`. الـ sidebar يقفل الرابط في الواجهة إن لم توجد feature، والـ topbar يعرض مجموع credits ويقود إلى billing. |
| `components/shared/` | مكونات عامة مثل `action-card`, `metric-card`, `chart-wrapper`, `lazy-charts`, `upload-dropzone`, `data-table`, حالات loading/error/empty، وانتقالات الصفحة. |
| `components/theme/` | ThemeProvider وtheme-toggle؛ ينسجمان مع localStorage/script في root layout. |
| `components/language-toggle.tsx` | تبديل اللغة/اتجاه RTL عبر TranslationProvider. |

### `src/features`: الواجهة مقسمة حسب domain

| feature | الملفات ودورها |
|---|---|
| `auth` | `components` للنماذج وshell/loading، `services/auth-service.ts` لنداءات الدخول، `hooks`، `types/auth.ts`، و`utils/schema.ts` للتحقق من المدخلات. |
| `landing` | Navbar، hero، features، pricing، partners/testimonials marquee وfooter للصفحة العامة. `pricing-section.tsx` يصف الأسعار تسويقياً، وليس مصدر حقيقة الدفع على السيرفر. |
| `billing` | `hooks/use-billing.ts` يجلب الاشتراك ويبدأ checkout/sync؛ `components/billing-tab.tsx` يرسم usage والخطط وزري شراء الباقات. هذا أهم جزء frontend للفوترة. |
| `dashboard` | `services/index.ts` types وطلبات summary/history، `hooks/use-dashboard.ts` React Query، وcomponents للـ view وrecent generations وquick actions. شرحه مفصّل في القسم 7. |
| `creator-studio` | نموذج prompt/results وتاريخ النتائج والخدمات/hooks/types. يقوم بتوليد أصول إعلانية. |
| `campaign-generator` | نموذج ومربعات الحملات، types/hooks/services/utils. يولد منشورات وحملات. |
| `growth-engine` | view/workflow/status/results، adapter لخدمة الصور، hooks/types/services. يتكلم مع n8n/service الخلفي. |
| `viral-engine` | search/results/ideas/hooks/hashtags/competitors/schedule/recommendations؛ يستقبل response Viral Engine وينظمه في بطاقات. |
| `analytics` | view وhook وservice/types/utils للـ analytics. |
| `ai-assistant` | chat UI، message UI، hook، service، types/utils. |
| `settings` | view/types/hooks/services/utils لتفضيلات المستخدم والـ tabs ومنها billing. |
| `storyboard`, `video-generator`, `marketing-strategy` | كل واحد يضم type/hook/service/view ومكوناته الخاصة. |

### `src/server`: منطق الخادم ومصادر البيانات

| المسار | شرح الملفات |
|---|---|
| `database/connection.ts` | اتصال MongoDB cached على `globalThis` لتجنب اتصالات كثيرة أثناء hot reload/serverless. بعد الاتصال يحاول seeding. |
| `database/index.ts` | نقطة تجميع exports للاتصال والـ models. |
| `database/enums.ts` | القوائم الثابتة للـ roles/plans/statuses/content types وغيرها؛ لا تضع string عشوائي خارج هذه القيم. |
| `database/types.ts`, `database/utils.ts` | types/helpers مشتركة لقاعدة البيانات. |
| `database/schemas/fragments.ts` | أجزاء schema متكررة مثل timestamps، soft delete، money، objectId، asset refs والـ plugins. |
| `database/seeder.ts` | إنشاء/تهيئة بيانات أولية عند الاتصال. |
| `database/models/*.model.ts` | كل ملف يعرّف interface TypeScript وMongoose Schema/indices/model لمستند معين: User, Brand, Campaign, GeneratedContent, Video, Storyboard, GrowthProject, ViralEngine, Analytics/AnalyticsEngine, AI memory/violations, Chat/assistant sessions, Upload, Settings, Notification, Project, ActivityLog… |
| `security/` | JWT، cookies، password hashing، token helpers، auth guard، idempotency، rate limit، sanitize، upload validation، profanity filter. |
| `http/` | `route-handler.ts` يطبع responses ويتعامل مع الأخطاء؛ `responses.ts` شكل JSON؛ `validation.ts` parser Zod/FormData؛ `subscription-middleware.ts` guards للمستخدم/feature/admin. |
| `services/` | خدمات عامة: auth, analytics, dashboard, AI generation, upload, ImageKit, OAuth, mail. ويحتوي `billing/` موضوع القسم التالي. |
| `ai/` | طبقة provider abstraction، prompts، parsers، orchestration، pipelines، RAG، memory، usage/generation tracking وworkflows. |
| `campaign-generator/`, `creator-studio/`, `growth-engine/`, `video-generator/`, `marketing-intelligence/` | منطق use cases: schemas/types/service/repository/retry/providers والنصوص اللازمة لكل feature. |
| `schemas/` | Zod schemas للـ auth/AI/analytics/uploads/marketing intelligence. |
| `moderation/with-moderation.ts` | بوابة فحص الطلبات AI وعقوبات/force logout عند المخالفة. |
| `errors/api-error.ts`, `logging/logger.ts`, `config/env.ts`, `config/moderation.ts` | أخطاء موحّدة، log، قراءة environment، وثوابت moderation. |

### طبقات client/legacy الأخرى

`src/lib/api/client.ts` هو wrapper للـ fetch؛ `lib/api/gradio.ts` اتصال Gradio. `lib/services` يضم factory/provider implementations وstoryboard generator. `services/advertisement-generation-service.ts` و`services/viralEngine.ts` و`services/mock-api.ts` خدمات مستقلة/قديمة نسبياً. `store/ui-store.ts` Zustand لحالة UI. `types/` أنواع عامة/navigation/viral engine. `hooks/` hooks عامة. `config/api.ts` config للـ API.

## 4. نموذج البيانات الضروري للفوترة

### المصدر الفعلي للحالة: `User.subscription`

رغم وجود `SubscriptionModel` منفصل، مسار Stripe الحالي يقرأ ويحدّث الاشتراك داخل وثيقة المستخدم في `src/server/database/models/user.model.ts`.

```ts
subscription: {
  plan, status, startedAt, expiresAt?, renewsAt?, billingCycle?,
  monthlyCredits, monthlyCreditsRemaining, purchasedCredits,
  stripeCustomerId?, stripeSubscriptionId?
}
features: { growthEngine, analytics, aiAssistant, priority, api, commercial, viralEngine }
usage: { totalCreditsUsed, monthlyCreditsUsed, purchasedCreditsUsed, ... }
```

معنى الحقول:

| الحقل | المعنى |
|---|---|
| `plan` | `free`, `starter`, `pro`, أو `business`. |
| `status` | وضع الدفع/الاشتراك: free أو trialing/active/past_due/canceled/expired. |
| `monthlyCredits` | الحصة النظرية للدورة الحالية. |
| `monthlyCreditsRemaining` | الجزء المتبقي من حصة الخطة ويُستهلك أولاً. |
| `purchasedCredits` | credits إضافية مدفوعة؛ تستهلك بعد انتهاء الشهرية. |
| `renewsAt` | تاريخ الـ reset المحلي للدورة، لا يُستمد حالياً من Stripe period end. |
| `features` | نسخة قابلة للفحص بسرعة من صلاحيات الخطة. guard على السيرفر يجب أن يكون المرجع لا إخفاء زر UI. |
| `usage` | عدادات تحليلية، وليست مصدر الرصيد؛ المصدر هو حقول subscription والـ ledger. |

`SubscriptionModel` (`subscription.model.ts`) يملك حقولاً أخرى مثل invoices وcampaign/image/video quotas وprovider. لكنه **غير موصول** بمسار Stripe الحالي: `applyPlanChange` لا ينشئ أو يعدّل هذا الـ model. كذلك `BillingTransactionModel` مصمم لسجل مبلغ/مزود/status، لكنه لا يكتب إليه webhook الحالي.

### دفتر حركة الرصيد: `CreditLedgerModel`

هذا model في `credit-ledger.model.ts` هو audit log لكل إضافة/خصم:

```ts
{ user, amount, type, source, feature?, description, metadata? }
```

الإضافة موجبة (`amount: +500`, `type: addition`)، والخصم سالب (`amount: -10`, `type: deduction`). `source` يقول هل تغيرت الحصة `monthly` أم `purchased`. يوجد index على `{ user, createdAt: -1 }` كي يظهر سجل مستخدم واحد بسرعة.

## 5. الخطط والـ Features — `subscription.service.ts`

`SUBSCRIPTION_PLANS` هو مصدر الحقيقة الداخلي للخطة:

| الخطة | credits | AI assistant | Viral | Growth | Analytics | API/Commercial/Priority |
|---|---:|---|---|---|---|---|
| Free | 50 مرة واحدة | لا | لا | لا | لا | لا |
| Starter | 500 شهرياً | نعم | نعم | لا | لا | لا |
| Pro | 1500 شهرياً | نعم | نعم | نعم | نعم | نعم |
| Business | 4000 شهرياً | نعم | نعم | نعم | نعم | نعم |

انتبه: التعليقات تقول إن Free 50 مرة واحدة، وهذا متوافق مع `evaluateMonthlyReset`: إذا كانت الخطة free يعود مباشرة ولا يعيد تعبئة الرصيد.

### `evaluateMonthlyReset(userId)` خطوة بخطوة

1. يجلب user من MongoDB.
2. إن لم يوجد user أو كانت الخطة free، يتوقف بنجاح بلا تغيير.
3. إن كان `renewsAt` موجوداً وقد تجاوز الوقت الحالي، يفحص أن `status === "active"`.
4. يضيف شهراً إلى renewal السابق، ويأخذ `credits` من `SUBSCRIPTION_PLANS`.
5. يضع `monthlyCreditsRemaining` إلى الحصة الكاملة، ويصفر `usage.monthlyCreditsUsed`، ويضع `usage.lastReset`.
6. يحفظ المستخدم.

لا يوجد cron job هنا؛ الاستدعاء **lazy** عند `GET /api/subscription`. أي إن الرصيد لا يصفّر في الثانية المحددة ما لم يزور العميل endpoint. وهو لا ينشئ CreditLedger entry للتجديد.

### `applyPlanChange(...)` خطوة بخطوة

1. يبدأ Mongoose transaction.
2. يجلب user داخل transaction أو يرمي 404.
3. يتأكد أن `newPlanId` موجود في الخريطة.
4. يكتب plan و`status = active` و`monthlyCredits` و`monthlyCreditsRemaining` و`features`.
5. يحفظ Stripe customer/subscription IDs إن مررت له.
6. يجعل `renewsAt` بعد شهر من **لحظة التنفيذ المحلية**.
7. يصفّر `monthlyCreditsUsed`، يحفظ ثم commit. أي خطأ يؤدي إلى abort.

هذه الدالة تُستدعى من webhook أو sync بعد Checkout. وهي ليست تحديثاً حقيقياً لـ Stripe subscription: لا تغيّر سعر اشتراك قائم ولا تلغيه ولا تراعي proration.

## 6. Stripe والاشتراكات: الفلو حرفياً

### المتغيرات اللازمة

الكود يحتاج، إضافة إلى `MONGODB_URI` وcookies/JWT:

```dotenv
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` و`@stripe/stripe-js` مثبتان لكن الفلو الحالي لا يستعمل Stripe.js؛ redirect يتم إلى `session.url` المستضافة من Stripe. أضف مفاتيح Stripe إلى `.env.example` حتى لا يفشل أي مطور جديد بصمت.

### إنشاء العميل: `stripe.service.ts`

`getStripe()` يطبق singleton: المتغير `stripeInstance` يكون null أول مرة، فيتأكد من `STRIPE_SECRET_KEY`، ينشئ `new Stripe(...)` مرة واحدة، ثم يعيد نفس العميل بعد ذلك. استعمال singleton يقلل إنشاء clients بلا فائدة.

#### اشتراك شهري — `createCheckoutSession`

المسار النصي الكامل:

```text
BillingTab
  -> useBilling.upgradePlan(planId)
  -> POST /api/subscription/checkout { planId }
  -> requireUser: JWT/cookie + user من MongoDB
  -> StripeService.createCheckoutSession
  -> Stripe Checkout URL
  -> window.location.href = URL
  -> المستخدم يدفع لدى Stripe
  -> Stripe webhook checkout.session.completed
  -> SubscriptionService.applyPlanChange
  -> User.subscription/features تتغير
```

تفاصيل route `api/subscription/checkout/route.ts`:

1. `requireUser(request)` يفك access token من cookie `marketly_access` أو Authorization header، يربطه بـ DB، ويرفض suspended/deleted.
2. `request.json()` يقرأ `planId`. إن كان غائباً يرجع bad request.
3. يبني origin من `host` و`x-forwarded-proto`; localhost يستعمل http والباقي https.
4. يرسل `user._id`, `user.email`, الخطة والـ origin إلى service.
5. يعيد `{ success: true, url }` داخل wrapper القياسي.

تفاصيل Stripe session التي ينشئها service:

| الحقل | القيمة/السبب |
|---|---|
| `mode: "subscription"` | Stripe ينشئ اشتراكاً متكرراً، لا دفعة منفردة. |
| `payment_method_types: ["card"]` | البطاقة فقط. |
| `customer_email` | يساعد Stripe في إنشاء/اختيار Customer. |
| `client_reference_id` | user id أيضاً؛ مفيد للربط لكنه لا يحل محل تحقق server-side. |
| `metadata.userId`, `metadata.planId` | أهم وسيلة للـ webhook ليعرف صاحب العملية والخطة. |
| `line_items.price_data` | السعر inline: USD، product name/description و`recurring.interval: month`. |
| الأسعار | Starter 4900¢=$49، Pro 9900¢=$99، Business 24900¢=$249. Free مرفوض. |
| `allow_promotion_codes: true` | يسمح بكوبونات Stripe التي ينشئها admin. |
| success URL | يرجع `/settings?tab=billing&success=true&session_id={CHECKOUT_SESSION_ID}#plans`. Stripe يبدل placeholder بالجلسة الحقيقية. |
| cancel URL | يرجع للـ billing بلا تغيير محلي. |

لا توجد Stripe Price IDs في البيئة أو DB؛ السعر/product يصنعان عند كل Checkout. هذا مناسب لبداية، لكنه يصعّب إدارة الأسعار والضرائب والتحليلات في Stripe مقارنة بسعر ثابت `price_...`.

### شراء Credits مرة واحدة

الفلو مطابق تقريباً، مع اختلافين: المستخدم يضغط `Buy 500 ($10)` أو `Buy 2000 ($35)`, والroute هو `POST /api/credits/buy`.

`createCreditsCheckoutSession` يرفض أي كمية سوى:

| الحزمة | Stripe amount |
|---|---:|
| 500 credits | 1000 cents = $10 |
| 2000 credits | 3500 cents = $35 |

وهنا `mode: "payment"` بدلاً من subscription، وتصبح metadata:

```ts
{ userId, type: "credits_purchase", amount: "500" /* أو "2000" */ }
```

بعد الدفع لا تضيف الواجهة credits بنفسها؛ المصدر المفترض هو webhook. ذلك صحيح من ناحية الثقة، لأن صفحة success يمكن إعادة تحميلها أو الوصول إليها يدوياً.

### Webhook: `api/webhooks/stripe/route.ts`

هذا endpoint لا يستعمل `createApiHandler` عمداً. webhook يجب أن يأخذ raw body كما أرسله Stripe؛ تحويله JSON قبل `constructEvent` يكسر signature.

1. `await req.text()` يأخذ النص raw.
2. يقرأ header `stripe-signature`; غيابه = 400.
3. `getStripe().webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)` يثبت أن Stripe هو المرسل ولم يتغير body. الفشل = 400.
4. يتصل بـ MongoDB.
5. يبدّل حسب `event.type`:

| Event | ما ينفذه الكود |
|---|---|
| `checkout.session.completed` + `type=credits_purchase` | يقرأ metadata amount ثم `CreditsService.addPurchasedCredits`. |
| `checkout.session.completed` + `planId` | `applyPlanChange(userId, planId, session.customer, session.subscription)`. |
| `customer.subscription.deleted` | يبحث user بـ stripeSubscriptionId ثم يطبق free. |
| `customer.subscription.updated` | إن status غير active/trialing: canceled => free، وإلا يخزن status مثل past_due. إن صار active ثانيةً يعيد `status=active`. |

### لماذا يوجد `/api/subscription/sync`؟

بعد redirect، `BillingTab` يقرأ `success=true&session_id=...` داخل `useEffect` ويستدعي `syncSession(sessionId)`. الـ route يجلب session من Stripe، ويتأكد أن الدفع complete/paid وأن `metadata.userId` يساوي المستخدم المسجل حالياً. للاشتراك يستدعي `applyPlanChange`، ولذلك قد تظهر الخطة بسرعة حتى قبل وصول webhook.

يستعمل `hasSynced` حتى لا يكرر sync أثناء render، ثم يزيل query params من URL بـ `router.replace`.

لـ credits يوجد تعليق صريح في الكود: **لا يضيف credits في sync** حتى لا يسمح refresh بتكرار الزيادة. إذن webhook وحده مسؤول عن credit pack.

## 7. Credits: كيف يحسب ويخصم الرصيد؟

### واجهة القراءة

`GET /api/credits` يعيد:

```json
{
  "monthlyCreditsRemaining": 490,
  "purchasedCredits": 2000,
  "totalAvailable": 2490
}
```

بينما `GET /api/subscription` يرجع subscription/features/usage بالكامل، ويستدعي reset lazy أولاً، ويصلح مستخدمين قدماء لا يملكون subscription، ويزامن `features` مع خريطة الخطة. `useBilling` يستدعي هذا الـ endpoint ويخزنه تحت query key `['billing']` لمدة 5 دقائق.

### `CreditsService.deductCredits` بالتفصيل

استدعاء مثال:

```ts
await CreditsService.deductCredits(userId, 10, "campaign_generator", "Generated social campaign")
```

المعاملات هي: صاحب الرصيد، الكمية، اسم feature للأثر التدقيقي، ووصف يراه developer/admin.

المنطق:

1. إذا `amount <= 0` يعيد `true` مباشرة. لذلك 0.2 مسموح؛ الـ credits هنا decimal وليست integer مفروضة في schema.
2. يبدأ MongoDB session وtransaction.
3. يجلب user داخل session؛ غير موجود => 404.
4. role `admin` يتجاوز الخصم كله، يعمل commit ويرجع true، ولا ينشئ ledger entry.
5. إذا الشهرية تكفي (`remaining >= amount`) يخصم كلها من monthly.
6. إذا لم تكف، يأخذ كل الشهرية أولاً، ثم يحسب الباقي. إن كانت purchased تكفي، يخصم الباقي منها؛ وإلا abort ثم bad request `Insufficient credits.`.
7. يحدّث حقول user: المتبقي الشهري والمشترى، وعدادات usage الثلاثة.
8. ينشئ row ledger سالباً منفصلاً لكل مصدر استُخدم؛ لذلك عملية 10 مع 3 شهرية و7 مشتراة تترك صفين (-3 monthly و-7 purchased).
9. commit ثم log info. الأخطاء غير ApiError تصبح 500 عام بعد log error.

المعاملة تجعل فحص الرصيد وخصمه والـ ledger atomic **بشرط** أن MongoDB يعمل كـ replica set/sharded cluster؛ standalone MongoDB لا يدعم transactions كما ينبغي.

### الإضافة: `addPurchasedCredits`

يبدأ transaction، يجلب user، يزيد `subscription.purchasedCredits`، يحفظه، ثم ينشئ ledger موجب `addition/purchased` بالوصف، ثم commit. يستدعيه Stripe webhook فقط في هذه النسخة.

### جدول تكلفة الـ features في الكود

| المكان | التكلفة | متى تخصم؟ |
|---|---:|---|
| `server/creator-studio/service.ts` | 2 لكل variation | قبل pipeline الصورة؛ `variations * 2`. |
| `services/advertisement-generation-service.ts` | 2 | مسار بديل/أقدم لـ Ad Studio، قبل Flux/ImageKit. |
| `lib/services/storyboard-generator.ts` | 2 | قبل توليد storyboard. |
| `server/campaign-generator/generateCampaign.ts` | 10 | قبل upload/LLM للحملة. |
| `server/growth-engine/service.ts` | 10 | بعد optional image upload وقبل إنشاء draft/n8n. |
| `server/video-generator/service.ts` | 5 | قبل توليد الفيديو. |
| `api/analytics/analyze/route.ts` | 5 | قبل إرسال webhook analytics. |
| `api/viral-engine/route.ts` | 50 | بعد feature/moderation وقبل n8n webhook. |
| `api/assistant/chat/route.ts` | 0.2 | بعد feature/moderation وقبل إنشاء/stream الرسالة. |

مهم: أغلب هذه الخدمات تخصم **قبل** استدعاء مزوّد AI أو n8n. فإذا فشل المزوّد لاحقاً، لا يوجد في الكود refund تلقائي. هذه سياسة تحتاج قراراً: إما reserve/finalize/refund، أو تقبل أن المحاولة نفسها مدفوعة.

## 8. Dashboard المستخدم: من قاعدة البيانات إلى الشاشة

### مسار الصفحة

```text
/dashboard
  -> app/(app)/dashboard/page.tsx
  -> DashboardView
     -> useDashboard: GET /api/dashboard/summary
     -> useBilling: GET /api/subscription
  -> Dashboard service يجمع models المستخدم الحالي
  -> DashboardView يرسم Hero/KPIs/chart/history/actions
```

`/api/dashboard/summary` و`/api/dashboard/generations` يستعملان `requireAuth` (JWT) ثم `getDashboardSummary(auth)`/`getDashboardGenerations(auth)`. لا يستعملان requireFeature لأن Dashboard متاحة للمستخدم المسجل.

### `dashboard-service.ts` بالتفصيل

#### حماية owner isolation

`toObjectId(auth.user.sub)` يتحقق أن subject في JWT ObjectId صحيح. إن لم يكن صحيحاً يعيد dashboard فارغاً. كل query بعدها يضيف `{ userId }`؛ لذلك لا ينبغي أن يرى المستخدم نواتج مستخدم آخر.

#### `getDashboardSummary`

يتصل بقاعدة البيانات ثم ينفذ `Promise.all`؛ أي العدّادات والاستعلامات المتعددة تعمل بالتوازي لا بالتتابع:

| الاستعلام | مصدره | استخدامه |
|---|---|---|
| GrowthProject count | `GrowthProjectModel` | Projects. |
| Campaign count | `CampaignModel` | KPI campaigns. |
| GeneratedContent count | `GeneratedContentModel` | جزء Generated Assets. |
| Storyboard count | `StoryboardModel` | جزء Generated Assets. |
| Video count | `VideoModel` | جزء Generated Assets. |
| Viral/Analytics engine counts | Models الخاصة | KPIs. |
| Analytics last 25 | `AnalyticsModel` | يجمع clicks/impressions/conversions ويحسِب CTR. |
| آخر 4 من كل نوع | Models المختلفة | يبني recent cards؛ وبعد الدمج يأخذ أحدث 5. |

الحسابات:

```text
CTR = impressions > 0 ? (clicks / impressions) * 100 : 0
Generated Assets = generated content + storyboards + videos
Growth trend = عدد السجلات المنشأة في كل يوم (ليس conversion حقيقياً)
```

الدالة `buildGenerationItems` توحّد سبعة models مختلفة إلى شكل واجهة واحد `RecentGeneration`: id/title/type/date/لون وربما image/video/posts/flags. بعد ذلك ترتبها تنازلياً حسب `createdAt`.

أمثلة التحويل:

| المصدر | العنصر الناتج |
|---|---|
| `GeneratedContent` | صورة واحدة أو storyboard frame لكل image، رابط download داخلي، hook/caption عند storyboard. |
| `CampaignModel` | title وصورة أولى وposts مستخرجة من `socialPosts` أو `campaignCards`. |
| `GrowthProjectModel` | عنوان `Growth Engine: brandName` وصورة product إن وجدت. |
| `ViralEngineModel` | badge/flag `isViralEngine` لعرض `ResultsDashboard` عند الفتح. |
| `AnalyticsEngineModel` | flag `isAnalyticsEngine` لعرض `AnalyticsResults`. |
| `VideoModel` | `isVideo`, `videoUrl`, thumbnail. |
| `StoryboardModel` | بطاقة نصية بسيطة؛ لا يتم تحميل تفاصيله في modal من هذا mapping. |

`getDashboardGenerations` يفعل الشيء نفسه لكن يطلب حتى 100 سجل من كل مصدر ويعيد القائمة كاملة للـ modal View All.

### `DashboardView` (واجهة العرض)

1. `useDashboard()` يملك key `dashboard-summary`؛ React Query يحمّل ثم يعرض `PanelSkeleton` أو `ErrorState` أو البيانات.
2. `useBilling()` يجلب الخطة والـ features لتظهر badge الخطة وتُخفى أزرار Growth عند عدم الاستحقاق.
3. `DashboardHero`: يعرض workspace، plan، أزرار Creator Studio/Video دائماً، وزر Growth فقط عند `features.growthEngine`.
4. `buildKpis`: يترجم metrics server الإنجليزية إلى labels محلية ويستنتج عدد الفيديوهات من الـ recent items. KPIs الظاهرة: projects, assets, videos, viral, analytics.
5. `GrowthChart` من lazy charts يظهر حين `growthTrend` غير فارغ؛ وإلا Empty state. بياناته تسمى `conversions` في type، لكن الكود يضع فيها عدد items؛ لا تقدمها كـ conversions أعمال حقيقية في العرض.
6. `RecentActivityTimeline` يأخذ أول خمسة عناصر ويختار icon من نوع الناتج ويصيّغ التاريخ حسب language.
7. `QuickActionsCard` يفلتر QUICK_CREATE_ITEMS حسب feature؛ هذه تجربة مستخدم فقط، لا تكفي للحماية على server.

### `RecentGenerationsCard`

يعرض حتى خمسة tiles مع زر `View all`. عند الفتح يشغل query ثانية key `dashboard-generations`. إذا نقر المستخدم بطاقة قابلة للمعاينة، تظهر modal مُركّبة على `document.body` بـ `createPortal`، تغلق بـ Escape أو الخلفية أو زر X، وتقفل scrolling في body أثناء الفتح.

المعاينات الخاصة:

| flag/type | ما يحدث |
|---|---|
| AI Growth Engine | طلب project ثم `GrowthEngineResults`. |
| Viral Engine | fetch `/api/viral-engine/:id` ثم `ResultsDashboard`. |
| Analytics Engine | fetch `/api/analytics/:id` ثم `AnalyticsResults`. |
| Campaign | يعرض posts وcopy buttons. |
| Image/Video/Storyboard frame | يعرض media وdownload وprompt/hook/caption حسب النوع. |

بعد أي generation في creator/viral/growth، ملفات features تستدعي `queryClient.invalidateQueries` لمفاتيح dashboard summary/generations (وفي العادة billing أيضاً)، فيرى المستخدم نتيجة/رصيداً حديثاً عند الزيارة التالية أو إعادة الرسم.

### Admin Dashboard مختلف

هناك مساران ينبغي عدم خلطهما:

| المسار | الواقع |
|---|---|
| `GET /api/admin/dashboard` | يحسب total/active/premium users، revenue من `BillingTransactionModel`، credits من ledger، ورسائل AI. |
| `GET /api/admin/analytics` | يعيد بشكل مختلف `kpis` و`insights`. |
| `app/(admin)/admin/page.tsx` | يستدعي **`/api/admin/analytics`** ويتوقع `data.kpis` و`data.insights`، وليس `/api/admin/dashboard`. |

لذلك endpoint `admin/dashboard` غير مستعمل من هذه الصفحة حالياً، وmonthlyRevenue فيه سيكون صفراً ما لم تضف كتابة `BillingTransactionModel` أثناء Stripe events.

## 9. الحماية وعلاقتها بالفوترة

### Authentication مقابل Authorization

Authentication: «من هو؟» عبر JWT في cookies/Authorization header. `requireUser` و`requireAuth` يتحققان منه ويجلبان user.

Authorization: «هل يحق له؟» عبر `requireFeature(request, feature)`:

1. يقرأ token، يفكه ويتصل بالـ DB.
2. يرفض suspended/deleted.
3. admin bypass.
4. يفحص `user.features[feature]`; false => 403 `Feature not available in your subscription.`.

الأماكن الظاهرة في الكود: Viral Engine يطلب `viralEngine`، Growth Engine يطلب `growthEngine`، وassistant chat يطلب `aiAssistant`. Analytics analyze يخصم credits لكنه لا يستدعي requireFeature في route نفسه؛ راجع سياسة الوصول المقصودة إن أردت حصره في Pro/Business.

الميدلوير `src/middleware.ts` حماية أولية للصفحات: إن لم يوجد access ولا refresh cookie يوجه إلى login، ويمنع دخول login/signup لمن يملك cookie. هذا لا يغني عن guards داخل API؛ الميدلوير لا يثبت صلاحية token ولا feature.

## 10. ما الذي لا يفعله implementation الحالي بعد؟ (أسئلة مناقشة مهمة)

هذه ليست عيوباً نظرية؛ هي نتائج مباشرة من قراءة الملفات:

1. **لا يوجد idempotency للـ Stripe webhooks.** Stripe قد يعيد delivery، و`checkout.session.completed` لباقة credits سيستدعي `addPurchasedCredits` مرة أخرى. يلزم تخزين `event.id` أو `session.id` بفهارس unique قبل إضافة credits.
2. **`/sync` لا يضيف credits عمداً.** هذا يمنع التكرار من refresh، لكنه يجعل وصول webhook ضرورياً تماماً للـ top-up. راقب webhooks/retry queue في الإنتاج.
3. **لا كتابة لـ `BillingTransactionModel`.** لذلك Admin revenue لا يمثل Stripe sales حالياً.
4. **`SubscriptionModel` المنفصل غير مستخدم في Stripe flow.** لا تعده مصدر الاشتراك عند المناقشة؛ source الفعلي `User.subscription`.
5. **الـ renewal محلي وبسيط.** `applyPlanChange` يجعل renewsAt الآن + شهر ولا يقرأ `current_period_end` من Stripe. webhook update لا يزامن plan أو تاريخ الدورة، فقط status تقريباً.
6. **حذف الاشتراك يستدعي `applyPlanChange(..., 'free')`، وهذه الدالة تضع status `active`.** الخطة/الميزات تصبح free بشكل صحيح، لكن الحالة النصية ليست `free` أو `canceled` كما قد تتوقع.
7. **الترقية/التخفيض ليست تعديل subscription قائم.** كل اختيار ينشئ Checkout subscription جديداً؛ لا يوجد customer portal/cancel/resume/change رغم أن `BillingProvider.interface.ts` يعلن تلك الدوال فقط.
8. **لا refund عند فشل AI بعد الخصم.** الخصم قبل provider. الحل الأفضل ledger reservation/idempotency/refund transaction عند failure.
9. **Free plan 50 مرة واحدة فقط.** لذلك حين يستنفدها لا يعاد ملؤها شهرياً.
10. **مقاييس GrowthChart لا تمثل conversions حقيقية.** `buildGrowthTrend` يساوي `conversions += 1` لكل output. الاسم مضلل ويحتاج تغيير type/label أو بيانات حقيقية.
11. **`.env.example` ناقص Stripe secrets.** يجب تحديثه مع توثيق Stripe CLI/webhook endpoint.
12. **Stripe API version مكتوبة hard-coded وبـ `as any`.** عند ترقية SDK راجع compatibility بدلاً من إخفاء type mismatch.

## 11. تصميم مقترح لتقوية Stripe وcredits

```text
Webhook raw body + signature
  -> StripeEvent collection: eventId UNIQUE, status processing/completed
  -> DB transaction
       -> assert event not processed
       -> update User.subscription from Stripe canonical fields
       -> add CreditLedger entry
       -> add BillingTransaction entry
       -> mark event processed
  -> 2xx فقط بعد commit
```

لـ credits، أضف مثلاً `stripeCheckoutSessionId` فريداً إلى ledger/transaction. وللاشتراك استخرج الخطة من Price ID أو subscription items، واحفظ `current_period_end` القادم من Stripe بدلاً من `new Date() + month`. أضف Customer Portal لتغيير البطاقة/الإلغاء، ولا تجعل client يقرر صلاحية الدفع.

## 12. معجم سريع للمناقشة

| سؤال | إجابة دقيقة |
|---|---|
| أين يحفظ Stripe customer id؟ | في `User.subscription.stripeCustomerId`. |
| كيف يعرف webhook المستخدم؟ | metadata `userId` التي يرسلها الخادم إلى Stripe، وليس user input. |
| لماذا نتحقق من signature؟ | لمنع أي طرف من استدعاء endpoint وإضافة credits أو تغيير خطة. |
| كيف تمنع سباق الخصم؟ | MongoDB transaction تجمع read/check/update/ledger في عملية atomic. |
| أي رصيد يستهلك أولاً؟ | monthly ثم purchased. |
| هل admin يدفع credits؟ | لا، CreditsService يتجاوز خصمه. |
| لماذا React Query؟ | cache وloading/error وinvalidate بعد generation/billing بدلاً من إدارة fetch يدوياً في كل component. |
| لماذا dashboard لا تستعلم من front end مباشرة عن Mongo؟ | credentials وقاعدة البيانات تبقيان على server؛ API يفلتر userId ويعيد DTO آمن. |

## 13. فهرس API routes

هذا فهرس كل ملفات `route.ts` في المشروع لتعرف مكان البحث؛ اقرأ service المستوردة لمعرفة التنفيذ العميق.

| المجموعة | المسارات |
|---|---|
| Auth | `/api/auth/signup`, `login`, `logout`, `me`, `refresh`, `forgot-password`, `reset-password`, `verify-email`, `oauth/google`, `oauth/google/callback`, `oauth/github`, `oauth/github/callback` |
| Billing | `/api/plans`, `/api/subscription`, `/api/subscription/checkout`, `/api/subscription/sync`, `/api/credits`, `/api/credits/buy`, `/api/webhooks/stripe` |
| Dashboard/admin | `/api/dashboard/summary`, `/api/dashboard/generations`, `/api/dashboard/generations/[generationId]/download`, `/api/admin/dashboard`, `/api/admin/analytics`, `/api/admin/users`, `/api/admin/users/[id]/action`, `/api/admin/users/[id]/contact`, `/api/admin/promo`, `/api/admin/promo/[id]` |
| Creator/media | `/api/creator-studio/generate`, `upload`, `history`, `retry`, `favorites`, `download`; `/api/uploads`; `/api/video-generator/generate`, `status`, `progress`, `history`, `export`; `/api/generate-ad`; `/api/generate-storyboard`; `/api/parse-pdf`; `/api/tts`; `/api/transcribe` |
| Campaign/brand | `/api/brand`, `/api/campaigns`, `/api/campaign/[id]`, `/api/campaign/[id]/regenerate`, `/api/campaign-generator/generate`, `upload`, `hooks`, `captions`, `creatives`, `analytics`, `/api/generate-campaign` |
| AI/engines | `/api/ai/generate`, `memory`, `personalize`; `/api/ai-assistant/chat`, `sessions`, `sessions/[id]`, `sessions/cleanup`; `/api/assistant/chat`, `history`; `/api/growth-engine`, `project/[projectId]`; `/api/viral-engine`, `[id]`; `/api/marketing-strategy/generate` |
| Analytics | `/api/analytics/analyze`, `overview`, `reports`, `insights`, `events`, `recommendations`, `[id]` |
| Other | `/api/contact`, `/api/users/ping` |

## 14. ترتيب عملي لقراءة السورس بنفسك

1. ابدأ بـ `package.json` ثم `app/layout.tsx` و`app/providers.tsx` و`middleware.ts`.
2. افهم `database/user.model.ts` و`database/enums.ts` ثم `database/connection.ts`.
3. افهم `http/route-handler.ts`, `security/auth-guard.ts`, و`http/subscription-middleware.ts` قبل أي API route.
4. للفوترة اقرأ بالترتيب: `subscription.service.ts`، `credits.service.ts`، `stripe.service.ts`، ثم routes subscription/credits/webhook، ثم hook/component billing.
5. للـ Dashboard: page، `dashboard-view.tsx`، hook/service frontend، routes، ثم `dashboard-service.ts` وأخيراً models التي يقرأها.
6. بعدها اختر feature واحداً واتبع import chain: component -> hook/service -> API route -> server service -> model/provider.

بهذا الترتيب لا تصبح ملفات المشروع المتشابهة مجرد أسماء: ستعرف ما إذا كنت في UI، transport، authorization، business logic، أو persistence.
