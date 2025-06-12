import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET = "AIzaSyA8bq6ladVcqMhZ_33Ocl1fMSrmOjmZc0M"; // Troque por uma chave forte

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = body?.username;
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Usuário não informado." }, { status: 400 });
    }
    const token = jwt.sign({ username }, SECRET, { expiresIn: "1d" });
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
}