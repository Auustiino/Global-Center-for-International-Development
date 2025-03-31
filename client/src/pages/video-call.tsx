import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { useCall } from "@/lib/context/call-context";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import CallControls from "@/components/video-call/call-controls";
import TranslationPanel from "@/components/video-call/translation-panel";
import agoraClient from "@/components/video-call/agora-client";
import { LANGUAGE_OPTIONS } from "@shared/schema";

interface VideoCallProps {
  params?: {
    userId?: string;
  };
}

const VideoCall = ({ params }: VideoCallProps) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const { user } = useAuth();
  const { callPartner, initiatorLanguage, receiverLanguage, endCall } = useCall();
  const [location, setLocation] = useLocation();
  
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch call partner user data if a userId was provided
  const { data: partnerData } = useQuery({
    queryKey: [params?.userId ? `/api/users/${params.userId}` : null],
    enabled: !!params?.userId,
  });

  useEffect(() => {
    // Setup Agora client event handlers
    agoraClient.setEventHandlers({
      onRemoteUserJoined: (user) => {
        if (user.videoTrack) {
          user.videoTrack.play(remoteVideoRef.current!);
          setIsConnected(true);
        }
      },
      onRemoteUserLeft: () => {
        // Handle remote user leaving
        setIsConnected(false);
        handleEndCall();
      },
      onLocalUserJoined: () => {
        // Start the call duration timer
        startDurationTimer();
      },
      onError: (error) => {
        console.error("Agora error:", error);
      },
    });

    // Start or join a call
    const initializeCall = async () => {
      try {
        // Create a channel name based on user IDs
        const channelName = `call-${Date.now()}`;
        
        // Join the call
        const uid = user?.id.toString() || "0";
        const { localVideoTrack } = await agoraClient.join(channelName, uid);
        
        // Play local video
        if (localVideoTrack && localVideoRef.current) {
          localVideoTrack.play(localVideoRef.current);
        }
        
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to join call:", error);
      }
    };

    if (user) {
      initializeCall();
    }

    // Clean up on unmount
    return () => {
      agoraClient.leave();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [user]);

  // Start the call duration timer
  const startDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  // Format call duration to MM:SS format
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Handle ending the call
  const handleEndCall = () => {
    agoraClient.leave();
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    endCall();
    setLocation("/");
  };

  // Toggle audio
  const handleToggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    agoraClient.toggleAudio(newState);
  };

  // Toggle video
  const handleToggleVideo = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    agoraClient.toggleVideo(newState);
  };

  // Toggle chat panel
  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Get partner (other user in the call)
  const partner = callPartner || partnerData;

  // Get language display names
  const getLanguageLabel = (code: string) => {
    return LANGUAGE_OPTIONS.find((lang) => lang.value === code)?.label || code;
  };

  return (
    <div className="h-screen flex flex-col bg-primary">
      {/* Call Header */}
      <header className="bg-slate-900 py-3 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="text-white hover:text-slate-300 mr-3"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-white font-medium">
              Call with {partner?.displayName || partner?.username || "Unknown User"}
            </h1>
            <div className="flex items-center text-slate-400 text-sm">
              <span className="flex items-center">
                <span className="mr-1">From:</span> {getLanguageLabel(initiatorLanguage)}
              </span>
              <ArrowLeft className="mx-2 h-3 w-3 rotate-180" />
              <span className="flex items-center">
                <span className="mr-1">To:</span> {getLanguageLabel(receiverLanguage)}
              </span>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center text-white">
          {isConnected && (
            <>
              <div className="bg-green-500 h-2 w-2 rounded-full mr-2"></div>
              <span className="text-sm flex items-center">
                <Clock className="h-3 w-3 mr-1" /> {formatDuration(callDuration)}
              </span>
            </>
          )}
        </div>
      </header>

      {/* Call Content */}
      <div className={`flex-1 grid grid-cols-1 ${isChatOpen ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4 p-4 bg-slate-900`}>
        {/* Video Feeds */}
        <div className={`${isChatOpen ? 'md:col-span-2' : 'md:col-span-1'} flex flex-col`}>
          <div className="bg-slate-800 rounded-lg flex-1 flex items-center justify-center relative">
            {/* Remote Video (Main) */}
            <div 
              ref={remoteVideoRef} 
              className="w-full h-full absolute inset-0 rounded-lg bg-slate-700 flex items-center justify-center"
            >
              {!isConnected && (
                <div className="text-white text-center p-4">
                  <Avatar className="h-20 w-20 mx-auto mb-4">
                    <AvatarImage src={partner?.profilePicture || ""} />
                    <AvatarFallback>
                      {partner?.displayName?.[0] || partner?.username?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xl">Connecting to call...</p>
                </div>
              )}
            </div>
            
            {/* Local Video (Small PIP) */}
            <div 
              ref={localVideoRef} 
              className="absolute bottom-4 right-4 w-40 h-32 bg-slate-700 rounded-lg overflow-hidden shadow-lg border-2 border-slate-700 z-10"
            >
              {!isVideoEnabled && (
                <div className="w-full h-full flex items-center justify-center bg-slate-600">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user?.profilePicture || ""} />
                    <AvatarFallback>
                      {user?.displayName?.[0] || user?.username?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </div>
          
          {/* Call Controls */}
          <CallControls
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            onEndCall={handleEndCall}
            onToggleChat={handleToggleChat}
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            isChatOpen={isChatOpen}
          />
        </div>
        
        {/* Translation Panel */}
        {isChatOpen && (
          <div className="h-full">
            <TranslationPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
