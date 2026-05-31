import { useMemo, useState } from 'react';

type Matrix = number[][];

const T = {
  text: '#1e293b',
  muted: '#64748b',
  mutedLight: '#94a3b8',
  primary: '#6366f1',
  primaryLight: '#eef2ff',
  primaryBorder: '#c7d2fe',
  primaryDark: '#4f46e5',
  accent: '#7c3aed',
  green: '#10b981',
  greenLight: '#d1fae5',
  amber: '#f59e0b',
  amberLight: '#fef3c7',
  red: '#ef4444',
  redLight: '#fee2e2',
  white: '#ffffff',
  surface: '#f8fafc',
  border: '#e2e8f0',
  cyan: '#06b6d4',
  violet: '#8b5cf6',
  pink: '#ec4899',
};

function rref(input: Matrix, eps = 1e-9) {
  const m = input.map((row) => [...row]);
  let row = 0;
  const pivotCols: number[] = [];
  for (let col = 0; col < 3 && row < 3; col++) {
    let pivot = row;
    for (let r = row + 1; r < 3; r++)
      if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    if (Math.abs(m[pivot][col]) < eps) continue;
    [m[row], m[pivot]] = [m[pivot], m[row]];
    const div = m[row][col];
    m[row] = m[row].map((v) => v / div);
    for (let r = 0; r < 3; r++) {
      if (r !== row) {
        const factor = m[r][col];
        m[r] = m[r].map((v, c) => v - factor * m[row][c]);
      }
    }
    pivotCols.push(col);
    row++;
  }
  return {
    matrix: m.map((line) => line.map((v) => (Math.abs(v) < 1e-8 ? 0 : Math.round(v * 1000) / 1000))),
    rank: row,
    pivotCols,
  };
}

const RANK_META: Record<number, { label: string; color: string; bg: string; border: string; explain: string }> = {
  3: { label: 'Ранг = 3', color: T.green, bg: T.greenLight, border: '#6ee7b7', explain: 'Все три строки линейно независимы. Матрица невырожденная — обратная существует, система имеет единственное решение.' },
  2: { label: 'Ранг = 2', color: T.amber, bg: T.amberLight, border: '#fcd34d', explain: 'Одна из строк — линейная комбинация двух других. Матрица вырождена: строки «живут» в двумерном подпространстве.' },
  1: { label: 'Ранг = 1', color: T.red, bg: T.redLight, border: '#fca5a5', explain: 'Все строки пропорциональны. Вся информация помещается в одну строку — крайняя вырожденность.' },
  0: { label: 'Ранг = 0', color: T.muted, bg: T.surface, border: T.border, explain: 'Нулевая матрица. Полное отсутствие информации.' },
};

const PRESETS = [
  { label: 'Полный ранг', hint: 'Все строки независимы', matrix: [[2, 1, -1], [0, 3, 2], [1, -2, 4]] },
  { label: 'R₃ = R₁ + R₂', hint: 'Третья строка — сумма первых двух', matrix: [[1, 2, 1], [0, 1, 3], [1, 3, 4]] },
  { label: 'Две пропорц.', hint: 'R₂ = 2·R₁', matrix: [[1, 2, 3], [2, 4, 6], [0, 1, -1]] },
  { label: 'Нулевая строка', hint: 'Третья строка — нули', matrix: [[1, 0, 2], [0, 1, -1], [0, 0, 0]] },
];

