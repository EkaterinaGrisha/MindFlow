import { motion } from "motion/react";
import { Brain, ArrowLeft, ArrowRight, Sigma, Bot, GitBranch, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categories = [
  {
    id: "math-for-data-science",
    title: "Математика для Data Science",
    desc: "Линейная алгебра, теория вероятностей и матан как база для аналитики и ML.",
    icon: Sigma,
  },
  {
    id: "machine-learning",
    title: "Машинное обучение (ML)",
    desc: "Ключевые модели, практика на данных и построение пайплайнов от идеи до продакшена.",
    icon: Bot,
  },
  {
    id: "algorithms",
    title: "Алгоритмы и структуры данных",
    desc: "Разбор алгоритмического мышления, оптимизации и паттернов решения задач.",
    icon: GitBranch,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full max-w-screen-xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Brain className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-primary">MindFlow</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Reports button */}
          <button
            onClick={() => navigate("/reports")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/40 text-sm font-semibold text-on-surface-variant hover:text-primary hover:border-primary/30 hover:bg-surface-container-low transition-all"
          >
            <FileText className="w-4 h-4" />
            Отчёты
          </button>
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant text-sm font-medium">Шаг 1 из 3</span>
            <div className="w-32 h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-gradient-to-r from-secondary to-purple-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center px-6 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mt-12 mb-16 text-center md:text-left"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary mb-4 leading-tight">
            Выберите стартовый курс
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl">
            Начните с одного из базовых курсов — дальше платформа соберёт для вас персональный трек обучения.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(`/courses/${cat.id}`)}
              className="group relative flex flex-col text-left bg-surface-container-lowest p-8 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-secondary ring-offset-8"
            >
              <div className="w-14 h-14 mb-6 rounded-2xl bg-surface-container-low flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <cat.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">{cat.title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">{cat.desc}</p>
            </motion.button>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-8 flex justify-center bg-surface/80 backdrop-blur-xl">
          <div className="w-full max-w-4xl flex items-center justify-between">
            <button className="text-on-surface-variant font-semibold hover:text-primary transition-colors flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>
            <button 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-3 px-10 py-5 bg-primary text-white font-bold text-lg rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Далее
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>

      <div className="fixed top-0 right-0 -z-10 opacity-20 pointer-events-none overflow-hidden h-screen w-1/3">
        <div className="absolute top-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-secondary/30 to-purple-500/10 blur-3xl"></div>
      </div>
    </div>
  );
}
