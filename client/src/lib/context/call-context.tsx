import React, { createContext, useState, useContext, useRef } from "react";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./auth-context";

interface Message {
  id: string;
  sender: User;
  text: string;
  translatedText?: string;
  timestamp: Date;
}

interface CallContextData {
  isInCall: boolean;
  isCalling: boolean;
  callPartner: User | null;
  messages: Message[];
  initiatorLanguage: string;
  receiverLanguage: string;
  addMessage: (message: Partial<Message>) => void;
  startCall: (user: User, initiatorLang: string, receiverLang: string) => void;
  endCall: () => void;
  acceptCall: () => void;
  rejectCall: () => void;
  setCallLanguages: (initiatorLang: string, receiverLang: string) => void;
}

const CallContext = createContext<CallContextData>({} as CallContextData);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callPartner, setCallPartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [initiatorLanguage, setInitiatorLanguage] = useState("en");
  const [receiverLanguage, setReceiverLanguage] = useState("es");
  const { user } = useAuth();
  const { toast } = useToast();
  const messageIdCounter = useRef(0);

  const startCall = (partner: User, initiatorLang: string, receiverLang: string) => {
    setCallPartner(partner);
    setInitiatorLanguage(initiatorLang);
    setReceiverLanguage(receiverLang);
    setIsCalling(true);
    toast({
      title: "Calling...",
      description: `Calling ${partner.displayName || partner.username}`,
    });
  };

  const endCall = () => {
    setIsInCall(false);
    setIsCalling(false);
    setCallPartner(null);
    setMessages([]);
    toast({
      title: "Call ended",
      description: "The call has been ended",
    });
  };

  const acceptCall = () => {
    setIsInCall(true);
    setIsCalling(false);
    toast({
      title: "Call connected",
      description: `You are now in a call with ${callPartner?.displayName || callPartner?.username}`,
    });
  };

  const rejectCall = () => {
    setIsCalling(false);
    setCallPartner(null);
    toast({
      title: "Call rejected",
      description: "You have rejected the incoming call",
    });
  };

  const setCallLanguages = (initiatorLang: string, receiverLang: string) => {
    setInitiatorLanguage(initiatorLang);
    setReceiverLanguage(receiverLang);
  };

  const addMessage = (message: Partial<Message>) => {
    if (!message.sender || !message.text) return;
    
    const newMessage: Message = {
      id: `msg-${messageIdCounter.current++}`,
      sender: message.sender,
      text: message.text,
      translatedText: message.translatedText,
      timestamp: message.timestamp || new Date(),
    };
    
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <CallContext.Provider
      value={{
        isInCall,
        isCalling,
        callPartner,
        messages,
        initiatorLanguage,
        receiverLanguage,
        addMessage,
        startCall,
        endCall,
        acceptCall,
        rejectCall,
        setCallLanguages,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
