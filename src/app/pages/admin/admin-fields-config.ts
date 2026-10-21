import { defaultBadgeImage } from '../../../../shared/floating-badges';
import { EditorField } from '../../shared/admin-fields/admin-fields';

export const FIELDS = {
  hero: [
    {
      key: 'badge',
      label: 'Badge / job title',
      help: 'نشان و عنوان شغلی؛ متن نشان کوچک بالای عنوان اصلی را تعیین می‌کند.',
    },
    {
      key: 'greeting',
      label: 'Greeting',
      help: 'متن خوش‌آمدگویی؛ متن کوتاهی است که پیش از نام شما در ابتدای سایت دیده می‌شود.',
    },
    {
      key: 'name',
      label: 'Name',
      help: 'نام؛ نامی را وارد کنید که در این قسمت به بازدیدکننده نمایش داده می‌شود.',
    },
    {
      key: 'roleHeadline',
      label: 'Description',
      help: 'توضیحات؛ توضیح کوتاه زیر نام شما در بخش اول سایت است.',
      type: 'textarea',
    },
    {
      key: 'profileImage',
      label: 'Profile image',
      help: 'عکس پروفایل؛ عکس اصلی بخش معرفی را انتخاب کنید. دو عنصر متحرک روی عکس با تعویض آن باقی می‌مانند.',
      type: 'image',
    },
    {
      key: 'ctaPrimaryText',
      label: 'Projects button text',
      help: 'متن دکمهٔ پروژه‌ها؛ عنوان دکمه اصلی در بخش معرفی است.',
    },
    {
      key: 'ctaPrimaryLink',
      label: 'Projects button link',
      help: 'پیوند دکمهٔ پروژه‌ها؛ مقصد دکمه اصلی را وارد کنید؛ مثلاً /#projects برای رفتن به بخش پروژه‌ها.',
    },
    {
      key: 'ctaSecondaryText',
      label: 'Resume button text',
      help: 'متن دکمهٔ رزومه؛ متن دکمه دانلود رزومه در بخش معرفی است.',
    },
  ],
  header: [
    {
      key: 'logo',
      label: 'Logo fallback text',
      help: 'متن جایگزین لوگو؛ وقتی تصویر لوگو خالی باشد، این متن به جای آن نمایش داده می‌شود.',
    },
    {
      key: 'logoAlt',
      label: 'Logo alt text',
      help: 'توضیح تصویر لوگو؛ توضیح کوتاه لوگو برای صفحه‌خوان و زمانی که تصویر بارگذاری نشود.',
    },
    {
      key: 'logoImage',
      label: 'Site logo',
      help: 'لوگوی سایت؛ تصویر لوگوی منوی بالای سایت را آپلود کنید یا آدرس آن را بدهید.',
      type: 'image',
    },
  ],
  cta: [
    {
      key: 'text',
      label: 'Button text',
      help: 'متن دکمه؛ متن این بخش را بنویسید؛ متن واردشده به بازدیدکننده نمایش داده می‌شود.',
    },
    {
      key: 'link',
      label: 'Button link',
      help: 'پیوند دکمه؛ آدرس کامل یک سایت یا مسیر داخلی مانند /projects یا #about را وارد کنید.',
    },
  ],
  nav: [
    {
      key: 'label',
      label: 'Title',
      help: 'عنوان؛ برچسب این مورد را تعیین می‌کند؛ برای اطلاعات پروژه می‌تواند نقش، مشتری یا زمان‌بندی باشد.',
    },
    {
      key: 'href',
      label: 'Link',
      help: 'پیوند؛ مقصد این گزینه منو را وارد کنید؛ برای بخش‌های صفحه اصلی از /#about یا /#projects استفاده کنید.',
    },
  ],
  badge: [
    {
      key: 'image',
      label: 'Badge image',
      type: 'icon',
      help: 'تصویر نشان را با فرمت SVG، PNG، JPG، WebP، GIF یا AVIF آپلود کنید. تصویر در همین جایگاه با همان انیمیشن شناور نمایش داده می‌شود. با Use default image می‌توانید تصویر اصلی را برگردانید. تغییرات را با دکمهٔ Save page ذخیره کنید.',
      defaultFor: (value) => defaultBadgeImage(value['positionClass']),
    },
    {
      key: 'label',
      label: 'Title',
      help: 'نام این گرافیک در پنل است؛ تصویر آپلودشده روی عکس پروفایل نمایش داده می‌شود.',
    },
    {
      key: 'icon',
      label: 'Text badge emoji (optional)',
      help: 'این گزینه برای نشان‌های متنی قدیمی است. وقتی تصویر انتخاب شده باشد، تصویر نمایش داده می‌شود و شکلک کاربردی ندارد.',
    },
    {
      key: 'positionClass',
      label: 'Position',
      help: 'موقعیت نمایش؛ محل قرارگیری نشان شناور روی عکس معرفی را انتخاب کنید.',
      type: 'select',
      options: [
        { value: 'card-top-right', label: 'Top right — Design motion' },
        { value: 'card-bottom-left', label: 'Left — Figma motion' },
      ],
    },
  ],
  project: [
    { key: 'title', label: 'Title', help: 'عنوان؛ عنوان اصلی این کارت یا بخش را تعیین می‌کند.' },
    {
      key: 'subtitle',
      label: 'Subtitle',
      help: 'زیرعنوان؛ متن کوتاه زیر عنوان اصلی این کارت یا بخش است.',
    },
    {
      key: 'description',
      label: 'Description',
      help: 'توضیحات؛ توضیحی است که همراه این کارت به بازدیدکننده نشان داده می‌شود.',
      type: 'textarea',
    },
    {
      key: 'image',
      label: 'Card image',
      help: 'تصویر کارت؛ فایل اصلی تصویر را آپلود کنید یا آدرس آن را وارد کنید. برای نمایش بزرگ، تصویر با وضوح کافی انتخاب کنید.',
      type: 'image',
    },
    {
      key: 'ctaText',
      label: 'Button text',
      help: 'متن دکمه؛ متن دکمه باز کردن این پروژه است. اگر خالی باشد، متن پیش‌فرض سایت استفاده می‌شود.',
    },
    {
      key: 'detailUrl',
      label: 'Case study link',
      help: 'پیوند مطالعهٔ موردی؛ مسیر صفحه جزئیات این پروژه است؛ مثل /project-detail?id=case-1.',
    },
  ],
  homeProject: [
    { key: 'title', label: 'Title', help: 'عنوان؛ عنوان اصلی این کارت یا بخش را تعیین می‌کند.' },
    {
      key: 'subtitle',
      label: 'Subtitle',
      help: 'زیرعنوان؛ متن کوتاه زیر عنوان اصلی این کارت یا بخش است.',
    },
    {
      key: 'description',
      label: 'Description',
      help: 'توضیحات؛ توضیحی است که همراه این کارت به بازدیدکننده نشان داده می‌شود.',
      type: 'textarea',
    },
    {
      key: 'image',
      label: 'Project image',
      help: 'تصویر پروژه؛ فایل اصلی تصویر را آپلود کنید یا آدرس آن را وارد کنید. برای نمایش بزرگ، تصویر با وضوح کافی انتخاب کنید.',
      type: 'image',
    },
    {
      key: 'ctaText',
      label: 'Button text',
      help: 'متن دکمه؛ متن دکمه باز کردن این پروژه است. اگر خالی باشد، متن پیش‌فرض سایت استفاده می‌شود.',
    },
    {
      key: 'caseStudyUrl',
      label: 'Case study link',
      help: 'پیوند مطالعهٔ موردی؛ مقصد دکمه کارت پروژه در صفحه اصلی را تعیین می‌کند.',
    },
  ],
  detail: [
    {
      key: 'title',
      label: 'Detail page title',
      help: 'عنوان صفحهٔ جزئیات؛ عنوان اصلی این کارت یا بخش را تعیین می‌کند.',
    },
    {
      key: 'subtitle',
      label: 'Detail page subtitle',
      help: 'زیرعنوان صفحهٔ جزئیات؛ متن کوتاه زیر عنوان اصلی این کارت یا بخش است.',
    },
    {
      key: 'leadSummary',
      label: 'Introduction / summary',
      help: 'معرفی و توضیحات؛ معرفی کوتاه پروژه که بالای صفحه جزئیات نمایش داده می‌شود.',
      type: 'textarea',
    },
    {
      key: 'heroImage',
      label: 'Detail hero image',
      help: 'تصویر اصلی صفحهٔ جزئیات؛ تصویر بزرگ بالای صفحه جزئیات این پروژه است.',
      type: 'image',
    },
  ],
  meta: [
    {
      key: 'label',
      label: 'Metadata label',
      help: 'عنوان اطلاعات، مانند زمان‌بندی، نقش یا مشتری؛ برچسب این مورد را تعیین می‌کند؛ برای اطلاعات پروژه می‌تواند نقش، مشتری یا زمان‌بندی باشد.',
    },
    {
      key: 'value',
      label: 'Value',
      help: 'مقدار؛ مقدار نمایش‌داده‌شده روبه‌روی برچسب یا داخل کارت است.',
    },
  ],
  sectionMetadata: [
    {
      key: 'id',
      label: 'Section anchor ID',
      help: 'شناسهٔ پیوند بخش (لاتین، یکتا و بدون فاصله)؛ شناسه مقصد لینک داخلی این بخش است. با حرف انگلیسی شروع کنید و فقط از حروف انگلیسی، عدد، خط تیره و زیرخط استفاده کنید. در همین پروژه باید یکتا باشد؛ مثلاً research.',
    },
    {
      key: 'title',
      label: 'Section title',
      help: 'عنوان بخش؛ عنوان اصلی این کارت یا بخش را تعیین می‌کند.',
    },
    {
      key: 'navTitle',
      label: 'Sidebar title (optional)',
      help: 'عنوان فهرست کناری (اختیاری)؛ نام کوتاه بخش در فهرست کناری جزئیات است. اگر خالی بماند، عنوان اصلی بخش استفاده می‌شود.',
    },
  ],
  section: [
    {
      key: 'id',
      label: 'Section anchor ID',
      help: 'شناسهٔ پیوند بخش (لاتین، یکتا و بدون فاصله)؛ شناسه مقصد لینک داخلی این بخش است. با حرف انگلیسی شروع کنید و فقط از حروف انگلیسی، عدد، خط تیره و زیرخط استفاده کنید. در همین پروژه باید یکتا باشد؛ مثلاً research.',
    },
    {
      key: 'title',
      label: 'Section title',
      help: 'عنوان بخش؛ عنوان اصلی این کارت یا بخش را تعیین می‌کند.',
    },
    {
      key: 'navTitle',
      label: 'Sidebar title (optional)',
      help: 'عنوان فهرست کناری (اختیاری)؛ نام کوتاه بخش در فهرست کناری جزئیات است. اگر خالی بماند، عنوان اصلی بخش استفاده می‌شود.',
    },
    {
      key: 'quoteFirst',
      label: 'Show quote before text',
      help: 'نمایش نقل‌قول پیش از متن؛ اگر فعال باشد، نقل‌قول پیش از متن بخش نمایش داده می‌شود.',
      type: 'checkbox',
    },
    {
      key: 'paragraphs',
      label: 'Paragraphs',
      help: 'پاراگراف‌ها؛ هر پاراگراف را در یک خط جداگانه بنویسید.',
      type: 'lines',
    },
    {
      key: 'quote',
      label: 'Quote',
      help: 'نقل‌قول؛ متن نقل‌قول را وارد کنید. در نظرات، این متن نسخه کوتاه کارت است.',
      type: 'textarea',
    },
  ],
  subsection: [
    { key: 'heading', label: 'Title', help: 'عنوان؛ عنوان این زیربخش از مطالعه موردی است.' },
    {
      key: 'text',
      label: 'Description',
      help: 'توضیحات؛ متن این بخش را بنویسید؛ متن واردشده به بازدیدکننده نمایش داده می‌شود.',
      type: 'textarea',
    },
    {
      key: 'image',
      label: 'Section image',
      help: 'تصویر بخش؛ فایل اصلی تصویر را آپلود کنید یا آدرس آن را وارد کنید. برای نمایش بزرگ، تصویر با وضوح کافی انتخاب کنید.',
      type: 'image',
    },
    {
      key: 'caption',
      label: 'Image caption',
      help: 'توضیح زیر تصویر؛ توضیح کوتاه همراه عکس است و در گالری تمام‌صفحه هم نمایش داده می‌شود.',
      type: 'textarea',
    },
  ],
  next: [
    {
      key: 'title',
      label: 'Recommended project title',
      help: 'عنوان پروژهٔ پیشنهادی؛ عنوان اصلی این کارت یا بخش را تعیین می‌کند.',
    },
    {
      key: 'description',
      label: 'Description',
      help: 'توضیحات؛ توضیحی است که همراه این کارت به بازدیدکننده نشان داده می‌شود.',
      type: 'textarea',
    },
    {
      key: 'subtitle',
      label: 'Subtitle',
      help: 'زیرعنوان؛ متن کوتاه زیر عنوان اصلی این کارت یا بخش است.',
    },
    {
      key: 'image',
      label: 'Preview image',
      help: 'تصویر پیش‌نمایش؛ فایل اصلی تصویر را آپلود کنید یا آدرس آن را وارد کنید. برای نمایش بزرگ، تصویر با وضوح کافی انتخاب کنید.',
      type: 'image',
    },
    {
      key: 'link',
      label: 'Link',
      help: 'پیوند؛ آدرس کامل یک سایت یا مسیر داخلی مانند /projects یا #about را وارد کنید.',
    },
  ],
  about: [
    {
      key: 'bio',
      label: 'Biography',
      help: 'زندگی‌نامه؛ متن معرفی شما در بخش درباره من است.',
      type: 'textarea',
    },
    {
      key: 'mindsets',
      label: 'Ideal team qualities',
      help: 'ویژگی‌های تیم دلخواه؛ هر ویژگی تیم دلخواه را در یک خط جدا بنویسید.',
      type: 'lines',
    },
    {
      key: 'skills',
      label: 'Skills and tools',
      help: 'مهارت‌ها و ابزارها؛ هر مهارت یا ابزار را در یک خط جدا وارد کنید؛ هر خط یک برچسب مستقل می‌شود.',
      type: 'lines',
    },
  ],
  stat: [
    {
      key: 'title',
      label: 'Card title',
      help: 'عنوان کارت؛ عنوان اصلی این کارت یا بخش را تعیین می‌کند.',
    },
    {
      key: 'icon',
      label: 'Card icon',
      help: 'نماد کارت؛ نماد این کارت یا نشان را انتخاب کنید.',
      type: 'select',
      options: [
        { value: 'experience', label: 'Experience' },
        { value: 'location', label: 'Location' },
        { value: 'monitor', label: 'Current activity' },
        { value: 'users', label: 'Team' },
        { value: 'skills', label: 'Skills' },
      ],
    },
    {
      key: 'backgroundImage',
      label: 'Background image',
      help: 'تصویر پس‌زمینه؛ تصویر پس‌زمینه کارت آمار را تعیین می‌کند. این فیلد اختیاری است.',
      type: 'image',
    },
    {
      key: 'value',
      label: 'Number / value',
      help: 'عدد یا مقدار؛ مقدار نمایش‌داده‌شده روبه‌روی برچسب یا داخل کارت است.',
    },
    {
      key: 'label',
      label: 'Title',
      help: 'عنوان؛ برچسب این مورد را تعیین می‌کند؛ برای اطلاعات پروژه می‌تواند نقش، مشتری یا زمان‌بندی باشد.',
    },
  ],
  experience: [
    { key: 'role', label: 'Role', help: 'نقش شغلی؛ عنوان نقش شغلی شما یا نویسنده نظر است.' },
    {
      key: 'company',
      label: 'Company',
      help: 'نام شرکت؛ نام شرکت یا تیمی است که در آن کار کرده‌اید.',
    },
    { key: 'period', label: 'Period', help: 'بازهٔ زمانی؛ بازه زمانی همکاری، مثلاً 2023–2026.' },
  ],
  testimonial: [
    {
      key: 'name',
      label: 'Name',
      help: 'نام؛ نامی را وارد کنید که در این قسمت به بازدیدکننده نمایش داده می‌شود.',
    },
    { key: 'role', label: 'Role', help: 'نقش شغلی؛ عنوان نقش شغلی شما یا نویسنده نظر است.' },
    {
      key: 'initials',
      label: 'Avatar initials',
      help: 'حروف جایگزین عکس؛ وقتی عکس نویسنده موجود نباشد، این حروف به جای آن نمایش داده می‌شوند.',
    },
    {
      key: 'quote',
      label: 'Quote preview',
      help: 'نظر؛ متن نقل‌قول را وارد کنید. در نظرات، این متن نسخه کوتاه کارت است.',
      type: 'textarea',
    },
    {
      key: 'fullQuote',
      label: 'Full quote (optional)',
      help: 'متن کامل نظر (اختیاری)؛ متن کامل نظر پس از زدن Read more نمایش داده می‌شود. پاراگراف‌ها را با خط جدید جدا کنید.',
      type: 'textarea',
    },
    {
      key: 'image',
      label: 'Author photo',
      help: 'عکس نویسنده؛ فایل اصلی تصویر را آپلود کنید یا آدرس آن را وارد کنید. برای نمایش بزرگ، تصویر با وضوح کافی انتخاب کنید.',
      type: 'image',
    },
    {
      key: 'link',
      label: 'Author link',
      help: 'پیوند نویسنده یا متن کامل نظر؛ آدرس کامل یک سایت یا مسیر داخلی مانند /projects یا #about را وارد کنید.',
    },
  ],
  photo: [
    {
      key: 'image',
      label: 'Photo',
      help: 'عکس؛ فایل اصلی تصویر را آپلود کنید یا آدرس آن را وارد کنید. برای نمایش بزرگ، تصویر با وضوح کافی انتخاب کنید.',
      type: 'image',
    },
    {
      key: 'caption',
      label: 'Photo caption',
      help: 'توضیح تصویر؛ توضیح کوتاه همراه عکس است و در گالری تمام‌صفحه هم نمایش داده می‌شود.',
    },
  ],
  footer: [
    {
      key: 'badge',
      label: 'Availability badge',
      help: 'نشان وضعیت همکاری؛ متن نشان کوچک بالای عنوان اصلی را تعیین می‌کند.',
    },
    {
      key: 'headline',
      label: 'Headline (HTML supported)',
      help: 'عنوان اصلی (با امکان قالب‌بندی)؛ عنوان اصلی دعوت به تماس در پایین سایت است؛ قالب‌بندی HTML مجاز پشتیبانی می‌شود.',
      type: 'textarea',
    },
    {
      key: 'subtext',
      label: 'Description',
      help: 'توضیحات؛ متن توضیح کوتاه زیر عنوان تماس در پایین سایت است.',
      type: 'textarea',
    },
    {
      key: 'copyright',
      label: 'Copyright',
      help: 'متن حقوق نشر؛ متن حقوق نشر در پایین‌ترین قسمت سایت نمایش داده می‌شود.',
    },
  ],
  social: [
    {
      key: 'label',
      label: 'Platform name',
      help: 'نام پلتفرم را وارد کنید؛ همین نام در فوتر کنار آیکن نمایش داده می‌شود.',
    },
    {
      key: 'link',
      label: 'Link',
      help: 'آدرس مقصد پلتفرم را وارد کنید. برای ایمیل از mailto: و برای وب‌سایت از آدرس کامل https:// استفاده کنید.',
    },
    {
      key: 'icon',
      label: 'Built-in icon',
      type: 'select',
      options: [
        { value: '', label: 'Automatic' },
        { value: 'link', label: 'Link' },
        { value: 'email', label: 'Email' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'telegram', label: 'Telegram' },
        { value: 'dribbble', label: 'Dribbble' },
      ],
      help: 'آیکن آماده را انتخاب کنید. اگر عکس یا SVG آپلود کنید، فایل آپلودشده به‌جای این آیکن نمایش داده می‌شود.',
    },
    {
      key: 'image',
      label: 'Platform image / icon',
      type: 'icon',
      help: 'عکس یا فایل SVG آپلود کنید یا آدرس فایل بدهید. فایل جایگزین آیکن آماده می‌شود. با Remove file دوباره آیکن آماده نمایش داده می‌شود. برای انتشار دکمهٔ Save page را بزنید.',
    },
  ],
  content: [
    {
      key: 'projectsTitle',
      label: 'Home projects heading',
      help: 'عنوان بخش پروژه‌های خانه؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'projectsDescription',
      label: 'Home projects description',
      help: 'توضیح بخش پروژه‌های خانه؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'allCasesText',
      label: 'All case studies button',
      help: 'متن دکمهٔ همهٔ مطالعه‌های موردی؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'aboutTitle',
      label: 'About heading',
      help: 'عنوان بخش دربارهٔ من؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'mindsetsTitle',
      label: 'Ideal team heading',
      help: 'عنوان بخش تیم دلخواه؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'skillsTitle',
      label: 'Skills heading',
      help: 'عنوان بخش مهارت‌ها؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'experienceTitle',
      label: 'Experience heading',
      help: 'عنوان بخش سوابق؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'testimonialsTitle',
      label: 'Testimonials heading',
      help: 'عنوان بخش نظرات؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'photosTitle',
      label: 'Gallery heading',
      help: 'عنوان گالری عکس‌ها؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'listingTitle',
      label: 'Case studies page heading',
      help: 'عنوان صفحهٔ مطالعه‌های موردی؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'listingDescription',
      label: 'Case studies page description',
      help: 'توضیح صفحهٔ مطالعه‌های موردی؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'overviewTitle',
      label: 'Detail sidebar heading',
      help: 'عنوان فهرست کناری جزئیات؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'exploreTitle',
      label: 'More projects heading',
      help: 'عنوان بخش پروژه‌های بیشتر؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'viewCaseText',
      label: 'Default case study button',
      help: 'متن پیش‌فرض دکمهٔ مطالعهٔ موردی؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'topText',
      label: 'Back to top text',
      help: 'متن بازگشت به بالای صفحه؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'cvTitle',
      label: 'Experience resume card title',
      help: 'عنوان کارت رزومه در سوابق؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'cvDescription',
      label: 'Experience resume card description',
      help: 'توضیح کارت رزومه در سوابق؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
    {
      key: 'testimonialMoreText',
      label: 'Read more text',
      help: 'متن پیوند ادامهٔ نظر؛ این متن در محل مشخص‌شده از عنوان یا دکمه سایت نمایش داده می‌شود. تغییرات را با دکمهٔ Save page منتشر کنید.',
    },
  ],
} satisfies Record<string, EditorField[]>;
