import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  try {
    const { pseudo, time } = await req.json();

    if (!pseudo || !time) {
      return NextResponse.json({ error: "Pseudo et temps requis" }, { status: 400 });
    }

    const [result] = await sql`
      INSERT INTO scores (pseudo, time)
      VALUES (${pseudo}, ${time})
      RETURNING id, pseudo, time, created_at
    `;

    return NextResponse.json({ success: true, score: result });
  } catch (err: any) {
    console.error("Erreur ajout score :", err.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const results = await sql`
      SELECT pseudo, time
      FROM scores
      ORDER BY time ASC
      LIMIT 10
    `;

    return NextResponse.json({ scores: results });
  } catch (err: any) {
    console.error("Erreur lecture scores :", err.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


