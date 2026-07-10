import { getTwemojiPngUrlCandidatesForValue } from "@utils/emojis/unicodeEmoji";
import { Image as ExpoImage } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { Image as RNImage } from "react-native";

interface Props {
  value: string;
  size?: number;
  accessibilityLabel?: string;
  onPress?: () => void;
}

const useTwemojiCandidates = (value: string) =>
  useMemo(() => getTwemojiPngUrlCandidatesForValue(value), [value]);

/**
 * Twemoji for block / flex layouts. Uses expo-image for disk + memory caching.
 */
export const Twemoji = ({ value, size = 22, accessibilityLabel }: Props) => {
  const candidates = useTwemojiCandidates(value);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [value]);

  const uri = candidates[candidateIndex] ?? candidates[0];

  useEffect(() => {
    if (uri) void ExpoImage.prefetch(uri);
  }, [uri]);

  if (!uri) return null;

  return (
    <ExpoImage
      source={{ uri }}
      style={{ width: size, height: size }}
      contentFit="contain"
      cachePolicy="memory-disk"
      onError={() => {
        setCandidateIndex((index) =>
          index + 1 < candidates.length ? index + 1 : index,
        );
      }}
      accessibilityLabel={accessibilityLabel ?? value}
    />
  );
};

/**
 * Twemoji nested inside React Native Text (markdown inline runs).
 * RN Text only allows native Image children — expo-image is a View and cannot nest.
 * Uses the same PNG URLs + cache policy as {@link Twemoji}.
 */
export const InlineTwemoji = ({
  value,
  size = 22,
  accessibilityLabel,
}: Props) => {
  const candidates = useTwemojiCandidates(value);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [value]);

  const uri = candidates[candidateIndex] ?? candidates[0];

  useEffect(() => {
    if (uri) void ExpoImage.prefetch(uri);
  }, [uri]);

  if (!uri) return null;

  return (
    <RNImage
      source={{ uri }}
      style={{
        width: size,
        height: size,
        transform: [{ translateY: 2 }],
      }}
      resizeMode="contain"
      onError={() => {
        setCandidateIndex((index) =>
          index + 1 < candidates.length ? index + 1 : index,
        );
      }}
      accessibilityLabel={accessibilityLabel ?? value}
    />
  );
};
