import { useState } from 'react';

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
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
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
  private lastSpeechTime: number = 0;
  private silenceTimer: NodeJS.Timeout | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private nextAudio: HTMLAudioElement | null = null;
  private finalTranscript: string = '';
  private interimTranscript: string = '';

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
    return text
      .split(/([.!?]+)/)
      .reduce((acc: string[], current, index, array) => {
        if (index % 2 === 0) {
          if (array[index + 1]) {
            acc.push(current + array[index + 1]);
          } else if (current.trim()) {
            acc.push(current);
          }
        }
        return acc;
      }, [])
      .filter(sentence => sentence.trim().length > 0);
  }

  private async prepareAudioFromText(text: string): Promise<HTMLAudioElement> {
    const response = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    const audioBlob = await response.blob();
    const audio = new Audio(URL.createObjectURL(audioBlob));
    return audio;
  }

  private resetSilenceTimer(resolve: (transcript: string) => void, reject: (error: Error) => void) {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }

    this.silenceTimer = setTimeout(() => {
      if (Date.now() - this.lastSpeechTime > 2000) {
        this.stopListening();
        if (this.finalTranscript) {
          resolve(this.finalTranscript);
        } else {
          reject(new Error('Nenhuma fala detectada. Por favor, tente novamente.'));
        }
      }
    }, 2000);
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

      this.finalTranscript = '';
      this.interimTranscript = '';
      this.lastSpeechTime = Date.now();

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        this.lastSpeechTime = Date.now();
        this.interimTranscript = '';

        const results = event.results;
        for (let i = event.resultIndex; i < results.length; i++) {
          const result = results[i];
          if (result.isFinal) {
            this.finalTranscript += result[0].transcript;
          } else {
            this.interimTranscript += result[0].transcript;
          }
        }

        this.resetSilenceTimer(resolve, reject);
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.isListening = false;
        if (event.error === 'no-speech') {
          reject(new Error('Nenhuma fala detectada. Por favor, tente novamente.'));
        } else {
          reject(new Error(`Erro no reconhecimento de voz: ${event.error}`));
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
        }
        if (this.finalTranscript) {
          resolve(this.finalTranscript);
        } else {
          reject(new Error('Nenhuma fala detectada. Por favor, tente novamente.'));
        }
      };

      this.isListening = true;
      this.recognition.start();

      setTimeout(() => {
        if (this.isListening && this.recognition) {
          this.stopListening();
          if (this.finalTranscript) {
            resolve(this.finalTranscript);
          }
        }
      }, 30000);
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
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        if (!sentence.trim()) continue;

        // Prepare current audio
        this.currentAudio = await this.prepareAudioFromText(sentence);

        // Pre-load next audio if available
        if (i < sentences.length - 1) {
          this.nextAudio = await this.prepareAudioFromText(sentences[i + 1]);
        } else {
          this.nextAudio = null;
        }

        // Play current audio and set up overlap with next audio
        await new Promise<void>((resolve) => {
          if (!this.currentAudio) return resolve();

          this.currentAudio.onplay = () => {
            if (this.nextAudio && this.currentAudio) {
              // Start next audio 500ms before current ends
              const timeUntilNext = (this.currentAudio.duration * 1000) - 500;
              setTimeout(() => {
                this.nextAudio?.play().catch(console.error);
              }, timeUntilNext);
            }
          };

          this.currentAudio.onended = () => {
            resolve();
          };

          this.currentAudio.play().catch(console.error);
        });
      }
    } catch (error) {
      console.error('Error in sequential speech:', error);
      throw error;
    } finally {
      this.isPlaying = false;
      this.currentAudio = null;
      this.nextAudio = null;
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