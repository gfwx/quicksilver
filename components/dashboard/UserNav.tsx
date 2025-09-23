import { User } from "@/lib/hooks/useAuth"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export const UserNav = ({ user }: { user: User | null }) => {
  return (
    <div className="flex gap-4 w-fit items-center">
      <Avatar>
        <AvatarImage src={user?.profilePictureUrl} />
        <AvatarFallback>{user?.firstName?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-md font-bold">{user?.firstName}</p>
        <p className="text-sm">{user?.email}</p>
      </div>
    </div>
  );
}
