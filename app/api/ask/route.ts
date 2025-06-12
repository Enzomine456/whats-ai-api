import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = "AIzaSyA8bq6ladVcqMhZ_33Ocl1fMSrmOjmZc0M";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;
const API_TOKEN = "AIzaSyA8bq6ladVcqMhZ_33Ocl1fMSrmOjmZc0M"; // Token fixo

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth || auth !== `Bearer ${API_TOKEN}`) {
    return NextResponse.json({ error: "Token inválido ou ausente." }, { status: 401 });
  }

  try {
    const { question } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "Pergunta não fornecida." }, { status: 400 });
    }

    const geminiRes = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: question }] }]
      }),
    });

    if (!geminiRes.ok) {
      return NextResponse.json({ error: "Erro ao gerar resposta." }, { status: 500 });
    }

    const geminiData = await geminiRes.json();
    const resposta = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "Não foi possível gerar uma resposta.";

    return NextResponse.json({ resposta });
  } catch (e) {
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}