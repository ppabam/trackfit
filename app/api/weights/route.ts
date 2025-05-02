import { Pool } from "pg";
import { NextResponse } from "next/server";

const connectionString = process.env.DATABASE_URL;
const pool = connectionString ? new Pool({ connectionString }) : null;

export async function GET() {
  if (!pool) {
    console.error("Neon connection pool not initialized.");
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
  }
  try {
    const result = await pool.query("SELECT date::TEXT, weight FROM weights ORDER BY date DESC");
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching weight history:", error);
    return NextResponse.json({ error: "Failed to fetch weight history" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!pool) {
    console.error("Neon connection pool not initialized.");
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
  }
  try {
    const { date, weight } = await request.json();
    if (typeof date !== 'string' || typeof weight !== 'number') {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    await pool.query("INSERT INTO weights (date, weight) VALUES ($1, $2)", [date, weight]);
    return NextResponse.json({ message: "Weight saved successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error saving weight:", error);
    return NextResponse.json({ error: "Failed to save weight" }, { status: 500 });
  }
}