export default function GaussianRankLab() {
  const [matrix, setMatrix] = useState<Matrix>(PRESETS[0].matrix);

  const { matrix: echelon, rank, pivotCols } = useMemo(() => rref(matrix), [matrix]);

  const setCell = (r: number, c: number, value: number) =>
    setMatrix((m) => m.map((row, ri) => row.map((x, ci) => (ri === r && ci === c ? value : x))));

  const meta = RANK_META[rank];

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: T.text }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: T.primaryLight, border: `1.5px solid ${T.primaryBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>📐</div>
          <h4 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text }}>
            Лаборатория: Ранг матрицы методом Гаусса
          </h4>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.6 }}>
          Меняй значения ячеек матрицы — и смотри, как метод Гаусса приводит её к ступенчатому виду
          и вычисляет ранг в реальном времени. Следи за тем, когда и почему ранг падает.
        </p>
      </div>

      {/* What the student does */}
      <div style={{
        background: T.primaryLight, border: `1px solid ${T.primaryBorder}`,
        borderRadius: 14, padding: '12px 16px', marginBottom: 20,
        fontSize: 13, color: T.primaryDark, lineHeight: 1.7,
      }}>
        <b>Что делает студент:</b> двигает слайдеры (или выбирает пресет) → видит исходную матрицу А
        и её приведённый ступенчатый вид → считает ненулевые строки → это и есть ранг.
        Попробуй сделать две строки одинаковыми — ранг упадёт мгновенно.
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setMatrix(p.matrix)}
            title={p.hint}
            style={{
              padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: `1.5px solid ${T.primaryBorder}`, background: T.primaryLight,
              color: T.primaryDark, cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = T.primaryBorder)}
            onMouseLeave={e => (e.currentTarget.style.background = T.primaryLight)}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setMatrix(Array.from({ length: 3 }, () =>
            Array.from({ length: 3 }, () => Math.floor(Math.random() * 13) - 6)))}
          style={{
            padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            border: `1.5px solid ${T.border}`, background: T.surface,
            color: T.muted, cursor: 'pointer',
          }}
        >
          🎲 Случайная
        </button>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

        {/* Input matrix */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 18, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
            Матрица A — меняй элементы
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {matrix.map((row, r) => (
              <div key={r} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {row.map((v, c) => (
                  <div key={c} style={{
                    background: T.surface, border: `1.5px solid ${T.border}`,
                    borderRadius: 12, padding: '10px 10px 8px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: T.mutedLight, marginBottom: 6 }}>
                      <span>a<sub>{r + 1}{c + 1}</sub></span>
                      <span style={{ color: T.primary, fontWeight: 800 }}>{v}</span>
                    </div>
                    <input
                      type="range" min={-9} max={9} step={1} value={v}
                      onChange={(e) => setCell(r, c, Number(e.target.value))}
                      style={{ width: '100%', accentColor: T.primary }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: T.mutedLight }}>
            Строки: {matrix.map((r, i) => `R${i + 1}=[${r.join(',')}]`).join('  ')}
          </div>
        </div>

        {/* Echelon form + rank */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 18, padding: 20, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
              Ступенчатый вид (RREF)
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: T.mutedLight }}>
              Алгоритм Гаусса зануляет элементы под каждым ведущим — ненулевые строки и есть ранг.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {echelon.flatMap((row, r) =>
                row.map((v, c) => {
                  const isPivot = v !== 0 && pivotCols[r] === c;
                  return (
                    <div key={`${r}-${c}`} style={{
                      borderRadius: 10, padding: '10px 6px', textAlign: 'center',
                      fontFamily: 'monospace', fontSize: 15, fontWeight: 800,
                      background: isPivot ? T.primaryLight : v === 0 ? T.greenLight : T.surface,
                      border: `1.5px solid ${isPivot ? T.primaryBorder : v === 0 ? '#6ee7b7' : T.border}`,
                      color: isPivot ? T.primaryDark : v === 0 ? T.green : T.text,
                      transition: 'all .25s',
                    }}>
                      {v}
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: T.mutedLight }}>
              <span style={{ color: T.primaryDark, fontWeight: 700 }}>■ фиолетовый</span> — ведущий элемент (pivot) &nbsp;
              <span style={{ color: T.green, fontWeight: 700 }}>■ зелёный</span> — нулевой элемент
            </div>
          </div>

          {/* Rank badge */}
          <div style={{
            background: meta.bg, border: `1.5px solid ${meta.border}`,
            borderRadius: 18, padding: '18px 20px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: meta.color, marginBottom: 4 }}>
              Результат
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: meta.color, color: T.white,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, fontWeight: 900, flexShrink: 0,
              }}>
                {rank}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: meta.color }}>{meta.label}</div>
                <div style={{ fontSize: 13, color: T.text, marginTop: 4, lineHeight: 1.5 }}>{meta.explain}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-step hint */}
      <div style={{
        marginTop: 16, background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 14, padding: '14px 16px', fontSize: 13, color: T.muted, lineHeight: 1.7,
      }}>
        <b style={{ color: T.text }}>📌 Что наблюдать:</b>
        {' '}Сделай R₃ = R₁ + R₂ (пресет выше) — ранг станет 2.
        Сделай R₂ = 2·R₁ — ранг 1. Верни независимые строки — ранг вернётся к 3.
        Ранг = количество «по-настоящему разных» строк, которые нельзя выразить друг через друга.
      </div>
    </div>
  );
}
