import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { VideoIcon, CalendarIcon, MessagesSquare } from "lucide-react";
import { SocialMediaLinksView } from "./social-media-links";
import UserLanguageList from "../user-language-list";
import { useAuth } from "@/lib/context/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { getScheduledCallsByDate } from "@/lib/api-services";
import { User, ScheduledCallResponse, LANGUAGE_OPTIONS } from "@shared/schema";

interface UserProfileProps {
  userId: number;
}

const UserProfile = ({ userId }: UserProfileProps) => {
  const { user: currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [busyDates, setBusyDates] = useState<Date[]>([]);

  // Fetch user data
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users/${userId}`);
      const data = await response.json();
      return data as User;
    },
  });

  // Fetch scheduled calls for the selected date
  const { data: scheduledCalls, isLoading: isCallsLoading } = useQuery({
    queryKey: ['/api/scheduled-calls', userId, selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const calls = await getScheduledCallsByDate(userId, selectedDate);
      return calls;
    },
    enabled: !!selectedDate,
  });

  // Fetch all scheduled calls to mark busy days
  useQuery({
    queryKey: ['/api/scheduled-calls', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/scheduled-calls/user/${userId}`);
      const data = await response.json();
      const calls = data as ScheduledCallResponse[];
      
      // Extract dates from calls
      const dates = calls.map(call => new Date(call.scheduledTime));
      setBusyDates(dates);
      
      return calls;
    },
  });

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Get native language label
  const getNativeLanguageLabel = (code: string) => {
    return LANGUAGE_OPTIONS.find(lang => lang.value === code)?.label || code;
  };

  const isUserOwner = currentUser?.id === userId;

  if (isUserLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-60" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <h3 className="text-lg font-medium">User not found</h3>
              <p className="text-sm text-slate-500 mt-2">
                The user you're looking for doesn't exist or may have been removed.
              </p>
              <Button asChild className="mt-4">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Organize busy dates for the calendar
  const busyDatesSet = new Set(
    busyDates.map(date => date.toISOString().split('T')[0])
  );

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <Avatar className="h-24 w-24 border-2 border-white shadow-sm">
              <AvatarImage src={user.profilePicture || ""} alt={user.displayName || user.username} />
              <AvatarFallback>{getInitials(user.displayName || user.username)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <CardTitle className="text-2xl">{user.displayName || user.username}</CardTitle>
              <CardDescription>
                <div className="mt-1 text-sm text-slate-500">
                  Native Language: {getNativeLanguageLabel(user.nativeLanguage)}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </CardDescription>
              
              <div className="mt-3">
                <SocialMediaLinksView user={user} />
              </div>
            </div>
            
            {!isUserOwner && (
              <div className="flex gap-2 mt-2 sm:mt-0">
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/call/${userId}`}>
                    <VideoIcon className="h-4 w-4 mr-2" />
                    Video Call
                  </Link>
                </Button>
              </div>
            )}
            
            {isUserOwner && (
              <div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profile/edit">Edit Profile</Link>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="about">
            <TabsList className="mb-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about" className="space-y-6">
              {user.bio && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Bio</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-line">{user.bio}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">
                  Languages I'm Learning
                </h3>
                <UserLanguageList userId={userId} editable={false} />
              </div>
            </TabsContent>
            
            <TabsContent value="schedule">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Calendar</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                      modifiers={{
                        booked: (date) => {
                          return busyDatesSet.has(date.toISOString().split('T')[0]);
                        },
                      }}
                      modifiersClassNames={{
                        booked: "bg-primary/10 text-primary font-semibold",
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">
                    Scheduled Calls {selectedDate && `for ${selectedDate.toLocaleDateString()}`}
                  </h3>
                  
                  {isCallsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : scheduledCalls && scheduledCalls.length > 0 ? (
                    <div className="space-y-3">
                      {scheduledCalls.map((call: ScheduledCallResponse) => (
                        <Card key={call.id} className="overflow-hidden">
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-2 text-slate-500" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {new Date(call.scheduledTime).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Duration: {call.duration} minutes
                                  </p>
                                </div>
                              </div>
                              
                              {/* User avatar for partner */}
                              <Avatar className="h-8 w-8">
                                <AvatarImage 
                                  src={
                                    currentUser?.id === call.initiatorId 
                                      ? call.receiver?.profilePicture || ""
                                      : call.initiator?.profilePicture || ""
                                  } 
                                  alt="Partner"
                                />
                                <AvatarFallback>
                                  {getInitials(
                                    currentUser?.id === call.initiatorId 
                                      ? call.receiver?.displayName || call.receiver?.username || "Partner"
                                      : call.initiator?.displayName || call.initiator?.username || "Partner"
                                  )}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            
                            {call.notes && (
                              <div className="mt-2">
                                <p className="text-xs text-slate-600 flex items-start">
                                  <MessagesSquare className="h-3 w-3 mr-1 mt-0.5 text-slate-400" />
                                  {call.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-lg">
                      <CalendarIcon className="h-8 w-8 mx-auto text-slate-400" />
                      <p className="mt-2 text-sm text-slate-500">
                        No scheduled calls for this date
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;