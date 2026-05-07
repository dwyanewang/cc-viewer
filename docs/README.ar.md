# CC-Viewer

مجموعة أدوات Vibe Coding مستخلصة من خبرة تطوير عملية ومبنية فوق Claude Code:

1. سقف قدرات أعلى — شغّل /ultraPlan و/ultraReview محليًا، حتى لا يحتاج كود مشروعك إلى التعرض الكامل لسحابة Claude؛
2. التكيّف مع أجهزة متعددة — يتيح البرمجة عبر الأجهزة المحمولة (داخل الشبكة المحلية)، وتتكيّف نسخة الويب مع مختلف السيناريوهات، ويسهل تضمينها في إضافات المتصفح أو طرق عرض نظام التشغيل المقسمة، كما يتوفر مثبّت أصلي؛
3. الاحتفاظ الكامل بالسجلات — اعتراض وتحليل كاملان لحمولة Claude Code، مثالي للتسجيل والتصحيح والتعلم والهندسة العكسية؛
4. مشاركة خبرات التعلم — تم جمع الكثير من المواد الدراسية وخبرات التطوير (ابحث عن أيقونات "?" في جميع أنحاء التطبيق)؛
5. الحفاظ على التجربة الأصلية — يقتصر على تعزيز قدرات Claude Code دون أي تعديلات جوهرية على النواة، مع الحفاظ على التجربة الأصلية؛
6. دعم النماذج الخارجية — متوافق مع deepseek-v4-*، وGLM 5.1، وKimi K2.6، مع وظيفة cc-switch مدمجة تتيح التبديل السريع بين الأدوات الخارجية في أي وقت.

