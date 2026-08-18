/**
 * 3D Proximity Spatial Audio Engine & WebRTC Voice Pipeline
 * Powered by Web Audio API (PannerNode & AudioListener) and Server-Side AI Moderation
 */

export interface PlayerCoordinate {
  x: number;
  y: number;
  z: number;
}

export interface SpatialPeerNode {
  peerId: string;
  username: string;
  position: PlayerCoordinate;
  pannerNode: PannerNode;
  gainNode: GainNode;
  audioStream?: MediaStream;
  audioElement?: HTMLAudioElement;
  distance: number;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  isAutoMutedByAI: boolean;
  lastPeakDb: number;
}

export class SpatialAudioEngine {
  private audioCtx: AudioContext | null = null;
  private listener: AudioListener | null = null;
  private localPosition: PlayerCoordinate = { x: 0, y: 0, z: 0 };
  private peers: Map<string, SpatialPeerNode> = new Map();
  private localMediaStream: MediaStream | null = null;
  private mediaAnalyser: AnalyserNode | null = null;
  private isMicActive: boolean = false;
  private maxDistance: number = 30; // Max spatial hearing distance in coordinate units (meters)
  private refDistance: number = 2; // Distance where volume is 100%
  private rolloffFactor: number = 1.5;
  private socket: any = null;
  private roomId: string = 'global';
  private localUsername: string = 'Player';
  private onPeersUpdate?: (peers: SpatialPeerNode[]) => void;
  private onAIMuteTriggered?: (peerId: string, reason: string) => void;

  constructor(
    localUsername: string = 'Player',
    onPeersUpdate?: (peers: SpatialPeerNode[]) => void,
    onAIMuteTriggered?: (peerId: string, reason: string) => void
  ) {
    this.localUsername = localUsername;
    this.onPeersUpdate = onPeersUpdate;
    this.onAIMuteTriggered = onAIMuteTriggered;
  }

