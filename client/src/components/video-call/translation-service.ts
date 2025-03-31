import { translateText, transcribeAudio, getTranscriptionResult } from "@/lib/api-services";

interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

interface TranscriptionResult {
  text: string;
  transcriptionId: string;
}

class TranslationService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private transcriptionTimerId: NodeJS.Timeout | null = null;

  // Start speech recording
  public async startRecording(stream: MediaStream): Promise<void> {
    if (this.isRecording) {
      this.stopRecording();
    }

    this.audioChunks = [];
    this.isRecording = true;

    try {
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      this.mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });

      this.mediaRecorder.start();
    } catch (error) {
      console.error("Failed to start recording:", error);
      throw error;
    }
  }

  // Stop speech recording and return audio blob
  public stopRecording(): Blob | null {
    if (!this.isRecording || !this.mediaRecorder) {
      return null;
    }

    return new Promise<Blob>((resolve) => {
      this.mediaRecorder!.addEventListener("stop", () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
        this.isRecording = false;
        this.audioChunks = [];
        resolve(audioBlob);
      });

      this.mediaRecorder!.stop();
    });
  }

  // Transcribe audio and return text
  public async transcribe(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      const transcriptionId = await transcribeAudio(audioBlob);
      return this.pollTranscriptionResult(transcriptionId);
    } catch (error) {
      console.error("Transcription error:", error);
      throw error;
    }
  }

  // Poll for transcription result
  private async pollTranscriptionResult(transcriptionId: string): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts with 2s delay = 60s timeout

      const checkResult = async () => {
        try {
          attempts++;
          const result = await getTranscriptionResult(transcriptionId);

          if (result) {
            // We have a result
            if (this.transcriptionTimerId) {
              clearTimeout(this.transcriptionTimerId);
              this.transcriptionTimerId = null;
            }
            resolve({
              text: result,
              transcriptionId,
            });
          } else if (attempts >= maxAttempts) {
            // Timeout
            reject(new Error("Transcription timed out"));
          } else {
            // Keep polling
            this.transcriptionTimerId = setTimeout(checkResult, 2000);
          }
        } catch (error) {
          reject(error);
        }
      };

      // Start polling
      checkResult();
    });
  }

  // Translate text
  public async translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult> {
    try {
      const translatedText = await translateText(text, targetLang);
      return {
        originalText: text,
        translatedText,
        sourceLang,
        targetLang,
      };
    } catch (error) {
      console.error("Translation error:", error);
      throw error;
    }
  }

  // Speech to translated text pipeline
  public async speechToTranslatedText(
    audioBlob: Blob,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult> {
    // First transcribe the audio
    const transcriptionResult = await this.transcribe(audioBlob);

    // Then translate the transcribed text
    return this.translate(transcriptionResult.text, sourceLang, targetLang);
  }
}

export default new TranslationService();
