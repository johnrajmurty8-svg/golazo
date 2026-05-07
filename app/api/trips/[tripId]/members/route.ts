import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, isValidUUID, getTripRole } from "@/lib/utils/api-helpers";

interface Params {
  params: Promise<{ tripId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { tripId } = await params;
  if (!isValidUUID(tripId)) return apiError("Invalid trip ID", 400);

  const { user, supabase } = await getAuthUser();
  if (!user) return apiError("Unauthorised", 401);

  const role = await getTripRole(supabase, tripId, user.id);
  if (!role) return apiError("Not found", 404);

  const { data, error } = await supabase
    .from("trip_members")
    .select(`
      id,
      role,
      joined_at,
      profiles(id, display_name, avatar_url)
    `)
    .eq("trip_id", tripId);

  if (error) return apiError(error.message, 500);
  return NextResponse.json(data ?? []);
}
