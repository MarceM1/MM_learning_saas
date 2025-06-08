"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseClient } from "@/lib/supabase";

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
