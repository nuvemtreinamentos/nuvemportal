interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
  lang: string;
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
  private isPlaying: boolean = false;

  constructor() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'pt-BR';
    }

    if ('speechSynthesis' in window) {
      this.synthesis = new SpeechSynthesisUtterance();
      this.synthesis.lang = 'pt-BR';
    }
  }

  private splitIntoSentences(text: string): string[] {
    // Split by common sentence terminators while preserving the terminators
    return text
      .split(/([.!?]+)/)
      .reduce((acc: string[], current, index, array) => {
        if (index % 2 === 0) {
          // If there's a next piece (punctuation), combine them
          if (array[index + 1]) {
            acc.push(current + array[index + 1]);
          } else if (current.trim()) {
            // If it's the last piece and not empty, add it
            acc.push(current);
          }
        }
        return acc;
      }, [])
      .filter(sentence => sentence.trim().length > 0);
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

      setTimeout(() => {
        if (this.isListening && this.recognition) {
          this.recognition.stop();
        }
      }, 10000);
    });
  }

  async speak(text: string) {
    if (this.isPlaying) {
      console.log('Already playing, queuing next sentence...');
      return;
    }

    const sentences = this.splitIntoSentences(text);
    this.isPlaying = true;

    try {
      for (const sentence of sentences) {
        if (sentence.trim()) {
          const response = await fetch('/api/speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: sentence })
          });

          const audioBlob = await response.blob();
          const audio = new Audio(URL.createObjectURL(audioBlob));

          // Wait for the current sentence to finish before playing the next
          await new Promise<void>((resolve) => {
            audio.onended = () => resolve();
            audio.play().catch(console.error);
          });
        }
      }
    } catch (error) {
      console.error('Error in sequential speech:', error);
      throw error;
    } finally {
      this.isPlaying = false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

export const speechHandler = new SpeechHandler();