import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/utils/supabase/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Test query: Get all projects (assuming you have a 'projects' table)
    // Adjust the table name if it's different
    const { data: projects, error } = await supabase
      .from("project")
      .select("*")
      .limit(10);

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: "Make sure you have a 'project' table in your Supabase database",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      count: projects?.length || 0,
      projects: projects || [],
      message: "Supabase client is working!",
    });
  } catch (error) {
    console.error("Error testing Supabase client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
