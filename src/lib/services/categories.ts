import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";

export async function getCategories(tenantId: string): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return data as Category[];
}

export async function createCategory(
  tenantId: string,
  name: string,
  slug: string,
  sortOrder?: number
): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      tenant_id: tenantId,
      name,
      slug,
      sort_order: sortOrder || 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating category:", error);
    return null;
  }
  return data as Category;
}

export async function updateCategory(
  id: string,
  data: { name?: string; slug?: string; sort_order?: number }
): Promise<Category | null> {
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("categories")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating category:", error);
    return null;
  }
  return updated as Category;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  return !error;
}
