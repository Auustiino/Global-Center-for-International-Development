import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Mic } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { useCall } from "@/lib/context/call-context";
import { LANGUAGE_OPTIONS } from "@shared/schema";
import TranslationService from "./translation-service";
import { translateText } from "@/lib/api-services";
import { useToast } from "@/hooks/use-toast";

const TranslationPanel = () => {
  const { user } = useAuth();
  const { callPartner, messages, addMessage, initiatorLanguage, receiverLanguage } = useCall();
  const [inputText, setInputText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("es");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Set languages based on call context
    if (user?.id) {
      const isInitiator = user.id === callPartner?.id;
      setSourceLang(isInitiator ? initiatorLanguage : receiverLanguage);
      setTargetLang(isInitiator ? receiverLanguage : initiatorLanguage);
    }
  }, [user, callPartner, initiatorLanguage, receiverLanguage]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !callPartner) return;

    setIsTranslating(true);
    try {
      // Translate the message
      const translatedText = await translateText(inputText, targetLang);

      // Add message to conversation
      addMessage({
        sender: user,
        text: inputText,
        translatedText,
      });

      setInputText("");
    } catch (error) {
      toast({
        title: "Translation failed",
        description: "Could not translate your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRecordStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await TranslationService.startRecording(stream);
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const handleRecordStop = async () => {
    if (!isRecording) return;

    setIsRecording(false);
    setIsTranslating(true);

    try {
      const audioBlob = await TranslationService.stopRecording();
      if (!audioBlob) return;

      // Get transcription and translation
      const result = await TranslationService.speechToTranslatedText(
        audioBlob,
        sourceLang,
        targetLang
      );

      if (user && callPartner) {
        addMessage({
          sender: user,
          text: result.originalText,
          translatedText: result.translatedText,
        });
      }
    } catch (error) {
      toast({
        title: "Speech processing failed",
        description: "Could not process your speech. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden flex flex-col h-full">
      <div className="bg-slate-700 p-3 flex justify-between items-center">
        <h2 className="text-white font-medium">Live Translation</h2>
        <div className="flex space-x-2">
          <Select value={sourceLang} onValueChange={setSourceLang}>
            <SelectTrigger className="bg-slate-800 text-white text-sm rounded border-0 focus:ring-0 focus:ring-offset-0 py-1 px-2 w-32">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              <SelectItem value="auto">Auto-detect</SelectItem>
              {LANGUAGE_OPTIONS.map((lang) => (
                <SelectItem key={`source-${lang.value}`} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={targetLang} onValueChange={setTargetLang}>
            <SelectTrigger className="bg-slate-800 text-white text-sm rounded border-0 focus:ring-0 focus:ring-offset-0 py-1 px-2 w-32">
              <SelectValue placeholder="Target" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {LANGUAGE_OPTIONS.map((lang) => (
                <SelectItem key={`target-${lang.value}`} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender.id === user?.id;

            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? "justify-end" : ""}`}
              >
                {!isCurrentUser && (
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender.profilePicture || ""} />
                      <AvatarFallback>
                        {message.sender.displayName?.[0] || message.sender.username[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                <div className={`${isCurrentUser ? "mr-3" : "ml-3"}`}>
                  <div
                    className={`${
                      isCurrentUser ? "bg-blue-600" : "bg-slate-700"
                    } rounded-lg px-3 py-2 text-white`}
                  >
                    <p>{message.text}</p>
                  </div>
                  {message.translatedText && (
                    <div
                      className={`mt-1 ${
                        isCurrentUser ? "bg-blue-700" : "bg-slate-600"
                      } rounded-lg px-3 py-2 text-white text-sm`}
                    >
                      <p>{message.translatedText}</p>
                    </div>
                  )}
                </div>

                {isCurrentUser && (
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender.profilePicture || ""} />
                      <AvatarFallback>
                        {message.sender.displayName?.[0] || message.sender.username[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-slate-700">
        <div className="flex bg-slate-900 rounded-lg overflow-hidden">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Type a message..."
              className="w-full h-full py-2 px-3 bg-transparent border-0 text-white focus:ring-0"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTranslating}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="px-4 text-blue-400 hover:text-blue-300"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTranslating}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
          <span>Voice recognition: {LANGUAGE_OPTIONS.find(l => l.value === sourceLang)?.label || "Auto"}</span>
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center ${
              isRecording ? "text-red-400 animate-pulse" : "text-blue-400"
            } hover:text-blue-300`}
            onMouseDown={handleRecordStart}
            onMouseUp={handleRecordStop}
            onTouchStart={handleRecordStart}
            onTouchEnd={handleRecordStop}
            disabled={isTranslating}
          >
            <Mic className="h-4 w-4 mr-1" />
            <span>{isRecording ? "Recording..." : "Hold to speak"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TranslationPanel;
