import { useState } from "react";
import { Code2, Maximize2, X } from "lucide-react";

function buildSrcdoc(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#fff;font-family:system-ui,sans-serif;overflow:hidden;width:100%;height:100vh}
  #root{width:100%;height:100%;padding:12px}
  canvas{display:block}
</style>
</head>
<body>
<div id="root"></div>
<script>
(function(){
try{
${code}
}catch(e){
  document.getElementById('root').innerHTML='<pre style="color:#dc2626;font-size:11px;padding:10px;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;white-space:pre-wrap">'+e.message+'</pre>';
}
})();
</script>
</body></html>`;
}

export default function VisualizationCard({ code }: { code: string }) {
  const [expanded, setExpanded] = useState(false);
  const srcdoc = buildSrcdoc(code);

  return (
    <div className="my-3 rounded-2xl border-2 border-violet-200/70 bg-violet-50/30 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-violet-100/50 border-b border-violet-200/50">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-200 text-violet-800 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
          <Code2 size={11} /> Визуализация
        </span>
        <button
          onClick={() => setExpanded(true)}
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-violet-300/60 bg-white px-2 py-0.5 text-[11px] font-medium text-violet-700 hover:bg-violet-50 transition-colors"
        >
          <Maximize2 size={11} /> Развернуть
        </button>
      </div>

      {/* Inline preview */}
      <iframe
        sandbox="allow-scripts"
        srcDoc={srcdoc}
        style={{ width: "100%", height: 280, border: "none", display: "block" }}
        title="Визуализация"
      />

      {/* Expanded modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl bg-white overflow-hidden shadow-2xl"
            style={{ height: "82vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-outline-variant/20 bg-violet-50/80 shrink-0">
              <Code2 size={14} className="text-violet-600" />
              <span className="text-sm font-semibold text-violet-700 flex-1">Визуализация</span>
              <button
                onClick={() => setExpanded(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-violet-100 transition-colors"
                title="Закрыть"
              >
                <X size={16} />
              </button>
            </div>
            <iframe
              sandbox="allow-scripts"
              srcDoc={srcdoc}
              style={{ width: "100%", height: "calc(100% - 48px)", border: "none", display: "block" }}
              title="Визуализация (развёрнуто)"
            />
          </div>
        </div>
      )}
    </div>
  );
}
