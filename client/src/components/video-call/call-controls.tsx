import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Phone, Settings, Share, MessageSquare } from "lucide-react";

interface CallControlsProps {
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onToggleChat: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isChatOpen: boolean;
}

const CallControls = ({
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  onToggleChat,
  isAudioEnabled,
  isVideoEnabled,
  isChatOpen,
}: CallControlsProps) => {
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  return (
    <div className="mt-4 flex justify-center items-center bg-slate-800 py-4 rounded-lg">
      <Button
        onClick={onToggleAudio}
        variant="ghost"
        size="lg"
        className="mx-2 rounded-full p-3 bg-slate-700 text-white hover:bg-slate-600 transition-colors duration-200"
      >
        {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>

      <Button
        onClick={onToggleVideo}
        variant="ghost"
        size="lg"
        className="mx-2 rounded-full p-3 bg-slate-700 text-white hover:bg-slate-600 transition-colors duration-200"
      >
        {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>

      <Button
        onClick={handleSettingsClick}
        variant="ghost"
        size="lg"
        className="mx-2 rounded-full p-3 bg-slate-700 text-white hover:bg-slate-600 transition-colors duration-200"
      >
        <Settings className="h-5 w-5" />
      </Button>

      <Button
        onClick={onEndCall}
        variant="destructive"
        size="lg"
        className="mx-2 rounded-full p-4 bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
      >
        <Phone className="h-5 w-5 transform rotate-135" />
      </Button>

      <Button
        onClick={onToggleChat}
        variant="ghost"
        size="lg"
        className={`mx-2 rounded-full p-3 ${
          isChatOpen ? "bg-blue-600" : "bg-slate-700"
        } text-white hover:bg-slate-600 transition-colors duration-200`}
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="lg"
        className="mx-2 rounded-full p-3 bg-slate-700 text-white hover:bg-slate-600 transition-colors duration-200"
      >
        <Share className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default CallControls;
