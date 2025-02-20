interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
  lang: string; // Add language property
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface Window {
  SpeechRecognition: new () => SpeechRecognition;
  webkitSpeechRecognition: new () => SpeechRecognition;
}

export class SpeechHandler {
  recognition: SpeechRecognition | null = null;
  synthesis: SpeechSynthesisUtterance | null = null;
  private isListening: boolean = false;

  constructor() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'pt-BR'; // Set language to Brazilian Portuguese
    }

    if ('speechSynthesis' in window) {
      this.synthesis = new SpeechSynthesisUtterance();
      this.synthesis.lang = 'pt-BR'; // Set synthesis language to Brazilian Portuguese
    }
  }

  async startListening(): Promise<string> {
    if (!this.recognition) {
      throw new Error('Reconhecimento de voz não suportado');
    }

    if (this.isListening) {
      throw new Error('Já está escutando');
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) return;

      let finalTranscript = '';
      let hasReceivedResult = false;

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        hasReceivedResult = true;
        const transcript = event.results[0][0].transcript;
        if (event.results[0].isFinal) {
          finalTranscript = transcript;
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (!hasReceivedResult) {
          reject(new Error('Nenhuma fala detectada. Por favor, tente novamente.'));
        } else if (finalTranscript) {
          resolve(finalTranscript);
        } else {
          reject(new Error('Não foi possível processar a fala. Por favor, tente novamente.'));
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.isListening = false;
        if (event.error === 'no-speech') {
          reject(new Error('Nenhuma fala detectada. Por favor, tente novamente.'));
        } else {
          reject(new Error(`Erro no reconhecimento de voz: ${event.error}`));
        }
      };

      this.isListening = true;
      this.recognition.start();

      // Set a timeout to stop listening after 10 seconds if no speech is detected
      setTimeout(() => {
        if (this.isListening && this.recognition) {
          this.recognition.stop();
        }
      }, 10000);
    });
  }

  async speak(text: string) {
    if (!this.synthesis) {
      throw new Error('Síntese de voz não suportada');
    }

    const response = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    const audioBlob = await response.blob();
    const audio = new Audio(URL.createObjectURL(audioBlob));
    await audio.play();
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

export const speechHandler = new SpeechHandler();