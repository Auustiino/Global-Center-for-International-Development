import { apiRequest } from "./queryClient";
import axios from "axios";

// Agora video call service
export const getAgoraToken = async (channelName: string, uid?: number) => {
  try {
    const response = await fetch(`/api/agora/token?channelName=${channelName}${uid ? `&uid=${uid}` : ''}`);
    if (!response.ok) {
      throw new Error("Failed to get Agora token");
    }
    return await response.json();
  } catch (error) {
    console.error("Error getting Agora token:", error);
    throw error;
  }
};

// DeepL translation service
export const translateText = async (text: string, targetLang: string) => {
  try {
    const response = await apiRequest("POST", "/api/translate", {
      text,
      targetLang,
    });
    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
};

// AssemblyAI speech-to-text service
export const transcribeAudio = async (audioBlob: Blob) => {
  try {
    // Create a form data object to upload the audio
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    
    // First upload the audio file
    const uploadResponse = await fetch('/api/upload-audio', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!uploadResponse.ok) {
      throw new Error('Failed to upload audio');
    }
    
    const { audioUrl } = await uploadResponse.json();

    // Start transcription with the real audio URL
    const response = await apiRequest("POST", "/api/speech-to-text", {
      audioUrl,
    });
    const data = await response.json();
    return data.transcriptionId;
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
};

export const getTranscriptionResult = async (transcriptionId: string) => {
  try {
    const response = await fetch(`/api/speech-to-text/${transcriptionId}`);
    if (!response.ok) {
      throw new Error("Failed to get transcription result");
    }
    const data = await response.json();
    
    // Check if transcription is complete
    if (data.status === "completed") {
      return data.text;
    } else if (data.status === "error") {
      throw new Error(data.error || "Transcription failed");
    } else {
      // Still processing
      return null;
    }
  } catch (error) {
    console.error("Error getting transcription result:", error);
    throw error;
  }
};

// Profile services
export const updateUserProfile = async (userId: number, profileData: FormData) => {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      body: profileData,
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error("Failed to update profile");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Profile update error:", error);
    throw error;
  }
};

// Call history services
export const getUserCalls = async (userId: number) => {
  try {
    const response = await fetch(`/api/users/${userId}/calls`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch call history");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Call history fetch error:", error);
    throw error;
  }
};

// Languages services
export const getUserLanguages = async (userId: number) => {
  try {
    const response = await fetch(`/api/users/${userId}/languages`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch user languages");
    }
    
    return await response.json();
  } catch (error) {
    console.error("User languages fetch error:", error);
    throw error;
  }
};

export const addUserLanguage = async (userId: number, language: string, proficiency: string) => {
  try {
    const response = await apiRequest("POST", `/api/users/${userId}/languages`, {
      language,
      proficiency,
    });
    
    return await response.json();
  } catch (error) {
    console.error("Add language error:", error);
    throw error;
  }
};

export const updateUserLanguage = async (languageId: number, proficiency: string) => {
  try {
    const response = await apiRequest("PATCH", `/api/user-languages/${languageId}`, {
      proficiency,
    });
    
    return await response.json();
  } catch (error) {
    console.error("Update language error:", error);
    throw error;
  }
};

export const deleteUserLanguage = async (languageId: number) => {
  try {
    await apiRequest("DELETE", `/api/user-languages/${languageId}`);
    return true;
  } catch (error) {
    console.error("Delete language error:", error);
    throw error;
  }
};

// Scheduled calls services
export const getUserScheduledCalls = async (userId: number) => {
  try {
    const response = await fetch(`/api/users/${userId}/scheduled-calls`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch scheduled calls");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Scheduled calls fetch error:", error);
    throw error;
  }
};

export const getScheduledCallsByDate = async (userId: number, date: Date) => {
  try {
    // Format date as YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];
    const response = await fetch(`/api/users/${userId}/scheduled-calls/date/${formattedDate}`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch scheduled calls for date");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Scheduled calls by date fetch error:", error);
    throw error;
  }
};

export const createScheduledCall = async (
  initiatorId: number, 
  receiverId: number, 
  startTime: Date, 
  durationMinutes: number,
  title: string,
  notes: string | null = null
) => {
  try {
    const response = await apiRequest("POST", "/api/scheduled-calls", {
      initiatorId,
      receiverId,
      startTime: startTime.toISOString(),
      durationMinutes,
      title,
      notes
    });
    
    return await response.json();
  } catch (error) {
    console.error("Create scheduled call error:", error);
    throw error;
  }
};

export const getScheduledCall = async (callId: number) => {
  try {
    const response = await fetch(`/api/scheduled-calls/${callId}`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch scheduled call");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Scheduled call fetch error:", error);
    throw error;
  }
};

export const updateScheduledCall = async (
  callId: number, 
  updateData: {
    startTime?: Date;
    durationMinutes?: number;
    title?: string;
    notes?: string | null;
  }
) => {
  try {
    // Create a new object for API data with transformed values
    const apiData: {
      startTime?: string;
      durationMinutes?: number;
      title?: string;
      notes?: string | null;
    } = {
      // Only copy non-Date properties directly
      durationMinutes: updateData.durationMinutes,
      title: updateData.title,
      notes: updateData.notes
    };
    
    // Convert Date to ISO string
    if (updateData.startTime) {
      apiData.startTime = updateData.startTime.toISOString();
    }
    
    const response = await apiRequest("PATCH", `/api/scheduled-calls/${callId}`, apiData);
    return await response.json();
  } catch (error) {
    console.error("Update scheduled call error:", error);
    throw error;
  }
};

export const deleteScheduledCall = async (callId: number) => {
  try {
    await apiRequest("DELETE", `/api/scheduled-calls/${callId}`);
    return true;
  } catch (error) {
    console.error("Delete scheduled call error:", error);
    throw error;
  }
};
