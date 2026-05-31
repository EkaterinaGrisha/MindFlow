import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Compass,
  GraduationCap,
  HelpCircle,
  Keyboard,
  LineChart,
  Lightbulb,
  Map,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import GuideSection from './guide/GuideSection';
import FAQItem from './guide/FAQItem';
import {
  AIRolesInfographic,
  BKTComparisonInfographic,
  BKTScaleInfographic,
  CourseCycleInfographic,
  GraphMapInfographic,
  WorkspaceLayoutInfographic,
} from './guide/Infographics';

type TocItem = { id: string; label: string };

const TOC: TocItem[] = [
  { id: 'what', label: 'Что такое эта платформа' },
  { id: 'graph', label: 'Как работает граф знаний' },
  { id: 'ai', label: 'Как AI-ментор помогает' },
  { id: 'structure', label: 'Структура курса' },
  { id: 'bkt', label: 'Как считается прогресс (BKT)' },
  { id: 'faq', label: 'Частые вопросы' },
  { id: 'tips', label: 'Советы по обучению' },
  { id: 'keys', label: 'Горячие клавиши' },
  { id: 'privacy', label: 'Данные и приватность' },
];

export default function Guide() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Scroll to hash anchor on mount.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }, []);

  const visibleToc = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOC;
    return TOC.filter((t) => t.label.toLowerCase().includes(q));
  }, [query]);

  const visibleIds = useMemo(() => new Set(visibleToc.map((t) => t.id)), [visibleToc]);

  const sectionVisible = (id: string) => !query.trim() || visibleIds.has(id);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться к обучению
        </button>
        <Link
          to="/dashboard?tour=1"
          className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary transition-colors w-fit"
        >
          <Sparkles className="w-4 h-4" />
          Запустить тур по интерфейсу
        </Link>
      </div>

      {/* Header */}
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary mb-3">
          <BookOpen className="h-4 w-4" />
          Как это работает
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary mb-3 leading-tight">
          Гайд по MindFlow
        </h1>
        <p className="text-on-surface-variant text-lg max-w-3xl leading-relaxed">
          Простыми словами объясняем, как устроена платформа: граф знаний, AI-ментор, структура
          курсов и почему оценка прогресса умнее обычного «5 из 10».
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        {/* ToC */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск разделов"
              className="w-full bg-surface-container-low border-none rounded-xl py-2 pl-9 pr-12 text-sm focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-on-surface-variant bg-surface-container-high rounded px-1.5 py-0.5 hidden md:inline-block">
              ⌘K
            </kbd>
          </div>
          <nav className="text-sm">
            <ul className="space-y-1">
              {visibleToc.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className="block px-3 py-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
                  >
                    {t.label}
                  </a>
                </li>
              ))}
              {visibleToc.length === 0 && (
                <li className="text-xs text-on-surface-variant px-3 py-2">Ничего не нашлось.</li>
              )}
            </ul>
          </nav>
        </aside>

        {/* Body */}
        <article className="space-y-14">
          {sectionVisible('what') && (
            <GuideSection
              id="what"
              number={1}
              icon={<Compass className="w-6 h-6" />}
              title="Что такое эта платформа"
              lead="Адаптивный курс с AI-помощником. Не просто читаете теорию — задаёте вопросы, решаете задачи, и система подстраивается под ваш уровень."
            >
              <p>
                MindFlow собран вокруг математики для Data Science, ML и алгоритмов. Главная идея —
                вы учитесь не по линейному учебнику, а через граф связанных тем. Платформа всё
                время «видит», что вам уже понятно, а где есть пробелы, и подсказывает, что брать
                дальше.
              </p>
              <p>
                Внутри три ключевых инструмента: <b>граф знаний</b> (карта тем), <b>AI Workspace</b>{' '}
                (чат-ассистент со ссылками на ваш материал) и сам <b>курс</b> с теорией,
                разборами, практикой и интерактивными лабораториями.
              </p>
            </GuideSection>
          )}

          {sectionVisible('graph') && (
            <GuideSection
              id="graph"
              number={2}
              icon={<Map className="w-6 h-6" />}
              title="Как работает граф знаний"
              lead="Карта тем со стрелками: кто на чём держится. Цвет показывает уровень освоения."
            >
              <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-4 md:p-6">
                <GraphMapInfographic />
              </div>
              <p>
                <b>Уровни:</b> снизу — фундамент (векторы, матрицы), сверху — продвинутые темы
                (SVD, PCA, регрессия). Чем выше тема, тем больше «фундамента» она требует.
              </p>
              <p>
                <b>Цвета и заливка</b> показывают, насколько уверенно вы знаете тему:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Пустой кружок — ещё не открывали.</li>
                <li>Светлый — в работе, есть прогресс.</li>
                <li>Насыщенный — уверенное знание.</li>
                <li>Красный — был пробел, нужно вернуться.</li>
              </ul>
              <p>
                <b>Что происходит при клике на тему:</b> справа открывается панель — что в теме,
                на что она опирается, что от неё зависит, и кнопки «Открыть тему» / «Спросить
                AI».
              </p>
              <p>
                <b>Связи между темами.</b> Стрелки показывают зависимости: если из темы А идёт
                стрелка в Б — сначала разберитесь с А. Платформа учитывает это в рекомендациях.
              </p>
              <p>
                <b>Карточки «Зачем учить вместе».</b> Темы из разных разделов объединяются вокруг
                реальных применений: ML-модели, A/B-тесты, PCA. Так видно, для чего вам нужны
                векторы, ранг и собственные значения одновременно.
              </p>
            </GuideSection>
          )}

          {sectionVisible('ai') && (
            <GuideSection
              id="ai"
              number={3}
              icon={<Bot className="w-6 h-6" />}
              title="Как AI-ментор помогает учиться"
              lead="Единое пространство, где AI отвечает строго по выбранному источнику и с цитатами."
            >
              <p>
                <b>AI Workspace</b> — один экран с тремя зонами:
              </p>
              <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-4 md:p-6">
                <WorkspaceLayoutInfographic />
              </div>
              <p>
                Слева — <b>источники</b>: тема из курса, ваш PDF, вставленный текст или заметки. То,
                что выбрано, ограничивает кругозор AI — он не будет фантазировать «вообще про
                математику», а отвечает по вашему материалу и даёт ссылки на конкретные куски.
              </p>
              <p>
                В центре — <b>чат</b>. Справа — <b>инструменты</b>: карточки для самопроверки,
                цитаты, заметка, мини-карта темы.
              </p>
              <p className="!mt-6 font-semibold text-primary">Три роли AI и когда какую выбрать:</p>
              <AIRolesInfographic />
              <p>
                Совет: переключайте роли по задаче. Сложный вопрос → Ментор. Готовитесь к экзамену
                → Экзаменатор. Хотите план на неделю → Методист.
              </p>
            </GuideSection>
          )}

          {sectionVisible('structure') && (
            <GuideSection
              id="structure"
              number={4}
              icon={<GraduationCap className="w-6 h-6" />}
              title="Структура курса: теория, разборы, практика, лаборатории"
              lead="Каждая тема устроена одинаково — четыре блока. Можно идти по порядку или нырять туда, где интереснее."
            >
              <CourseCycleInfographic />
              <p>
                <b>Прогресс по теме</b> складывается из всех четырёх блоков с разным весом:
                практика и лабы дают больше, чем просто чтение теории. Это честно: одно «прочитал»
                не равно «понял».
              </p>
              <p className="bg-secondary/10 text-primary rounded-xl px-4 py-3 border border-secondary/20">
                <b>Рекомендуем порядок:</b> Теория → Разборы → Практика → Лаборатории. Но
                строго не настаиваем — если хочется начать с лабы и потом подобрать теорию, тоже
                рабочий способ.
              </p>
            </GuideSection>
          )}

          {sectionVisible('bkt') && (
            <GuideSection
              id="bkt"
              number={5}
              icon={<LineChart className="w-6 h-6" />}
              title="Как считается ваш прогресс (BKT)"
              lead="BKT — это байесовская модель: она оценивает вероятность того, что вы тему освоили, а не просто счёт правильных ответов."
            >
              <BKTScaleInfographic />
              <p>Платформа учитывает несколько сигналов:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Правильность ответа (главный сигнал).</li>
                <li>Скорость — слишком быстро и неверно ≠ просто ошибка наугад.</li>
                <li>Повторные ошибки по той же теме весят больше.</li>
                <li>
                  Перерывы между занятиями: если давно не заходили, оценка чуть «стареет» — это
                  моделирует забывание.
                </li>
              </ul>
              <p className="font-semibold text-primary !mt-6">Почему это лучше обычного теста</p>
              <BKTComparisonInfographic />
              <p>
                В итоге вы видите не баллы, а вероятность владения темой — и подсветку конкретных
                подтем, где провал. Это и есть «адаптивность»: следующая рекомендация строится из
                ваших слабых мест.
              </p>
            </GuideSection>
          )}

          {sectionVisible('faq') && (
            <GuideSection
              id="faq"
              number={6}
              icon={<HelpCircle className="w-6 h-6" />}
              title="Часто задаваемые вопросы"
            >
              <div className="space-y-3 !text-on-surface">
                <FAQItem question="Как добавить свой учебник?">
                  Загрузите PDF или DOCX во вкладке «Источники» в AI Workspace. После индексации
                  AI начнёт отвечать по вашему файлу со ссылками на разделы.
                </FAQItem>
                <FAQItem question="AI ошибается?">
                  Иногда да — это языковая модель, а не справочник. Всегда сверяйте ключевые
                  факты с цитатами в ответе и с источниками. Если ответа в материале нет, AI
                  должен честно об этом сказать.
                </FAQItem>
                <FAQItem question="Можно ли учиться без AI?">
                  Да. Вся теория, разборы и практика доступны и без AI — это самостоятельный
                  курс. AI делает обучение быстрее и персональнее, но не обязателен.
                </FAQItem>
                <FAQItem question="Как сбросить прогресс?">
                  В настройках профиля есть кнопка «Сбросить прогресс». Действие необратимо — все
                  оценки BKT и история практики обнулятся.
                </FAQItem>
                <FAQItem question="Как формируются рекомендации следующей темы?">
                  AI смотрит на ваш граф: какие темы освоены, какие в работе, какие связаны
                  стрелками. Рекомендуется та, что ближе всего к освоенным и нужна, чтобы
                  двигаться вверх по графу.
                </FAQItem>
                <FAQItem question="Где увидеть, на что AI ссылается?">
                  Под ответом AI есть блок «Цитаты». Клик по цитате открывает соответствующий
                  фрагмент в исходнике — теории темы или вашем PDF.
                </FAQItem>
              </div>
            </GuideSection>
          )}

          {sectionVisible('tips') && (
            <GuideSection
              id="tips"
              number={7}
              icon={<Lightbulb className="w-6 h-6" />}
              title="Советы по эффективному обучению"
            >
              <ul className="space-y-3">
                {[
                  'Занимайтесь регулярно, хотя бы 20 минут в день — короткие сессии работают лучше марафонов.',
                  'Не бойтесь ошибаться: каждая ошибка делает оценку BKT точнее, а слабое место — видимым.',
                  'Задавайте AI конкретные вопросы. Не «расскажи про матрицы», а «как перемножить матрицы 2×3 и 3×2».',
                  'Раз в неделю включайте режим Экзаменатора — он покажет реальный уровень без «иллюзии знания».',
                  'Проходите карточки «Зачем учить вместе» — они связывают теорию с реальными ML/A-B/PCA задачами.',
                  'Если AI отвечает не по делу — поменяйте источник в левой панели Workspace.',
                ].map((t, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 bg-surface-container-lowest rounded-xl px-4 py-3 border border-outline-variant/20"
                  >
                    <span className="shrink-0 w-6 h-6 rounded-full bg-secondary/15 text-secondary text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-on-surface-variant">{t}</span>
                  </li>
                ))}
              </ul>
            </GuideSection>
          )}

          {sectionVisible('keys') && (
            <GuideSection
              id="keys"
              number={8}
              icon={<Keyboard className="w-6 h-6" />}
              title="Горячие клавиши и жесты"
              lead="Несколько мелочей, которые делают навигацию быстрее."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  ['⌘K / Ctrl+K', 'Фокус на поиск в этом гайде'],
                  ['Enter / →', 'Следующий шаг в туре'],
                  ['←', 'Назад в туре'],
                  ['Esc', 'Закрыть тур или модальное окно'],
                  ['Выделить текст', 'Появляется кнопка «Объяснить» — мгновенный вопрос AI'],
                  ['Клик по теме графа', 'Открывает панель с деталями и кнопками действий'],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest p-3 flex items-start gap-3"
                  >
                    <kbd className="shrink-0 text-[11px] font-bold bg-surface-container-high text-primary rounded px-2 py-1">
                      {k}
                    </kbd>
                    <span className="text-on-surface-variant">{v}</span>
                  </div>
                ))}
              </div>
            </GuideSection>
          )}

          {sectionVisible('privacy') && (
            <GuideSection
              id="privacy"
              number={9}
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Данные и приватность"
              lead="Что хранится, что попадает в AI и как всё это удалить."
            >
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <b>Что хранится:</b> ваш профиль, прогресс по темам, история диалогов с AI и
                  загруженные файлы — всё привязано к вашему аккаунту.
                </li>
                <li>
                  <b>Что попадает в AI:</b> ваш текущий вопрос, выбранный источник (тема или
                  ваш файл) и краткий контекст из истории — ровно столько, чтобы ответ был
                  релевантным.
                </li>
                <li>
                  <b>Загруженные файлы</b> разбиваются на фрагменты и индексируются локально для
                  поиска. Они доступны только вам.
                </li>
                <li>
                  <b>Сбросить прогресс или удалить аккаунт</b> можно в настройках профиля. После
                  удаления учётной записи личные данные стираются.
                </li>
              </ul>
            </GuideSection>
          )}

          {/* Bottom CTA */}
          <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-6 md:p-8 text-center">
            <h3 className="text-xl md:text-2xl font-extrabold text-primary mb-2">
              Готовы продолжить?
            </h3>
            <p className="text-on-surface-variant mb-5 max-w-2xl mx-auto">
              Возвращайтесь к графу или откройте дашборд — у вас всё подсвечено по уровню
              освоения, ничего не пропустите.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity"
              >
                <ArrowLeft className="w-4 h-4" />
                Вернуться к обучению
              </Link>
              <Link
                to="/graph"
                className="inline-flex items-center gap-2 border border-outline-variant/30 text-primary font-semibold text-sm rounded-xl px-5 py-2.5 hover:bg-surface-container-low transition-colors"
              >
                Открыть граф знаний
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
