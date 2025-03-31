import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalAudioTrack,
  ILocalVideoTrack,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { getAgoraToken } from "@/lib/api-services";

export class AgoraClient {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: ILocalAudioTrack | null = null;
  private localVideoTrack: ILocalVideoTrack | null = null;
  private uid: string | null = null;
  private channelName: string | null = null;
  private appId: string | null = null;
  private token: string | null = null;

  // Event callbacks
  private onRemoteUserJoined: ((user: IAgoraRTCRemoteUser) => void) | null = null;
  private onRemoteUserLeft: ((user: IAgoraRTCRemoteUser) => void) | null = null;
  private onLocalUserJoined: (() => void) | null = null;
  private onError: ((error: Error) => void) | null = null;

  constructor() {
    this.appId = process.env.AGORA_APP_ID || "";
    this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.client) return;

    this.client.on("user-published", async (user, mediaType) => {
      await this.client?.subscribe(user, mediaType);

      if (mediaType === "video") {
        if (this.onRemoteUserJoined) {
          this.onRemoteUserJoined(user);
        }
      }

      if (mediaType === "audio") {
        user.audioTrack?.play();
      }
    });

    this.client.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "video") {
        if (this.onRemoteUserLeft) {
          this.onRemoteUserLeft(user);
        }
      }
    });

    this.client.on("user-left", (user) => {
      if (this.onRemoteUserLeft) {
        this.onRemoteUserLeft(user);
      }
    });

    this.client.on("exception", (event) => {
      if (this.onError) {
        this.onError(new Error(`Agora exception: ${event.code} - ${event.msg}`));
      }
    });
  }

  public setEventHandlers({
    onRemoteUserJoined,
    onRemoteUserLeft,
    onLocalUserJoined,
    onError,
  }: {
    onRemoteUserJoined?: (user: IAgoraRTCRemoteUser) => void;
    onRemoteUserLeft?: (user: IAgoraRTCRemoteUser) => void;
    onLocalUserJoined?: () => void;
    onError?: (error: Error) => void;
  }) {
    this.onRemoteUserJoined = onRemoteUserJoined || null;
    this.onRemoteUserLeft = onRemoteUserLeft || null;
    this.onLocalUserJoined = onLocalUserJoined || null;
    this.onError = onError || null;
  }

  public async join(channelName: string, uid: string) {
    try {
      this.channelName = channelName;
      this.uid = uid;

      // Get token from server
      const tokenData = await getAgoraToken(channelName, parseInt(uid));
      this.appId = tokenData.appId;
      this.token = tokenData.token;

      // Join the channel
      await this.client?.join(this.appId, channelName, this.token, uid);

      // Create and publish local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      this.localAudioTrack = audioTrack;
      this.localVideoTrack = videoTrack;
      await this.client?.publish([audioTrack, videoTrack]);

      if (this.onLocalUserJoined) {
        this.onLocalUserJoined();
      }

      return { localVideoTrack: videoTrack };
    } catch (error) {
      if (this.onError) {
        this.onError(error as Error);
      }
      throw error;
    }
  }

  public async leave() {
    this.localAudioTrack?.close();
    this.localVideoTrack?.close();
    await this.client?.leave();
  }

  public async toggleAudio(enabled: boolean) {
    if (this.localAudioTrack) {
      this.localAudioTrack.setEnabled(enabled);
    }
  }

  public async toggleVideo(enabled: boolean) {
    if (this.localVideoTrack) {
      this.localVideoTrack.setEnabled(enabled);
    }
  }

  public async switchCamera() {
    if (this.localVideoTrack) {
      await (this.localVideoTrack as ICameraVideoTrack).switchDevice();
    }
  }

  public async switchMicrophone() {
    if (this.localAudioTrack) {
      await (this.localAudioTrack as IMicrophoneAudioTrack).switchDevice();
    }
  }

  public getLocalVideoTrack() {
    return this.localVideoTrack;
  }

  public getRemoteUsers() {
    return this.client?.remoteUsers || [];
  }
}

export default new AgoraClient();
