import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError } from "@/lib/utils/api-helpers";
import crypto from "crypto";

export async function GET() {
  const { user, supabase } = await getAuthUser();
  if (!user) return apiError("Unauthorised", 401);

  const { data, error } = await supabase
    .from("trips")
    .select(`
      *,
      trip_members!inner(role)
    `)
    .eq("trip_members.user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return apiError(error.message, 500);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { user, supabase } = await getAuthUser();
  if (!user) return apiError("Unauthorised", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const { name, description, start_date, end_date } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0)
    return apiError("Trip name is required", 400);
  if (typeof start_date !== "string" || typeof end_date !== "string")
    return apiError("start_date and end_date are required", 400);
  if (start_date >= end_date)
    return apiError("end_date must be after start_date", 400);

  const shareToken = crypto.randomBytes(16).toString("hex");

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : null,
      start_date,
      end_date,
      organiser_id: user.id,
      share_token: shareToken,
    })
    .select()
    .single();

  if (tripError || !trip) return apiError(tripError?.message ?? "Failed to create trip", 500);

  await supabase.from("trip_members").insert({
    trip_id: trip.id,
    user_id: user.id,
    role: "organiser",
  });

  return NextResponse.json(trip, { status: 201 });
}
