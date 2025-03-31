import { useAuth } from "@/lib/context/auth-context";
import NavBar from "@/components/nav-bar";
import ProfileForm from "@/components/profile/profile-form";

const Profile = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null; // Protected route will handle redirect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <ProfileForm />
      </main>
    </div>
  );
};

export default Profile;
