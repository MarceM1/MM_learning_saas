"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export const createCompanion = async (formData: CreateCompanion) => {
  const { userId: author } = await auth();
  const supabase = createSupabaseClient();
  // console.log("userId", author);
  const { data, error } = await supabase
    .from("companions")
    .insert({
      ...formData,
      author,
    })
    .select();

  // console.log("data", data);
  // console.log("error", error);

  if (error || !data)
    throw new Error(error?.message || "Failed to create companion");

  return data[0];
};

export const getAllCompanions = async ({
  limit = 10,
  page = 1,
  subject,
  topic,
}: GetAllCompanions) => {
  const supabase = createSupabaseClient();

  let query = supabase.from("companions").select();

  if (subject && topic) {
    query = query
      .ilike("subject", `%${subject}%`)
      .or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
  } else if (subject) {
    query = query.ilike("subject", `%${subject}%`);
  } else if (topic) {
    query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
  }

  query = query.range((page - 1) * limit, page * limit - 1);

  const { data: companions, error } = await query;

  if (error) throw new Error(error?.message || "Failed to fetch companions");

  // const companionIds = companions.map((companion) => companion.id);

  const { data: viewsData, error: viewsError } = await supabase
    .from("session_history")
    .select("companion_id");

  if (viewsError)
    throw new Error(viewsError?.message || "Failed to fetch companions");

  const viewsMap: Record<string, number> = {};

  viewsData?.forEach(({ companion_id }) => {
    viewsMap[companion_id] = (viewsMap[companion_id] || 0) + 1;
  });

  const { data: bookmarksData, error: bookmarksError } = await supabase
    .from("bookmarks")
    .select("companion_id");

  if (bookmarksError) throw new Error(bookmarksError.message);

  const bookmarksMap: Record<string, number> = {};
  bookmarksData?.forEach(({ companion_id }) => {
    bookmarksMap[companion_id] = (bookmarksMap[companion_id] || 0) + 1;
  });

  const companionsWithCounts = companions.map((companion) => ({
    ...companion,
    views: viewsMap[companion.id] || 0,
    bookmarks: bookmarksMap[companion.id] || 0,
  }));

  return companionsWithCounts;
};

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Fetches a single companion by id
 * @param id The id of the companion to fetch
 * @returns The companion or undefined if not found
 */

/*******  1435e7d5-d813-4329-b69a-0db0aa41bea4  *******/export const getCompanion = async (id: string) => {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("companions")
    .select()
    .eq("id", id);

  if (error) return console.log(error);

  return data[0];
};

export const addToSessionHistory = async (companionId: string) => {
  const { userId } = await auth();
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.from("session_history").insert({
    companion_id: companionId,
    user_id: userId,
  });

  if (error)
    throw new Error(error?.message || "Failed to create session history");

  return data;
};

export const getRecentSessions = async (limit = 10) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("session_history")
    .select(`companions:companion_id (*)`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error)
    throw new Error(error?.message || "Failed to fetch session history");

  return data.map(({ companions }) => companions);
};

export const getUserSessions = async (userId: string, limit = 10) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("session_history")
    .select(`companions:companion_id (*)`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error)
    throw new Error(error?.message || "Failed to fetch session history");

  return data.map(({ companions }) => companions);
};

export const getUserCompanions = async (userId: string) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("companions")
    .select()
    .eq("author", userId);

  if (error)
    throw new Error(error?.message || "Failed to fetch user companions");

  return data;
};

export const deleteCompanion = async (id: string) => {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("companions").delete().eq("id", id);

  if (error) throw new Error(error?.message || "Failed to delete companion");
};

export const newCompanionPermissions = async () => {
  const { userId, has } = await auth();
  const supabase = createSupabaseClient();

  let limit = 0;

  if (has({ plan: "pro" })) {
    return true;
  } else if (has({ feature: "3_companion_limit" })) {
    limit = 3;
  } else if (has({ feature: "10_companion_limit" })) {
    limit = 10;
  }

  const { data, error } = await supabase
    .from("companions")
    .select("id", { count: "exact" })
    .eq("author", userId);

  if (error) throw new Error(error.message);

  const companionCount = data?.length;

  if (companionCount >= limit) {
    return false;
  } else {
    return true;
  }
};

export const addBookmark = async (companionId: string, path: string) => {
  const { userId } = await auth();
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase.from("bookmarks").insert({
    companion_id: companionId,
    user_id: userId,
  });

  if (error) throw new Error(error.message);

  revalidatePath(path);
  return data;
};

export const removeBookmark = async (companionId: string, path: string) => {
  const { userId } = await auth();

  if (!userId) return;

  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("companion_id", companionId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath(path);
  return data;
};

export const getBookmarkedCompanions = async (
  userId: string
): Promise<Companion[]> => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .select(`companions:companion_id (*)`)
    .eq("user_id", userId);
  if (error) {
    throw new Error(error.message);
  }
  return data.map(({ companions }) => companions);
};
