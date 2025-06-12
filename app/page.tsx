"use client";
import React, { useState, useRef, useEffect } from "react";

const API_TOKEN = "AIzaSyA8bq6ladVcqMhZ_33Ocl1fMSrmOjmZc0M"; // Token fixo de produção

type QA = {
  question: string;
  answer: string;
  date?: string;
  favorite?: boolean;
  request?: any;
  response?: any;
};

export default function Home() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QA[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("wa-history");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [search, setSearch] = useState("");
  const answerRef = useRef<HTMLDivElement>(null);

  // Persist history
  useEffect(() => {
    localStorage.setItem("wa-history", JSON.stringify(history));
  }, [history]);

  // Scroll para nova resposta
  useEffect(() => {
    if (answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!question.trim()) return;
    setLoading(true);

    const requestPayload = { question };
    let responsePayload = null;

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify(requestPayload),
      });
      const data = await res.json();
      responsePayload = data;
      if (!res.ok) {
        setError(data.error || "Erro desconhecido.");
      } else {
        setHistory([
          {
            question,
            answer: data.resposta,
            date: new Date().toISOString(),
            favorite: false,
            request: requestPayload,
            response: responsePayload,
          },
          ...history,
        ]);
        setQuestion("");
      }
    } catch {
      setError("Erro de conexão.");
    }
    setLoading(false);
  }

  function handleClearHistory() {
    setHistory([]);
    setError("");
  }

  function handleClearQuestion() {
    setQuestion("");
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
  }

  function handleExport() {
    const content = history
      .map(
        (item, i) =>
          `Pergunta ${history.length - i}: ${item.question}\nResposta: ${item.answer}\nData: ${item.date}\nFavorito: ${item.favorite ? "Sim" : "Não"}\n`
      )
      .join("\n----------------------\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wa-historico.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) setHistory(imported);
      } catch {
        setError("Arquivo inválido.");
      }
    };
    reader.readAsText(file);
  }

  function handleRedo() {
    if (history.length > 0) {
      setQuestion(history[0].question);
    }
  }

  function handleDelete(idx: number) {
    setHistory(history.filter((_, i) => i !== idx));
  }

  function handleEdit(idx: number) {
    setQuestion(history[idx].question);
  }

  function handleFavorite(idx: number) {
    setHistory((history) =>
      history.map((item, i) =>
        i === idx ? { ...item, favorite: !item.favorite } : item
      )
    );
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  // Filtro de histórico por busca
  const filteredHistory = search
    ? history.filter(
        (item) =>
          item.question.toLowerCase().includes(search.toLowerCase()) ||
          item.answer.toLowerCase().includes(search.toLowerCase())
      )
    : history;

  // Estimativa simples de tokens (palavras)
  const tokenCount = history.reduce(
    (acc, qa) =>
      acc +
      (qa.question ? qa.question.split(/\s+/).length : 0) +
      (qa.answer ? qa.answer.split(/\s+/).length : 0),
    0
  );

  // Cores do tema
  const orange = "#ff7900";
  const orangeLight = "#ffe5cc";
  const orangeDark = "#cc6300";

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start"
      style={{
        background: "#fff",
        color: "#222",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <header
        className="w-full py-6 px-4 flex flex-col md:flex-row items-center justify-between"
        style={{
          background: orange,
          color: "#fff",
          borderBottom: `4px solid ${orangeDark}`,
        }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/logo-whatsai.png"
            alt="Whats AI Logo"
            style={{ width: 48, height: 48, borderRadius: 12, background: "#fff" }}
            onError={(e: any) => (e.target.style.display = "none")}
          />
          <h1 className="text-3xl font-bold tracking-tight">Whats AI API</h1>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2 items-center">
          <input
            type={showToken ? "text" : "password"}
            value={API_TOKEN}
            readOnly
            className="p-2 rounded border border-gray-300 bg-gray-100 text-gray-500 text-xs w-40"
            title="Token fixo de produção"
            style={{ background: orangeLight, color: orangeDark }}
          />
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="text-xs px-2 py-1 rounded border border-white"
            style={{
              background: showToken ? orangeDark : orange,
              color: "#fff",
            }}
            title={showToken ? "Ocultar token" : "Mostrar token"}
          >
            {showToken ? "Ocultar" : "Mostrar"}
          </button>
          <span className="text-xs font-semibold">Token fixo</span>
        </div>
      </header>

      <section className="w-full max-w-2xl px-4 py-6">
        <form
          onSubmit={handleAsk}
          className="flex flex-col md:flex-row gap-2 mb-4"
        >
          <input
            type="text"
            placeholder="Digite sua pergunta para a IA..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 p-3 rounded border border-gray-300"
            style={{ background: orangeLight, color: orangeDark }}
            disabled={loading}
            autoFocus
            maxLength={500}
          />
          <button
            type="submit"
            className="bg-[#ff7900] hover:bg-[#cc6300] text-white px-6 py-3 rounded font-bold transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Perguntar"}
          </button>
          <button
            type="button"
            onClick={handleClearQuestion}
            className="bg-gray-200 text-gray-700 px-4 py-3 rounded hover:bg-gray-300"
            title="Limpar campo"
            disabled={loading || !question}
          >
            Limpar
          </button>
        </form>
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Buscar no histórico..."
            value={search}
            onChange={handleSearch}
            className="flex-1 p-2 rounded border border-gray-300"
            style={{ background: "#fff" }}
          />
          <button
            onClick={handleRedo}
            className="text-sm text-[#ff7900] font-semibold hover:underline"
            disabled={history.length === 0}
            title="Refazer última pergunta"
          >
            Refazer
          </button>
          <button
            onClick={handleExport}
            className="text-sm text-green-600 font-semibold hover:underline"
            disabled={history.length === 0}
            title="Exportar histórico"
          >
            Exportar
          </button>
          <label className="text-sm text-blue-600 font-semibold hover:underline cursor-pointer">
            Importar
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={handleClearHistory}
            className="text-sm text-gray-500 font-semibold hover:underline"
            disabled={history.length === 0}
            title="Limpar histórico"
          >
            Limpar histórico
          </button>
        </div>
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-2">{error}</div>
        )}
        <div className="mb-2 text-xs text-gray-700">
          Total de tokens (estimado): <b>{tokenCount}</b>
        </div>
        <div className="mb-4 text-xs text-gray-700">
          <b>Dica:</b> Faça perguntas sobre qualquer assunto e veja a resposta da IA. Clique em "♥" para favoritar, "Editar" para refazer, "Excluir" para remover, ou "Copiar" para copiar a resposta.
        </div>
        <div className="space-y-4">
          {filteredHistory.length === 0 && (
            <div className="text-gray-400">Nenhuma pergunta feita ainda.</div>
          )}
          {filteredHistory.map((item, idx) => (
            <div
              key={idx}
              className={`bg-white border-l-4 ${
                item.favorite ? "border-[#ff7900]" : "border-gray-200"
              } p-4 rounded shadow-sm relative`}
              ref={idx === 0 ? answerRef : undefined}
              style={{
                boxShadow: "0 2px 8px rgba(255,121,0,0.06)",
              }}
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <span className="font-semibold text-[#ff7900]">
                    #{filteredHistory.length - idx} Você:
                  </span>{" "}
                  {item.question}
                  <span className="ml-2 text-xs text-gray-400">
                    {item.date ? new Date(item.date).toLocaleString() : ""}
                  </span>
                  {idx === 0 && (
                    <span className="ml-2 px-2 py-1 bg-[#ff7900] text-white text-xs rounded">
                      Nova resposta
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <button
                    onClick={() => handleEdit(idx)}
                    className="text-xs text-yellow-600 hover:underline"
                    title="Editar pergunta"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(idx)}
                    className="text-xs text-red-600 hover:underline"
                    title="Excluir"
                  >
                    Excluir
                  </button>
                  <button
                    onClick={() => handleFavorite(idx)}
                    className={`text-xs ${
                      item.favorite ? "text-[#ff7900]" : "text-gray-400"
                    } hover:underline`}
                    title="Favoritar"
                  >
                    ♥
                  </button>
                  <button
                    onClick={() => handleCopy(item.answer)}
                    className="text-xs text-blue-500 hover:underline"
                    title="Copiar resposta"
                  >
                    Copiar
                  </button>
                </div>
              </div>
              <div className="mt-2 text-gray-800 whitespace-pre-line">
                <b>IA:</b> {item.answer}
              </div>
              {/* Visualização de request/response */}
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-[#ff7900] font-semibold">
                  Ver detalhes da requisição e resposta
                </summary>
                <div className="mt-1">
                  <b>Request:</b>
                  <pre className="bg-gray-100 rounded p-2 overflow-x-auto">{JSON.stringify(item.request, null, 2)}</pre>
                  <b>Response:</b>
                  <pre className="bg-gray-100 rounded p-2 overflow-x-auto">{JSON.stringify(item.response, null, 2)}</pre>
                </div>
              </details>
            </div>
          ))}
        </div>
      </section>

      {/* Documentação da API */}
      <section className="w-full max-w-2xl px-4 py-6 mb-8">
        <h2 className="text-2xl font-bold mb-2 text-[#ff7900]">Como integrar a Whats AI API</h2>
        <p className="mb-2 text-gray-700">
          Faça requisições <b>POST</b> para <code className="bg-gray-100 px-2 py-1 rounded">/api/ask</code> com o token fixo no header <b>Authorization</b>.<br />
          Veja um exemplo em JavaScript:
        </p>
        <div className="relative mb-2">
          <pre className="bg-gray-100 rounded p-4 text-xs overflow-x-auto" id="api-js-example">{`
fetch("/api/ask", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${API_TOKEN}"
  },
  body: JSON.stringify({ question: "Explique o que é a API Whats AI." })
})
  .then(res => res.json())
  .then(data => {
    console.log("Resposta da IA:", data.resposta);
  });
          `.trim()}</pre>
          <button
            className="absolute top-2 right-2 bg-[#ff7900] text-white px-2 py-1 rounded text-xs hover:bg-[#cc6300]"
            onClick={() => {
              const code = document.getElementById("api-js-example")?.textContent;
              if (code) navigator.clipboard.writeText(code);
            }}
            title="Copiar exemplo"
          >
            Copiar exemplo
          </button>
        </div>
        <div className="mb-2 text-xs text-gray-700">
          <b>Headers obrigatórios:</b>
          <ul className="list-disc ml-6">
            <li><b>Authorization</b>: <code>Bearer {API_TOKEN}</code></li>
            <li><b>Content-Type</b>: <code>application/json</code></li>
          </ul>
        </div>
        <div className="mb-2 text-xs text-gray-700">
          <b>Body:</b>
          <pre className="bg-gray-50 rounded p-2">{`{ "question": "Sua pergunta aqui" }`}</pre>
        </div>
        <div className="mb-2 text-xs text-gray-700">
          <b>Resposta:</b>
          <pre className="bg-gray-50 rounded p-2">{`{ "resposta": "Texto gerado pela IA" }`}</pre>
        </div>
        <div className="mb-2 text-xs text-gray-700">
          <b>Dica:</b> Você pode integrar facilmente em projetos Node.js, React, Next.js, ou qualquer linguagem que suporte requisições HTTP!
        </div>
      </section>

      <footer className="w-full py-6 text-center text-xs" style={{ background: orange, color: "#fff" }}>
        Powered by Whats-AI API &copy; {new Date().getFullYear()} | <a href="https://github.com/seu-repo" className="underline text-white">GitHub</a>
      </footer>
    </main>
  );
}