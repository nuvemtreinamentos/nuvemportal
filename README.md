# Nuvem Treinamentos - AI Educational Platform

An advanced multilingual educational AI platform that combines voice interaction, intelligent visual explanations, and adaptive language learning technologies. The platform specializes in programming education and English learning, with primary support for Brazilian Portuguese.

## Features

- 🎙️ Voice Recognition in Brazilian Portuguese
- 🤖 AI-Powered Responses using GPT-4o
- 🖼️ Dynamic Image Generation with DALL-E 3
- 🗣️ Text-to-Speech in Brazilian Portuguese
- 💻 Code Snippets Display
- 📊 Visual Explanations
- 🔄 Real-time Interaction

## Technologies Used

- React + TypeScript for the frontend
- Express.js backend
- OpenAI API Integration (GPT-4o, DALL-E 3, TTS-1)
- Web Speech API for voice recognition
- Tailwind CSS + shadcn/ui for styling

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 18 or higher)
- npm (usually comes with Node.js)
- Git
- A modern web browser that supports the Web Speech API
- An OpenAI API key (obtain from https://platform.openai.com)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your OpenAI API key:
```env
OPENAI_API_KEY=your_api_key_here
```

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

## Usage

1. Click the "Iniciar Gravação" (Start Recording) button
2. Speak your question in Brazilian Portuguese
3. Wait for the AI to process your input
4. The response will be:
   - Spoken back to you in Brazilian Portuguese
   - Displayed on screen
   - Accompanied by code snippets or images when relevant

## Features in Detail

### Voice Recognition
- Optimized for Brazilian Portuguese
- Real-time speech-to-text conversion
- Clear visual feedback during recording

### AI Response System
- Contextual understanding of programming and language learning queries
- Automatic detection of when to provide code, images, or text responses
- Natural language processing in Brazilian Portuguese

### Visual Learning
- Dynamic generation of explanatory images
- Code syntax highlighting
- Clean, intuitive user interface

### Audio Output
- High-quality text-to-speech in Brazilian Portuguese
- Natural-sounding voice responses
- Clear pronunciation of technical terms

## Troubleshooting

1. **Microphone Issues**
   - Ensure your browser has permission to access the microphone
   - Check if your microphone is properly connected and selected

2. **API Key Issues**
   - Verify your OpenAI API key is correctly set in the `.env` file
   - Ensure your API key has sufficient credits and permissions

3. **Browser Compatibility**
   - Use a modern browser (Chrome, Firefox, Edge, Safari)
   - Enable JavaScript and required permissions

## Contributing

Feel free to open issues and pull requests for any improvements you'd like to suggest.

## License

[Add your chosen license here]

## Support

For any questions or issues, please open an issue in the repository.
