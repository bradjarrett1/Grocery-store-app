import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

export interface VoiceItem {
  name: string;
  category: string | null;
}

const recordingOptions: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  web: {},
};

export async function requestMicPermission(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

export async function startRecording(): Promise<Audio.Recording> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });
  const { recording } = await Audio.Recording.createAsync(recordingOptions);
  return recording;
}

export async function stopAndProcess(
  recording: Audio.Recording,
  categoryNames: string[]
): Promise<VoiceItem[]> {
  await recording.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  const uri = recording.getURI();
  if (!uri) throw new Error('No audio recorded');

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
  }

  const prompt = `This is a voice recording of someone listing grocery items to add to their shopping list.

Extract every grocery item they mention. Ignore filler phrases like "add to my list", "I need", "can you", "please", "and", "also", "maybe".

Available categories: ${categoryNames.join(', ')}

Return ONLY a valid JSON array — no markdown, no code blocks, no explanation:
[{"name": "item name", "category": "exact category name from the list above, or null if none fits"}]

Examples:
- "Add milk eggs and bread" → [{"name":"milk","category":"Dairy"},{"name":"eggs","category":"Dairy"},{"name":"bread","category":"Bakery"}]
- "I need apples and maybe some chicken" → [{"name":"apples","category":"Produce"},{"name":"chicken","category":"Meat"}]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: 'audio/mp4',
                  data: base64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 1024 },
      }),
    }
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error?.message ?? 'Voice processing failed');
  }

  const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse voice response');
  }
}
