import type { Data, PhrasingContent } from "mdast";
import "micromark-util-types";
import type { ReactNode } from "react";
import type { Parent } from "unist";

declare module "micromark-util-types" {
    interface TokenTypeMap {
        underline: "underline";
        underlineSequence: "underlineSequence";
        underlineText: "underlineText";

        strikethrough: "strikethrough";
        strikethroughSequence: "strikethroughSequence";
        strikethroughText: "strikethroughText";

        spoiler: "spoiler";
        spoilerSequence: "spoilerSequence";
        spoilerText: "spoilerText";
    }

    interface Spoiler extends Parent {
        type: "spoiler";
        children: ReactNode[];
        data?: Data;
    }

    interface Strikethrough extends Parent {
        type: "strikethrough";
        children: PhrasingContent[];
        data?: Data;
    }

    interface Underline extends Parent {
        type: "underline";
        children: PhrasingContent[];
        data?: Data;
    }

    interface Emoji extends Parent {
        type: "emoji";
        name: string;
        url: string;
        unicode: string;
        data?: Data;
    }

    interface Extension {
        underlineMarkers?: {
            null: Code[] | undefined;
        };
        strikethroughMarkers?: {
            null: Code[] | undefined;
        };
        spoilerMarkers?: {
            null: Code[] | undefined;
        };
    }
}