  // Initialize Web Audio Context and Audio Listener
  public async initAudioContext(): Promise<AudioContext | null> {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.listener = this.audioCtx.listener;

        // Set initial listener position at origin (0, 0, 0)
        this.setListenerPosition(0, 0, 0);
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  // Bind Socket connection for WebRTC signaling and AI moderation flags
  public bindSocket(socket: any, roomId: string) {
    this.socket = socket;
    this.roomId = roomId;

    if (!socket) return;

    // Listen for WebRTC signaling
    socket.on('voice:peer_position', (data: { peerId: string; username: string; position: PlayerCoordinate }) => {
      this.updatePeerPosition(data.peerId, data.username, data.position);
    });

    socket.on('voice:ai_auto_mute', (data: { peerId: string; username: string; reason: string; durationMs: number }) => {
      console.warn(`[AI AUDIO MODERATION] Server auto-muted peer ${data.username} (${data.peerId}). Reason: ${data.reason}`);
      const peer = this.peers.get(data.peerId);
      if (peer) {
        peer.isAutoMutedByAI = true;
        peer.gainNode.gain.setValueAtTime(0, this.audioCtx?.currentTime || 0);
      }
      if (this.onAIMuteTriggered) {
        this.onAIMuteTriggered(data.peerId, data.reason);
      }
      this.notifyPeersChanged();
    });

    socket.on('voice:webrtc_offer', async (data: { fromPeerId: string; offer: RTCSessionDescriptionInit }) => {
      await this.handleOffer(data.fromPeerId, data.offer);
    });

    socket.on('voice:webrtc_answer', async (data: { fromPeerId: string; answer: RTCSessionDescriptionInit }) => {
      await this.handleAnswer(data.fromPeerId, data.answer);
    });

    socket.on('voice:ice_candidate', async (data: { fromPeerId: string; candidate: RTCIceCandidateInit }) => {
      await this.handleIceCandidate(data.fromPeerId, data.candidate);
    });
  }

  // Update local player position in game world and notify WebAudio Listener & socket peers
  public setLocalPosition(x: number, y: number, z: number = 0) {
    this.localPosition = { x, y, z };
    this.setListenerPosition(x, y, z);

    // Recalculate spatial distances & attenuation for all connected peers
    this.recalculateAllPeerDistances();

    // Broadcast position over WebRTC / Socket signaling
    if (this.socket && this.roomId) {
      this.socket.emit('voice:update_position', {
        roomId: this.roomId,
        position: { x, y, z },
      });
    }
  }

  // Update position of AudioListener node
  private setListenerPosition(x: number, y: number, z: number) {
    if (!this.listener || !this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    if (this.listener.positionX) {
      this.listener.positionX.setValueAtTime(x, now);
      this.listener.positionY.setValueAtTime(y, now);
      this.listener.positionZ.setValueAtTime(z, now);
    } else {
      // Fallback for older browsers
      (this.listener as any).setPosition(x, y, z);
    }
  }

  // Add or update a peer node with PannerNode spatial spatialization
  public updatePeerPosition(peerId: string, username: string, pos: PlayerCoordinate) {
    let peer = this.peers.get(peerId);

    if (!peer) {
      if (!this.audioCtx) this.initAudioContext();
      if (!this.audioCtx) return;

      // Create WebAudio PannerNode with HRTF panning and distance attenuation
      const panner = this.audioCtx.createPanner();
      panner.panningModel = 'HRTF'; // High quality 3D binaural spatial panning
      panner.distanceModel = 'inverse'; // Realistic inverse distance sound decay
      panner.refDistance = this.refDistance;
      panner.maxDistance = this.maxDistance;
      panner.rolloffFactor = this.rolloffFactor;
      panner.coneInnerAngle = 360; // Omni-directional voice dispersion

      // Create GainNode for client volume control and mutes
      const gain = this.audioCtx.createGain();
      panner.connect(gain);
      gain.connect(this.audioCtx.destination);

      peer = {
        peerId,
        username,
        position: pos,
        pannerNode: panner,
        gainNode: gain,
        distance: 0,
        volume: 1.0,
        isMuted: false,
        isAutoMutedByAI: false,
        lastPeakDb: -60,
      };

      this.peers.set(peerId, peer);
    }

    peer.position = pos;
    this.updatePannerNodePosition(peer.pannerNode, pos.x, pos.y, pos.z);

    // Calculate Euclidean distance: sqrt((x2-x1)^2 + (y2-y1)^2 + (z2-z1)^2)
    const dist = Math.sqrt(
      Math.pow(pos.x - this.localPosition.x, 2) +
        Math.pow(pos.y - this.localPosition.y, 2) +
        Math.pow(pos.z - this.localPosition.z, 2)
    );

    peer.distance = Math.round(dist * 10) / 10;

    // Calculate relative volume percentage based on distance inverse model
    if (dist <= this.refDistance) {
      peer.volume = 1.0;
    } else if (dist >= this.maxDistance) {
      peer.volume = 0.0;
    } else {
      peer.volume = Math.max(
        0,
        Math.min(1, this.refDistance / (this.refDistance + this.rolloffFactor * (dist - this.refDistance)))
      );
    }

    if (!peer.isMuted && !peer.isAutoMutedByAI) {
      peer.gainNode.gain.setValueAtTime(peer.volume, this.audioCtx?.currentTime || 0);
    }

    this.notifyPeersChanged();
  }

  // Update 3D coordinates on PannerNode
  private updatePannerNodePosition(panner: PannerNode, x: number, y: number, z: number) {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    if (panner.positionX) {
      panner.positionX.setValueAtTime(x, now);
      panner.positionY.setValueAtTime(y, now);
      panner.positionZ.setValueAtTime(z, now);
    } else {
      (panner as any).setPosition(x, y, z);
    }
  }

  // Recalculate attenuation for all peer streams when local player moves
  private recalculateAllPeerDistances() {
    this.peers.forEach((peer) => {
      this.updatePeerPosition(peer.peerId, peer.username, peer.position);
    });
  }

  // Attach audio stream from WebRTC to spatial PannerNode
  public attachRemoteStream(peerId: string, stream: MediaStream) {
    const peer = this.peers.get(peerId);
    if (!peer || !this.audioCtx) return;

    try {
      const source = this.audioCtx.createMediaStreamSource(stream);
      source.connect(peer.pannerNode);
      peer.audioStream = stream;

      // HTML audio element fallback
      const audioEl = new Audio();
      audioEl.srcObject = stream;
      audioEl.muted = true; // WebAudio handles playback routing
      audioEl.play().catch(() => {});
      peer.audioElement = audioEl;

      console.log(`[SPATIAL AUDIO] Remote stream attached for peer ${peer.username} (${peerId})`);
    } catch (err) {
      console.error('Error attaching remote media stream to PannerNode:', err);
    }
  }

  // Start local microphone capture and setup background AI moderation monitoring
  public async startMicrophone(): Promise<MediaStream | null> {
    await this.initAudioContext();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone media devices API not supported.');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.localMediaStream = stream;
      this.isMicActive = true;

      // Setup local audio analyzer node for live peak dB & chunk streaming
      if (this.audioCtx) {
        const source = this.audioCtx.createMediaStreamSource(stream);
        this.mediaAnalyser = this.audioCtx.createAnalyser();
        this.mediaAnalyser.fftSize = 256;
        source.connect(this.mediaAnalyser);

        // Periodically process audio samples for peak detection and AI classification sweep
        this.startBackgroundAudioSweep();
      }

      return stream;
    } catch (err) {
      console.error('Failed to access microphone stream:', err);
      this.isMicActive = false;
      throw err;
    }
  }

  // Stop local microphone
  public stopMicrophone() {
    if (this.localMediaStream) {
      this.localMediaStream.getTracks().forEach((track) => track.stop());
      this.localMediaStream = null;
    }
    this.isMicActive = false;
  }

  // Mute / Unmute a specific peer on client
  public setPeerMute(peerId: string, isMuted: boolean) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.isMuted = isMuted;
      if (isMuted || peer.isAutoMutedByAI) {
        peer.gainNode.gain.setValueAtTime(0, this.audioCtx?.currentTime || 0);
      } else {
        peer.gainNode.gain.setValueAtTime(peer.volume, this.audioCtx?.currentTime || 0);
      }
      this.notifyPeersChanged();
    }
  }

  // Background sweep: computes RMS acoustic energy & sends ephemeral audio chunks for AI Moderation
  private startBackgroundAudioSweep() {
    if (!this.mediaAnalyser) return;

    const dataArray = new Uint8Array(this.mediaAnalyser.frequencyBinCount);

    const checkPeakAndClassify = () => {
      if (!this.isMicActive || !this.mediaAnalyser) return;

      this.mediaAnalyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avgSq = sum / dataArray.length;
      const rmsDb = 20 * Math.log10(avgSq / 255 + 0.0001);

      // If extreme acoustic outburst (> -10dB peak), submit immediate server AI moderation check
      if (rmsDb > -10 && this.socket) {
        this.socket.emit('voice:audio_sweep', {
          roomId: this.roomId,
          peakDb: Math.round(rmsDb),
          timestamp: Date.now(),
        });
      }

      setTimeout(checkPeakAndClassify, 1000);
    };

    checkPeakAndClassify();
  }

  // WebRTC Offer/Answer/ICE Handlers
  private async handleOffer(fromPeerId: string, offer: RTCSessionDescriptionInit) {
    // Peer connection handler stub for WebRTC mesh / SFU
  }

  private async handleAnswer(fromPeerId: string, answer: RTCSessionDescriptionInit) {
    // Answer handler stub
  }

  private async handleIceCandidate(fromPeerId: string, candidate: RTCIceCandidateInit) {
    // ICE candidate handler stub
  }

  private notifyPeersChanged() {
    if (this.onPeersUpdate) {
      this.onPeersUpdate(Array.from(this.peers.values()));
    }
  }

  public getPeers(): SpatialPeerNode[] {
    return Array.from(this.peers.values());
  }

  public getIsMicActive(): boolean {
    return this.isMicActive;
  }

  public getLocalPosition(): PlayerCoordinate {
    return { ...this.localPosition };
  }

  // Destroy and clean up audio context & media streams
  public destroy() {
    this.stopMicrophone();
    this.peers.forEach((peer) => {
      if (peer.audioElement) {
        peer.audioElement.pause();
        peer.audioElement.srcObject = null;
      }
    });
    this.peers.clear();
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }
}