[English](../README.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-TW.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [Deutsch](./README.de.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [Italiano](./README.it.md) | [Dansk](./README.da.md) | [Polski](./README.pl.md) | [Русский](./README.ru.md) | العربية | [Norsk](./README.no.md) | [Português (Brasil)](./README.pt-BR.md) | [ไทย](./README.th.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)

## الاستخدام

### المتطلبات الأساسية

- تأكد من تثبيت Node.js 22.0.0+؛ [التنزيل](https://nodejs.org)
- تأكد من تثبيت Claude Code؛ [دليل التثبيت](https://github.com/anthropics/claude-code)

### تثبيت ccv

#### التثبيت عبر npm

```bash
npm install -g cc-viewer --registry=https://registry.npmjs.org
```

#### التثبيت عبر Homebrew (موصى به لـ macOS / Linux)

```bash
brew tap weiesky/cc-viewer
brew install cc-viewer
brew upgrade cc-viewer   # للتحديثات — لا تستخدم npm install -g مع تثبيتات brew
```

### التشغيل

ccv هو بديل مباشر لـ claude — تُمرَّر جميع الوسائط إلى claude أثناء تشغيل Web Viewer.

```bash
ccv                    # == claude (interactive mode)
```

الأمر الأكثر استخدامًا لدى المؤلف على الإطلاق هو:
```
ccv -c --d             # == claude --continue --dangerously-skip-permissions
                       # يقوم ccv بتمرير جميع وسائط تشغيل Claude Code — يمكنك دمجها كما تشاء
```

بعد التشغيل في وضع البرمجة، ستُفتح صفحة ويب تلقائيًا.

يتوفر CC-Viewer أيضًا كتطبيق سطح مكتب أصلي: [صفحة التنزيل](https://github.com/weiesky/cc-viewer/releases)


### وضع المُسجّل (Logger)

إذا كنت لا تزال تفضّل أداة claude الأصلية أو إضافة VS Code، فاستخدم هذا الوضع.

في هذا الوضع، سيبدأ تشغيل `claude` تلقائيًا عملية تسجيل تقوم بتسجيل سجلات الطلبات إلى ~/.claude/cc-viewer/*yourproject*/date.jsonl

تفعيل وضع المُسجّل:
```bash
ccv -logger
```

عندما يتعذر على وحدة التحكم طباعة المنفذ المحدد، يكون المنفذ الأول الافتراضي هو 127.0.0.1:7008. تستخدم الحالات المتعددة منافذ متسلسلة مثل 7009 و7010.

إلغاء تثبيت وضع المُسجّل:
```bash
ccv --uninstall
```

### استكشاف الأخطاء وإصلاحها

إذا واجهت مشكلات عند بدء تشغيل cc-viewer، إليك النهج النهائي لاستكشاف الأخطاء وإصلاحها:

الخطوة 1: افتح Claude Code في أي مجلد.

الخطوة 2: أعطِ Claude Code التعليمات التالية:

```
I have installed the cc-viewer npm package, but after running ccv it still doesn't work properly. Please check cc-viewer's cli.js and findcc.js, and adapt them to the local Claude Code deployment based on the specific environment. Keep the scope of changes as constrained as possible within findcc.js.
```

السماح لـ Claude Code بتشخيص المشكلة بنفسه أكثر فاعلية من سؤال أي شخص أو قراءة أي وثائق!

بعد اكتمال التعليمات أعلاه، سيتم تحديث `findcc.js`. إذا كان مشروعك يتطلب النشر المحلي بشكل متكرر، أو إذا كان الكود المنسوخ (المتفرّع) يحتاج غالبًا إلى حل مشكلات التثبيت، فإن الاحتفاظ بهذا الملف يسمح لك ببساطة بنسخه في المرة القادمة. في هذه المرحلة، العديد من المشاريع والشركات التي تستخدم Claude Code لا تنشر على Mac بل على بيئات مستضافة من جانب الخادم، لذا قام المؤلف بفصل `findcc.js` ليسهل تتبع تحديثات الكود المصدري لـ cc-viewer في المستقبل.


### أوامر أخرى

انظر:

```bash
ccv -h
```

### الوضع الصامت

افتراضيًا، يعمل `ccv` في الوضع الصامت عند تغليف `claude`، مما يُبقي مخرجات الطرفية نظيفة ومتسقة مع التجربة الأصلية. تُلتقط جميع السجلات في الخلفية ويمكن عرضها على `http://localhost:7008`.

بمجرد التهيئة، استخدم أمر `claude` كالمعتاد. قم بزيارة `http://localhost:7008` للوصول إلى واجهة المراقبة.


## الميزات


### وضع البرمجة

بعد التشغيل باستخدام ccv، يمكنك رؤية:

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/ab353a2b-f101-409d-a28c-6a4e41571ea2" />


يمكنك عرض فروق الكود مباشرة بعد التحرير:

<img width="1500" height="728" alt="image" src="https://github.com/user-attachments/assets/2a4acdaa-fc5f-4dc0-9e5f-f3273f0849b2" />

بينما يمكنك فتح الملفات والكود يدويًا، لا يُنصح بالبرمجة اليدوية — تلك طريقة برمجة قديمة!

### البرمجة عبر الأجهزة المحمولة

يمكنك حتى مسح رمز QR للبرمجة من جهازك المحمول:

<img width="3018" height="1460" alt="image" src="https://github.com/user-attachments/assets/8debf48e-daec-420c-b37a-609f8b81cd20" />
<img width="1700" height="790" alt="image" src="https://github.com/user-attachments/assets/da3e519f-ff66-4cd2-81d1-f4e131215f6c" />

حقق تصورك للبرمجة عبر الأجهزة المحمولة. يوجد أيضًا آلية للإضافات — إذا كنت بحاجة إلى التخصيص وفقًا لعاداتك البرمجية، فترقب تحديثات خطافات الإضافات.


### وضع المُسجّل (عرض جلسات Claude Code الكاملة)

<img width="1500" height="768" alt="image" src="https://github.com/user-attachments/assets/a8a9f3f7-d876-4f6b-a64d-f323a05c4d21" />


- يلتقط جميع طلبات API من Claude Code في الوقت الفعلي، مما يضمن النص الخام — وليس السجلات المنقّحة (هذا مهم!!!)
- يحدد ويضع علامات تلقائيًا على طلبات Main Agent وSub Agent (الأنواع الفرعية: Plan، Search، Bash)
- تدعم طلبات MainAgent Body Diff JSON، حيث تعرض الفروق المطوية عن طلب MainAgent السابق (الحقول المتغيرة/الجديدة فقط)
- يعرض كل طلب إحصائيات استخدام Token المضمّنة (رموز الإدخال/الإخراج، إنشاء/قراءة الذاكرة المؤقتة، معدل الإصابة)
- متوافق مع Claude Code Router (CCR) وسيناريوهات الوكيل الأخرى — يعود إلى مطابقة نمط مسار API

### وضع المحادثة

انقر على زر "Conversation Mode" في الزاوية العلوية اليمنى لتحليل سجل المحادثة الكامل للـ Main Agent إلى واجهة دردشة:

<img width="1500" height="764" alt="image" src="https://github.com/user-attachments/assets/725b57c8-6128-4225-b157-7dba2738b1c6" />

- عرض Agent Team غير مدعوم حتى الآن
- رسائل المستخدم محاذاة لليمين (فقاعات زرقاء)، وردود Main Agent محاذاة لليسار (فقاعات داكنة)
- كتل `thinking` مطوية افتراضيًا، يتم عرضها بتنسيق Markdown — انقر للتوسيع وعرض عملية التفكير؛ يتم دعم الترجمة بنقرة واحدة (الميزة لا تزال غير مستقرة)
- تُعرض رسائل اختيار المستخدم (AskUserQuestion) بتنسيق سؤال وجواب
- مزامنة الوضع الثنائية الاتجاه: التبديل إلى وضع المحادثة يُمرّر تلقائيًا إلى المحادثة المقابلة للطلب المحدد؛ والعودة إلى الوضع الخام تُمرّر تلقائيًا إلى الطلب المحدد
- لوحة الإعدادات: تبديل حالة الطي الافتراضية لنتائج الأدوات وكتل thinking
- تصفح المحادثة على الجوال: في وضع CLI على الجوال، انقر على زر "Conversation Browse" في الشريط العلوي لتمرير عرض محادثة للقراءة فقط لتصفح سجل المحادثة الكامل على الجوال

### إدارة السجلات

من خلال قائمة CC-Viewer المنسدلة في الزاوية العلوية اليسرى:

<img width="1500" height="760" alt="image" src="https://github.com/user-attachments/assets/33295e2b-f2e0-4968-a6f1-6f3d1404454e" />

**ضغط السجلات**
فيما يخص السجلات، يود المؤلف التوضيح أن تعريفات Anthropic الرسمية لم تُعدّل، مما يضمن سلامة السجلات. ومع ذلك، نظرًا لأن إدخالات السجل الفردية من نموذج Opus ذي السياق 1M قد تصبح ضخمة للغاية في المراحل المتأخرة، وبفضل بعض تحسينات السجلات لـ MainAgent، يتحقق تقليل للحجم بنسبة 66% على الأقل دون gzip. يمكن استخراج طريقة تحليل هذه السجلات المضغوطة من المستودع الحالي.

### المزيد من الميزات المفيدة

<img width="1500" height="767" alt="image" src="https://github.com/user-attachments/assets/add558c5-9c4d-468a-ac6f-d8d64759fdbd" />

يمكنك تحديد موقع موجهاتك (prompts) بسرعة باستخدام أدوات الشريط الجانبي.

---

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/82b8eb67-82f5-41b1-89d6-341c95a047ed" />

ميزة KV-Cache-Text المثيرة تتيح لك رؤية ما يراه Claude بالضبط.

---

<img width="1500" height="765" alt="image" src="https://github.com/user-attachments/assets/54cdfa4e-677c-4aed-a5bb-5fd946600c46" />

يمكنك تحميل الصور ووصف احتياجاتك — قدرة Claude على فهم الصور قوية بشكل لا يصدق. وكما تعلم، يمكنك لصق الصور مباشرة باستخدام Ctrl+V، وسيتم عرض محتواك الكامل في المحادثة.

---

<img width="600" height="370" alt="image" src="https://github.com/user-attachments/assets/87d332ea-3e34-4957-b442-f9d070211fbf" />

يمكنك تخصيص الإضافات وإدارة جميع عمليات CC-Viewer، ويدعم CC-Viewer التبديل السريع إلى واجهات API لأطراف ثالثة (نعم، يمكنك استخدام GLM، Kimi، MiniMax، Qwen، DeepSeek — على الرغم من أن المؤلف يعتبرها جميعًا ضعيفة جدًا في هذه المرحلة).

---

<img width="1500" height="746" alt="image" src="https://github.com/user-attachments/assets/b1f60c7c-1438-4ecc-8c64-193d21ee3445" />

المزيد من الميزات بانتظار اكتشافها... على سبيل المثال: يدعم النظام Agent Team، ويحتوي على Code Reviewer مدمج. تكامل Codex Code Reviewer قادم قريبًا (يوصي المؤلف بشدة باستخدام Codex لمراجعة كود Claude Code).

## الترخيص

MIT
