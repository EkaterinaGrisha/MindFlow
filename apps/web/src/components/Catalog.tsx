import { motion } from "motion/react";
import { Sigma, Bot, GitBranch } from "lucide-react";
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

export default function Catalog() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mt-4 mb-12"
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
    </div>
  );
}
