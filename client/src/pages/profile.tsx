import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import NavBar from "@/components/nav-bar";
import ProfileForm from "@/components/profile/profile-form";
import UserProfile from "@/components/profile/user-profile";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

interface ProfileProps {
  params?: {
    userId?: string;
  };
  edit?: boolean;
}

const Profile = ({ params, edit }: ProfileProps) => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // If viewing someone else's profile
    if (params?.userId) {
      const id = parseInt(params.userId, 10);
      if (!isNaN(id)) {
        setUserId(id);
      }
    } else {
      // Own profile
      if (currentUser) {
        setUserId(currentUser.id);
      }
    }
  }, [params, currentUser]);

  // Check if this is the user's own profile
  const isOwnProfile = userId === currentUser?.id;
  
  // Determine if we should show the edit form
  const showEditForm = isOwnProfile && (edit || location === "/profile/edit");

  if (!isAuthenticated) {
    return null; // Protected route will handle redirect
  }

  if (!userId) {
    return null; // Still loading or invalid user ID
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {showEditForm ? (
          <ProfileForm />
        ) : (
          <UserProfile userId={userId} />
        )}
      </main>
    </div>
  );
};

export default Profile;
