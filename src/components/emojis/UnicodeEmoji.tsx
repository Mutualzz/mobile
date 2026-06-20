import {
    getTwemojiUrlCandidatesForValue,
} from "@utils/emojis/unicodeEmoji";
import { useEffect, useMemo, useState } from "react";
import { Image } from "react-native";
import { SvgUri } from "react-native-svg";

interface Props {
    value: string;
    size?: number;
}

export const UnicodeEmoji = ({ value, size = 18 }: Props) => {
    const candidates = useMemo(
        () => getTwemojiUrlCandidatesForValue(value),
        [value],
    );
    const [candidateIndex, setCandidateIndex] = useState(0);

    useEffect(() => {
        setCandidateIndex(0);
    }, [value]);

    const url = candidates[candidateIndex] ?? candidates[0];
    if (!url) return null;

    const tryNextCandidate = () => {
        setCandidateIndex((index) =>
            index + 1 < candidates.length ? index + 1 : index,
        );
    };

    if (url.endsWith(".svg")) {
        return (
            <SvgUri
                uri={url}
                width={size}
                height={size}
                onError={tryNextCandidate}
            />
        );
    }

    return (
        <Image
            source={{ uri: url }}
            style={{ width: size, height: size }}
            resizeMode="contain"
            onError={tryNextCandidate}
        />
    );
};
