<div dir="rtl" align="right">

# دليل مناقشة مشروع Marketly AI

## ملخص سريع

**Marketly AI** منصة موحدة للمسوق تساعده على إنشاء الحملات والإعلانات بالصور والفيديو، تحليل الأداء، ومتابعة التوجهات، مع مساعد ذكاء اصطناعي.

المشروع عبارة عن **Full-stack Modular Monolith** مبني بـ **Next.js**: الواجهة والـ API موجودان في نفس الـ repository، لكن الكود مقسّم بوضوح إلى features وservices وطبقات server. ليس Microservices؛ الخدمات الخارجية مثل n8n وStripe وموفري الذكاء الاصطناعي هي integrations منفصلة.

## الـ Architecture

```text
المستخدم
  ↓
واجهة Next.js (Pages + React Components)
  ↓
Feature Hooks/Services + React Query
  ↓
Next.js Route Handlers: /api/...
  ↓
Authentication + Zod Validation + Rate Limit + Moderation
  ↓
Business Services في src/server
  ├─ MongoDB عبر Mongoose
  ├─ AI Providers: OpenAI / Claude / HuggingFace / Mock
  ├─ ImageKit للملفات والصور
  ├─ Stripe للـ Billing والـ Credits
  └─ n8n للـ Long-running Automation
```

## الـ Frontend

### التقنيات المستخدمة

- **Next.js 15 App Router** و **React 19** و **TypeScript**.
- **Tailwind CSS 4** للتصميم.
- **Radix UI** لمكوّنات الواجهة الأساسية القابلة للوصول مثل Dialog وDropdown.
- **Framer Motion** للـ animations.
- **React Query (TanStack Query)** لإدارة server state: fetching وcaching وloading/error states.
- **Zustand** للـ global UI state.
- **React Hook Form + Zod** للفورمز والتحقق من المدخلات.
- **Recharts** للـ charts.
- **Lucide React** للأيقونات.
- نظام ترجمة داخلي عربي/إنجليزي مع دعم RTL.

### تنظيم الكود

التنظيم Feature-based، أي كل وظيفة لها مكوّناتها وhooks وservices وtypes الخاصة بها:

```text
src/features/
  dashboard/
    components/
    hooks/
    services/
    types/
  campaign-generator/
  creator-studio/
  analytics/
  ai-assistant/
```

مثال مسار تحميل بيانات الـ Dashboard:

```text
page.tsx
  → DashboardView
  → useDashboard() [React Query]
  → getDashboardSummary()
  → apiJson("/api/dashboard/summary")
  → GET /api/dashboard/summary
```

الصفحات نفسها خفيفة، وتستدعي View من الـ feature. المنطق التفاعلي والـ UI موجودان داخل الـ feature module.

مجلدات مثل `(app)` و`(auth)` و`(admin)` اسمها **Route Groups**؛ هي للتنظيم وتطبيق layouts مختلفة، ولا تظهر في الـ URL.

### Server Components وClient Components

- الـ **Server Component** يتم render له على السيرفر، ويقلل JavaScript المرسل للمتصفح.
- الـ **Client Component** نستخدمه عندما نحتاج state أو events أو hooks أو React Query.
- مثال: `DashboardView` هو Client Component لأنه يجلب بيانات تفاعلية ويعرض loading/error states.

## الـ Backend

الـ Backend مبني باستخدام **Next.js Route Handlers** داخل `src/app/api`، مثل:

```text
src/app/api/auth/login/route.ts
src/app/api/creator-studio/generate/route.ts
src/app/api/growth-engine/route.ts
```

الـ Route Handler لا يحتوي business logic كبير. وظيفته تكون:

1. استقبال الـ request.
2. التأكد من هوية المستخدم وصلاحياته.
3. عمل validation بالـ Zod.
4. تنفيذ rate limiting وcontent moderation عند الحاجة.
5. استدعاء service المناسب.
6. إعادة JSON response موحد.

يوجد `createApiHandler` لتجميع الـ error handling والـ logging والـ request ID والـ rate limiting بدل تكرارها في كل endpoint.

## Database

- قاعدة البيانات: **MongoDB**.
- الـ ODM: **Mongoose**.
- يوجد Models مثل: User وGeneratedContent وCampaign وGrowthProject وSubscription وAnalytics وBrand.

MongoDB مناسبة للمشروع لأن مخرجات الذكاء الاصطناعي متغيرة ومرنة: قد تحتوي على campaigns وhooks وcaptions وimages وanalytics في JSON مختلف بحسب الـ feature.

