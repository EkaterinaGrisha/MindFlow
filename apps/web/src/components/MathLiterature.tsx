import { ArrowLeft, ExternalLink, Library } from "lucide-react";
import { useNavigate } from "react-router-dom";

const books = [
  {
    title: "Яндекс Практикум — Справочник по математике для анализа данных",
    link: "https://education.yandex.ru/handbook/math",
  },
  {
    title: "Зорич В.А. — Математический анализ. Книга I",
    link: "https://matan.math.msu.su/media/uploads/2020/03/V.A.Zorich-Kniga-I-10-izdanie-Corr.pdf",
  },
  {
    title: "Кострикин А.И. — Введение в алгебру. Часть 1. Основы алгебры",
    link: "https://psv4.userapi.com/s/v1/d/CkoHI5ASQZjV-bHYfj9DoOmu3GspgoqK-kczSsETcJdXq53vjkDkRCbjAL6K_ico2ANXIvzIStQhaLZ99i1cD7IF-p3nCHqAXuOzPbSq_57P04DB/Kostrikin_A_I_-_Vvedenie_v_algebru_Chast_I_Osnovy_algebry_2000_FIZMATLIT.pdf",
  },
  {
    title: "Кострикин А.И. — Введение в алгебру. Часть 2. Линейная алгебра",
    link: "https://psv4.userapi.com/s/v1/d/Q9f5oweNdQBTfM5bxdN_MVF6XNsrg739-7ifwalD0iiCDNMNK5IA60eCC2r_2nHjFVS1tX0YaAc9OBlvybjAMXQnvqft3SI58lUWtBjQHyp2gzeJ/Kostrikin_A_I_-_Vvedenie_v_algebru__Chast_2_Lineynaya_algebra_2000_FIZMATLIT.pdf",
  },
  {
    title: "Кострикин А.И. — Введение в алгебру. Часть 3. Основные структуры",
    link: "https://psv4.userapi.com/s/v1/d/nNTVixz9sQ4nSztVOF2HPjB2iZHrwgE-tbpLN_c60Vpmif1RO-E_fZhEyj3eZN5eyn6cyUxqM6huKpd9_UDpwIl6-kQWxRehEMoIxwdgjaui0VU3/Kostrikin_A_I_-_Vvedenie_v_algebru_Osnovnye_struktury_Chast_3_2004_FIZMATLIT_-_libgen_lc.pdf",
  },
  {
    title: "Кострикин А.И. — Сборник задач по алгебре",
    link: "https://halgebra.math.msu.su/taskbook/Kostrikin-2009.pdf",
  },
  {
    title: "Курс теории вероятностей и матстатистики (2019)",
    link: "https://techlibrary.ru/b2/2z1f1c1a1s1t2d2g1o1p1c_2i.2h._2s1u1r1s_1t1f1p1r1j1j_1c1f1r1p2g1t1o1p1s1t1f1k_1j_1n1a1t1f1n1a1t1j1y1f1s1l1p1k_1s1t1a1t1j1s1t1j1l1j._2019.pdf",
  },
  {
    title: "Лагутин М.Б. — Наглядная математическая статистика",
    link: "https://ditimaths.wordpress.com/wp-content/uploads/2017/10/lagutin_naglyadnaya_matematicheskaya_statistika.pdf",
  },
  {
    title: "Демидович Б.П. — Сборник задач и упражнений по математическому анализу",
    link: "https://kvm.gubkin.ru/pub/uok/Demidovich.pdf",
  },
];

export default function MathLiterature() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface px-6 py-10 md:py-14">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <button
          onClick={() => navigate("/subjects/mathematics")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          К разделам математики
        </button>

        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Library className="h-4 w-4" />
            Материалы курса
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">Использованная литература</h1>
          <p className="text-on-surface-variant">
            Подборка учебников и источников для углублённого изучения математики в анализе данных.
          </p>
        </header>

        <section className="space-y-3">
          {books.map((book, index) => (
            <article
              key={book.title}
              className="flex items-start justify-between gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5"
            >
              <div>
                <div className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-secondary">Источник {index + 1}</div>
                <h2 className="text-lg font-bold text-primary">{book.title}</h2>
              </div>
              <a
                href={book.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-outline-variant/40 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                Открыть
                <ExternalLink className="h-4 w-4" />
              </a>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
