import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/server";

/** Autocompletar público: ?q= (2 a 60 caracteres). */
export async function GET(request: NextRequest) {
  const q = z.string().trim().min(2).max(60).safeParse(request.nextUrl.searchParams.get("q") ?? "");
  if (!q.success) return NextResponse.json({ hits: [] }, { headers: { "cache-control": "no-store" } });
  const { data, error } = await createPublicClient().rpc("search_catalog", { p_q: q.data, p_limit: 8 });
  if (error) return NextResponse.json({ hits: [] }, { status: 503 });
  return NextResponse.json({ hits: data ?? [] }, { headers: { "cache-control": "public, max-age=60" } });
}
