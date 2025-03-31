import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth-context";
import { getUserCalls } from "@/lib/api-services";
import { CallResponse, LANGUAGE_OPTIONS } from "@shared/schema";
import NavBar from "@/components/nav-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LanguageBadge from "@/components/language-badge";
import { PhoneCall, Video, MessageCircle } from "lucide-react";

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [supportedLanguages] = useState(LANGUAGE_OPTIONS);

  // Fetch recent calls if user is authenticated
  const { data: recentCalls, isLoading: isLoadingCalls } = useQuery({
    queryKey: [user ? `/api/users/${user.id}/calls` : null],
    enabled: !!user,
  });

  // Redirect to sign up page if not authenticated after a delay
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (!isAuthenticated) {
      timeoutId = setTimeout(() => {
        setLocation("/signup");
      }, 1500);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthenticated, setLocation]);

  // Navigate to video call with a specific user
  const handleStartCall = (userId?: number) => {
    setLocation(`/call/${userId || ""}`);
  };

  // Format timestamp for display
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  };

  // Get call partner (the other person in the call)
  const getCallPartner = (call: CallResponse) => {
    if (!user) return null;
    return user.id === call.initiatorId ? call.receiver : call.initiator;
  };

  return (
    <div className="bg-slate-50 font-sans min-h-screen">
      <NavBar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">Break Language Barriers</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Connect with anyone around the world with real-time video calls and instant translation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="overflow-hidden">
            <CardContent className="p-8">
              <div className="mb-4 flex items-center">
                <Video className="h-8 w-8 text-secondary mr-3" />
                <h2 className="text-2xl font-bold text-primary">Video Calls</h2>
              </div>
              <p className="text-slate-600 mb-6">
                Connect face-to-face with high-quality video calls, no matter where you are.
              </p>
              <Button 
                size="lg" 
                className="bg-secondary hover:bg-blue-600 text-white transition-colors duration-200"
                onClick={() => handleStartCall()}
              >
                Start a Call
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-8">
              <div className="mb-4 flex items-center">
                <MessageCircle className="h-8 w-8 text-accent mr-3" />
                <h2 className="text-2xl font-bold text-primary">Real-Time Translation</h2>
              </div>
              <p className="text-slate-600 mb-6">
                Speak your language while they hear theirs with AI-powered translation.
              </p>
              <Button 
                size="lg" 
                className="bg-accent hover:bg-violet-600 text-white transition-colors duration-200"
                onClick={() => setLocation("/profile")}
              >
                Try Translation
              </Button>
            </CardContent>
          </Card>
        </div>

        {isAuthenticated && (
          <Card className="overflow-hidden p-8 mb-16">
            <h2 className="text-2xl font-bold text-primary mb-6">Recent Conversations</h2>
            
            {isLoadingCalls ? (
              <div className="text-center py-4 text-slate-500">Loading recent calls...</div>
            ) : recentCalls?.length ? (
              recentCalls.map((call: CallResponse) => {
                const partner = getCallPartner(call);
                if (!partner) return null;
                
                return (
                  <div 
                    key={call.id} 
                    className="border-b border-slate-200 py-4 flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={partner.profilePicture || ""} />
                        <AvatarFallback>
                          {partner.displayName?.[0] || partner.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-primary">
                          {partner.displayName || partner.username}
                        </p>
                        <p className="text-sm text-slate-500">
                          {
                            LANGUAGE_OPTIONS.find(l => l.value === call.initiatorLanguage)?.label || call.initiatorLanguage
                          }{" "}
                          →{" "}
                          {
                            LANGUAGE_OPTIONS.find(l => l.value === call.receiverLanguage)?.label || call.receiverLanguage
                          }{" "}
                          • {formatTimeAgo(call.startTime)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Button 
                        variant="ghost" 
                        className="text-secondary hover:text-blue-700 font-medium"
                        onClick={() => handleStartCall(partner.id)}
                      >
                        <PhoneCall className="h-4 w-4 mr-1" /> Call Again
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-slate-500">No recent conversations</div>
            )}
          </Card>
        )}

        <div className="bg-slate-100 rounded-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-primary">Supported Languages</h2>
            <p className="text-slate-600">Our platform currently supports translation between these languages:</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {supportedLanguages.map((language) => (
              <div key={language.value} className="bg-white rounded-lg p-3 text-center shadow-sm">
                <span className="text-lg font-medium">{language.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
