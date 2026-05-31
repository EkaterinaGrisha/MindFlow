export type TourStep = {
  id: string;
  title: string;
  body: string;
  /** CSS selector to spotlight. Leave undefined for a centered modal step. */
  target?: string;
  /** Route to navigate to before showing this step (if user is on the wrong page). */
  route?: string;
  /** Where the bubble sits relative to the target on desktop. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Label of the primary button. Defaults to «Далее». */
  ctaLabel?: string;
  /** Schematic illustration keyword used on mobile (no spotlight there). */
  illustration?: 'graph' | 'workspace' | 'course' | 'progress';
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'graph',
    title: 'Это ваш граф знаний',
    body: 'Карта тем курса. Кружки — темы, стрелки — что на чём держится. Цвет показывает, насколько уверенно вы тему освоили: пустой кружок — ещё не трогали, насыщенный — уверенное знание, красный — есть пробел. Кликните по теме, чтобы открыть её и увидеть, что повторить.',
    target: '[data-tour="graph-link"]',
    placement: 'bottom',
    illustration: 'graph',
  },
  {
    id: 'workspace',
    title: 'Рабочее пространство AI',
    body: 'Один экран, где можно спрашивать AI-ментора, разбирать загруженные конспекты и тренироваться на карточках. Меняйте источник (тема курса / ваш PDF / вставленный текст) — и AI отвечает строго по нему, со ссылками на разделы.',
    target: '[data-tour="workspace-link"]',
    placement: 'bottom',
    illustration: 'workspace',
  },
  {
    id: 'course',
    title: 'Как устроен курс',
    body: 'Каждая тема состоит из четырёх блоков: теория объясняет идею, разборы показывают решения шаг за шагом, практика проверяет вас задачами, а лаборатории дают покрутить параметры и увидеть, как ведёт себя метод. Можно идти в любом порядке, но рекомендуем: Теория → Разборы → Практика → Лаборатории.',
    target: '[data-tour="catalog-link"]',
    placement: 'right',
    illustration: 'course',
  },
  {
    id: 'progress',
    title: 'Ваш прогресс и BKT',
    body: 'Платформа не считает баллы — она оценивает вероятность того, что вы тему действительно знаете. Это называется BKT: каждое верное и неверное действие чуть-чуть уточняет оценку. На дашборде вы видите средний уровень освоения, темы в работе и пробелы, на которые стоит вернуться.',
    target: '[data-tour="progress-card"]',
    route: '/dashboard',
    placement: 'top',
    ctaLabel: 'Понятно, вперёд!',
    illustration: 'progress',
  },
];