الاتصال بقاعدة البيانات معمول له caching على مستوى التطبيق، لتجنب فتح اتصال جديد مع كل request في بيئة serverless.

## Authentication وAuthorization

```text
Signup
  → Hashing للـ password
  → إنشاء user
  → Verification token + email

Login
  → التحقق من password
  → التأكد من email verification
  → إنشاء JWT access وrefresh tokens
  → تخزينهما في cookies

أي API محمي
  → requireAuth()
  → Verify JWT
  → التأكد أن الحساب active
  → السماح بتنفيذ الخدمة
```

يوجد أيضًا:

- OAuth مع Google وGitHub.
- Roles مثل admin وowner.
- Feature access حسب خطة الاشتراك، مثل Growth Engine.
- حماية من brute-force؛ محاولات login الفاشلة المتكررة تؤدي إلى lock مؤقت.
- الـ admin routes تستخدم `requireAdmin`.

الـ middleware يحمي صفحات الواجهة بتحويل غير المسجل إلى صفحة login. أما الحماية الفعلية للـ API فتتم داخل `requireAuth()` عن طريق التحقق من الـ JWT.

## AI Flow العام

```text
Prompt من المستخدم
  → API Route
  → Authentication + Validation + Content Moderation
  → بناء Brand/Memory Context
  → بناء Prompt منظم
  → AI Provider Registry
  → AI Provider
  → Retry أو Fallback Provider إذا فشل
  → Parse للـ JSON + Quality Checks
  → Usage Tracking + حفظ Memory/Result
```

طبقة الذكاء الاصطناعي تدعم أكثر من provider مثل OpenAI وClaude وHuggingFace وMock provider. يوجد provider registry لاختيار المزود الأساسي، ثم الانتقال إلى بديل إذا فشل الأساسي.

الـ AI orchestration يحتوي على:

- Concurrency control.
- Timeout.
- Retry.
- Provider fallback.
- Prompt validation.
- JSON parsing.
- Quality وbrand consistency checks.
- Usage tracking.
- AI memory.

## Flow: Creator Studio

الـ Creator Studio مسؤول عن توليد إعلانات صور.

```text
المستخدم يرفع product/reference image ويكتب prompt
  → Validate upload
  → رفع الصورة إلى ImageKit
  → POST /api/creator-studio/generate
  → Auth + Idempotency Key + Zod + Moderation
  → خصم credits
  → إضافة brand memory للـ prompt
  → Image pipeline / Flux عبر Gradio
  → إرجاع الصور الناتجة
  → حفظ GeneratedContent في MongoDB
```

**Idempotency Key** تمنع تنفيذ نفس الطلب مرتين بسبب ضغط المستخدم مرتين أو retry من الشبكة، وبالتالي تمنع generation أو خصم credits مكرر.

## Flow: Growth Engine

```text
المستخدم يرسل brand + audience + industry + goal + brief
  → التحقق أن الـ feature متاحة في الاشتراك
  → Validate multipart form
  → Optional ImageKit upload
  → خصم 10 credits
  → إنشاء draft GrowthProject في MongoDB
  → استدعاء n8n webhook
  → n8n ينفذ الـ automation الثقيلة
  → إرجاع أو تحديث project/result
  → الواجهة تعرض المشروع
```

نستخدم **n8n** للـ workflows الطويلة وعمليات scraping/automation لأن تنفيذها داخل request serverless واحد قد يسبب timeout. إذا فشل workflow، يتم حفظ المشروع كـ draft مع error بدل فقدان طلب المستخدم.

## Flow: Campaign Generator

```text
Brief + Product + Audience + Target Platforms
  → Validation + Moderation
  → Inject Brand Memory
  → Mistral يولد Structured Campaign Plan
  → Zod يتحقق من شكل الناتج
  → إنشاء Angles وHooks وCaptions وCTAs
  → توليد Creative لكل Angle بالتوازي
  → فلترة claims غير الموثوقة
  → إرجاع Estimated Analytics
```

يوجد fallback plan إذا أرجع الـ AI output غير صالح أو غير مكتمل، مع فلترة لعبارات تسويقية غير مضمونة مثل `100%` و`#1` و`10x` لتقليل hallucinated marketing claims.

## Billing وStripe

```text
المستخدم يختار plan أو credit pack
  → Backend ينشئ Stripe Checkout Session
  → المستخدم يدفع على Stripe
  → Stripe يرسل webhook للسيرفر
  → التحقق من webhook signature
  → تحديث subscription أو إضافة credits في MongoDB
```

