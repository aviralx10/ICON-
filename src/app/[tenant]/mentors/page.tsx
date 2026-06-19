import { createClient } from "@/lib/supabase/server";
import { getMentors } from "@/lib/services/mentors";
import { MentorCard } from "@/components/mentor-card";
import { Users } from "lucide-react";
import type { Tenant } from "@/types/database";

interface PageProps {
  params: Promise<{ tenant: string }>;
}

export default async function MentorsPage({ params }: PageProps) {
  const { tenant: tenantSlug } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", tenantSlug)
    .single();

  if (!tenant) {
    return <div className="text-center py-16">Tenant not found</div>;
  }

  const mentors = await getMentors((tenant as Tenant).id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mentor Directory</h1>
        <p className="text-muted-foreground">Connect with experienced mentors for case practice.</p>
      </div>

      {mentors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No mentors available</h3>
          <p className="text-muted-foreground mt-1">
            Mentors will appear here once they are added by an admin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mentors.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} />
          ))}
        </div>
      )}
    </div>
  );
}
