import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import type { MentorWithProfile } from "@/types/database";

interface MentorCardProps {
  mentor: MentorWithProfile;
}

export function MentorCard({ mentor }: MentorCardProps) {
  const profile = mentor.profile;
  const initials = profile.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : profile.email[0].toUpperCase();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{profile.full_name || profile.email}</h3>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
          {mentor.bio && (
            <p className="text-sm text-muted-foreground line-clamp-3">{mentor.bio}</p>
          )}
          {mentor.calcom_link ? (
            <a href={mentor.calcom_link} target="_blank" rel="noopener noreferrer" className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                Book Session
              </Button>
            </a>
          ) : (
            <Button className="w-full" size="sm" variant="outline" disabled>
              No booking link available
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
