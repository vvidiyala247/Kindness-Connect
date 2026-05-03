import { useState, useRef, useCallback, useEffect } from "react";
import { Platform } from "react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

type Options = {
  onFinalTranscript: (text: string) => void;
};

type VoiceInputResult = {
  isListening: boolean;
  isSupported: boolean;
  interimTranscript: string;
  toggle: () => void;
  stop: () => void;
};

function detectSupport(): boolean {
  if (Platform.OS === "ios" || Platform.OS === "android") return true;
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

export function useVoiceInput({ onFinalTranscript }: Options): VoiceInputResult {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported] = useState(detectSupport);
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;

  // Native & web speech result events — always registered (Rules of Hooks)
  useSpeechRecognitionEvent("result", (event) => {
    const isFinal = event.isFinal;
    const transcript = event.results[0]?.transcript ?? "";
    if (isFinal) {
      if (transcript.trim()) {
        onFinalRef.current(transcript.trim());
      }
      setInterimTranscript("");
    } else {
      setInterimTranscript(transcript);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    // Ignore "no-speech" silences — user just paused
    if (event.error === "no-speech") return;
    setIsListening(false);
    setInterimTranscript("");
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
    setInterimTranscript("");
  });

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) return;

    // Request microphone + speech recognition permissions (iOS + Android)
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) return;

    setInterimTranscript("");
    setIsListening(true);

    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: true,
    });
  }, [isSupported]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  // Abort on unmount so recognition never leaks
  useEffect(() => {
    return () => {
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  return { isListening, isSupported, interimTranscript, toggle, stop };
}
