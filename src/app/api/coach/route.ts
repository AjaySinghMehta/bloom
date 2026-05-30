import { NextResponse } from "next/server";
import { generateHabitCoachResponse } from "@/lib/llm";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      habit?: string;
      trigger?: string;
      currentCount?: number;
      target?: number;
      cravingNote?: string;
    };

    if (!body.habit || !body.trigger || typeof body.currentCount !== "number" || typeof body.target !== "number") {
      return NextResponse.json({ error: "Invalid coach request." }, { status: 400 });
    }

    const result = await generateHabitCoachResponse({
      habit: body.habit,
      trigger: body.trigger,
      currentCount: body.currentCount,
      target: body.target,
      cravingNote: body.cravingNote,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not process coach request." }, { status: 400 });
  }
}
