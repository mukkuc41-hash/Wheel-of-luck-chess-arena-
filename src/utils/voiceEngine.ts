/**
 * Comprehensive Voice Command, Real-Time Dictation & Speech Engine
 * Architected for Zero-Trust Multi-Game Platforms
 */

export class PlatformVoiceEngine {
  private isListening: boolean = false;
  private recognition: any = null;
  private synth: SpeechSynthesis | null = null;
  private onTranscriptCallback?: (text: string, isFinal: boolean) => void;
  private onCommandCallback?: (actionType: string) => void;

  constructor(
    onTranscript?: (text: string, isFinal: boolean) => void,
    onCommand?: (actionType: string) => void
  ) {
    this.onTranscriptCallback = onTranscript;
    this.onCommandCallback = onCommand;
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
      this.initSpeechRecognition();
    }
  }

  // Initialize Web Speech API for Dictation & Voice Commands
  private initSpeechRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition API is not supported in this browser environment.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          const text = finalTranscript.trim();
          this.handleVoiceCommandOrInput(text.toLowerCase(), text);
          if (this.onTranscriptCallback) {
            this.onTranscriptCallback(text, true);
          }
        } else if (interimTranscript && this.onTranscriptCallback) {
          this.onTranscriptCallback(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error detected:', event.error);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    } catch (e) {
      console.error('Failed to initialize Speech Recognition:', e);
    }
  }

  // Check support
  public isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
  }

  // Start Listening for Voice Writing / Commands
  public startListening() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
        console.log('Voice Engine: Listening active...');
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  }

  // Stop Listening
  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
      console.log('Voice Engine: Listening stopped.');
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  // Speak text via SpeechSynthesis
  public speakText(text: string) {
    if (!this.synth) return;
    try {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      this.synth.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis error:', e);
    }
  }

  // Parse and Route Voice Commands or Inject Text Writing
  private handleVoiceCommandOrInput(normalized: string, originalText: string) {
    console.log(`Recognized Speech: "${originalText}"`);

    // Voice Command Mapping
    if (normalized.includes('open account') || normalized.includes('show account')) {
      this.triggerUIAction('toggle_account_modal');
    } else if (normalized.includes('rotate session') || normalized.includes('burn session')) {
      this.triggerUIAction('burn_and_rotate_session');
    } else if (normalized.includes('start game') || normalized.includes('play game')) {
      this.triggerUIAction('launch_random_game');
    } else {
      // Default behavior: Voice Writing (inject into focused text/chat input)
      this.injectTextToActiveInput(originalText);
    }
  }

  // Inject Dictated Text into UI Elements
  private injectTextToActiveInput(text: string) {
    if (typeof document === 'undefined') return;
    const activeElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      activeElement.value += (activeElement.value ? ' ' : '') + text;
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // Fallback to global chat input if present
      const chatInput = document.querySelector('#chat-input, .game-chat-field') as HTMLInputElement;
      if (chatInput) {
        chatInput.value += (chatInput.value ? ' ' : '') + text;
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  // Execute UI Triggers securely
  private triggerUIAction(actionType: string) {
    if (this.onCommandCallback) {
      this.onCommandCallback(actionType);
    }
    switch (actionType) {
      case 'toggle_account_modal':
        console.log('Executing UI Action: Opening Account Modal');
        break;
      case 'burn_and_rotate_session':
        console.log('Executing Security Action: Burning and Rotating Session Tokens...');
        break;
      case 'launch_random_game':
        console.log('Executing Game Action: Launching Match Arena');
        break;
      default:
        console.warn('Unknown voice command action:', actionType);
    }
  }
}

// Global window attachment for accessibility
if (typeof window !== 'undefined') {
  (window as any).PlatformVoiceEngine = PlatformVoiceEngine;
}