نستخدم webhook لأن العودة إلى صفحة success بعد الدفع لا تعني وحدها أن الدفع تأكد؛ Stripe هو المصدر الموثوق لحالة الدفع.

## Design Patterns الموجودة

لا نصف المشروع بأنه MVC تقليدي. الوصف الأدق:

- **Feature-based modular architecture:** كل feature لها components/hooks/services/types.
- **Service Layer:** الـ business logic موجود في `src/server/services` و`src/server/<feature>`.
- **Factory / Strategy / Registry:** تبديل AI provider بدون تغيير باقي النظام.
- **Adapter:** طبقة الربط مع الخدمات الخارجية مثل Gradio وImageKit وStripe.
- **Repository-like pattern:** خصوصًا في Growth Engine لفصل database access.
- **Middleware pattern:** حماية الـ routes وإضافة security headers.
- **Centralized error handling:** `createApiHandler` يوحد responses والأخطاء.
- **DTO / Schema validation:** Zod يحدد شكل الـ input/output.
- **Retry + fallback resilience pattern:** لعمليات AI والشبكة.

## Security

- Password hashing، وليس تخزين password خام.
- JWT verification داخل الـ API.
- Cookies للتوكنات.
- Zod validation للمدخلات.
- Rate limiting للـ login وAI endpoints.
- Content moderation وprofanity filtering.
- Upload validation للـ type/size/file.
- Stripe webhook signature verification.
- Environment variables لمفاتيح الـ API والأسرار.
- Security headers مثل `X-Frame-Options: DENY`.

## أسئلة متوقعة وإجابات قصيرة

### لماذا Next.js بدل React + Express؟

Next.js جمع SSR/RSC والـ frontend والـ API routes في مشروع واحد، ويسهّل deployment. ومع ذلك الكود منظم لأن الـ business logic مفصول داخل service layer.

### ما الفرق بين Server Component وClient Component؟

Server Component يتم render لها على السيرفر وتقلل JavaScript في المتصفح. Client Component نستخدمها عند الحاجة إلى state أو events أو hooks أو React Query.

### لماذا React Query؟

لإدارة fetching وcaching وloading/error states وretry ومنع requests المكررة. الإعدادات الحالية تجعل البيانات fresh لمدة أربع دقائق تقريبًا.

### لماذا Zod؟

لأننا لا نثق في input القادم من المتصفح. Zod يتحقق من نوع البيانات والحقول المطلوبة والحدود قبل تشغيل business logic أو AI.

### كيف نمنع الـ AI من إرجاع JSON غير صالح؟

نطلب JSON contract صريحًا في الـ prompt، ثم نعمل parse وvalidation بالـ Zod، وفي بعض flows يوجد fallback output.

### لماذا نستخدم n8n؟

للـ workflows الطويلة وعمليات scraping/automation التي لا تناسب request serverless قصير.

### كيف تمنعون duplicate generation؟

باستخدام Idempotency Keys، وأحيانًا fingerprint hash مبني من input وuser ID لاكتشاف نفس generation.

### ما الفرق بين Authentication وAuthorization؟

- **Authentication:** هل المستخدم هو فعلًا من يقول إنه هو؟ يتم ذلك عبر JWT.
- **Authorization:** هل يملك صلاحية feature أو admin access؟ يتم ذلك عبر role وsubscription checks.

### كيف تُخصم الـ Credits؟

الخدمة تخصمها قبل الـ generation؛ مثل Creator Studio حسب عدد الـ variations، وGrowth Engine بقيمة ثابتة.

## كلام جاهز لبداية المناقشة

> Marketly AI هو Marketing Operating System مبني كـ full-stack Next.js modular monolith. الـ frontend React 19 وTailwind، ومنظم feature-based، ويستخدم React Query للـ server state. الـ backend عبارة عن Next.js Route Handlers؛ كل route مسؤول عن validation وauthentication ثم يستدعي service layer. البيانات في MongoDB عبر Mongoose. طبقة الـ AI فيها provider abstraction وfallback بين OpenAI وClaude وHuggingFace، مع retry وtimeout وstructured JSON validation. الـ workflows الثقيلة مثل Growth Engine بتتوجه إلى n8n، والدفع والـ credits متكاملان مع Stripe webhooks.

## ملاحظة للمناقشة

افهم الفكرة والمسارات بدل حفظ أسماء الملفات. عند أي سؤال، ابدأ دائمًا بـ: **المستخدم يرسل طلبًا من الواجهة، الـ API يتحقق منه، الـ service ينفذ business logic، ثم نحفظ أو نستدعي integration خارجية، وبعدها نرجع response موحد للواجهة.**

</div>
