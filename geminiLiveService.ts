import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private stream: MediaStream | null = null;
  private nextStartTime: number = 0;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }

  async connect(callbacks: {
    onAudio?: (base64: string) => void;
    onText?: (text: string) => void;
    onInterrupted?: () => void;
    onError?: (error: any) => void;
  }) {
    try {
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.nextStartTime = this.audioContext.currentTime;

      // In a real app, we'd load a worklet for PCM processing.
      // For this demo, we'll use a simpler approach or assume the user can handle the raw data.
      
      this.session = await this.ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: () => console.log("Live session opened"),
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              callbacks.onAudio?.(base64Audio);
              this.playAudio(base64Audio);
            }
            if (message.serverContent?.interrupted) {
              callbacks.onInterrupted?.();
              this.stopPlayback();
            }
            if (message.serverContent?.modelTurn?.parts[0]?.text) {
              callbacks.onText?.(message.serverContent.modelTurn.parts[0].text);
            }
          },
          onerror: (error) => callbacks.onError?.(error),
          onclose: () => console.log("Live session closed"),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a friendly, smooth-talking AI bro. Your tone is casual, helpful, and very approachable. You speak English. When the user says 'hi' or 'hello', reply with something smooth like 'Hey bro' or 'What's up, man?'. Keep your responses concise and engaging.",
        },
      });

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(this.stream);
      
      // We need an AudioWorklet to convert to PCM16. 
      // Since I can't easily create a separate worklet file and load it in this environment without more setup,
      // I'll use a ScriptProcessorNode (deprecated but works for quick demos) or a simplified worklet string.
      
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(this.audioContext.destination);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = this.floatTo16BitPCM(inputData);
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        this.session.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };

    } catch (error) {
      console.error("Connection error:", error);
      callbacks.onError?.(error);
    }
  }

  private floatTo16BitPCM(input: Float32Array) {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }

  private async playAudio(base64: string) {
    if (!this.audioContext) return;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;

    const buffer = this.audioContext.createBuffer(1, float32.length, 16000);
    buffer.getChannelData(0).set(float32);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    
    const startTime = Math.max(this.audioContext.currentTime, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;
  }

  private stopPlayback() {
    this.nextStartTime = this.audioContext?.currentTime || 0;
  }

  async sendVideoFrame(base64Data: string) {
    if (this.session) {
      this.session.sendRealtimeInput({
        media: { data: base64Data, mimeType: 'image/jpeg' }
      });
    }
  }

  disconnect() {
    this.session?.close();
    this.stream?.getTracks().forEach(t => t.stop());
    this.audioContext?.close();
  }
}
