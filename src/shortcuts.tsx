import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  match, SingleKeyContainer, KeyCombinationContainer, ShortcutGroupOverview,
} from "@opencast/appkit";
import { LuArrowBigUp, LuOption } from "react-icons/lu";
import { FiArrowLeft, FiArrowRight, FiCommand } from "react-icons/fi";
import { Options, useHotkeys } from "react-hotkeys-hook";
import TabIcon from "@opencast/appkit/dist/icons/tab-key.svg";

import { COLORS } from "./util";
import { OverlayBox } from "./layout";


const onMac = () => navigator.userAgent.includes("Mac");

export const SHORTCUTS = {
  general: {
    showAvailableShortcuts: "Alt; s",
    showOverview: "?",
    closeOverlay: "Escape",
    tab: "Tab",
    prev: onMac() ? "Shift+Mod+left" : "Mod+left",
    next: onMac() ? "Shift+Mod+right" : "Mod+right",
  },
  videoSetup: {
    selectScreen: "1",
    selectBoth: "2",
    selectUser: "3",
  },
  audioSetup: {
    withAudio: "1",
    withoutAudio: "2",
  },
  recording: {
    startPauseResume: "k; Space",
  },
  review: {
    playPause: "k; Space",
    forwards5secs: "l; right",
    backwards5secs: "j; left",
    forwardsFrame: ".",
    backwardsFrame: ",",
    cutLeft: "n",
    cutRight: "m",
    removeCutLeft: "Shift+n",
    removeCutRight: "Shift+m",
  },
  finish: {
    startNewRecording: "Shift+n",
    download: "d",
  },
} as const;

const SHORTCUT_TRANSLATIONS = {
  general: {
    showAvailableShortcuts: "shortcuts.general.show-available-shortcuts",
    showOverview: "shortcuts.general.show-overview",
    closeOverlay: "shortcuts.general.close-overlay",
    tab: "shortcuts.general.tab-elements",
    prev: "shortcuts.general.back-button",
    next: "shortcuts.general.next-button",
  },
  videoSetup: {
    selectScreen: "shortcuts.select-video.select-display",
    selectBoth: "shortcuts.select-video.select-both",
    selectUser: "shortcuts.select-video.select-camera",
  },
  audioSetup: {
    withAudio: "shortcuts.select-audio.select-microphone",
    withoutAudio: "shortcuts.select-audio.select-no-audio",
  },
  recording: {
    startPauseResume: "shortcuts.record.start-pause-resume-recording",
  },
  review: {
    playPause: "shortcuts.review.play-pause",
    forwards5secs: "shortcuts.review.skip-five",
    backwards5secs: "shortcuts.review.back-five",
    forwardsFrame: "shortcuts.review.frame-forward",
    backwardsFrame: "shortcuts.review.frame-back",
    cutLeft: "shortcuts.review.cut-left",
    cutRight: "shortcuts.review.cut-right",
    removeCutLeft: "shortcuts.review.delete-left",
    removeCutRight: "shortcuts.review.delete-right",
  },
  finish: {
    startNewRecording: "shortcuts.finish.new-recording",
    download: "steps.finish.save-locally.label",
  },
} as const;

const KEY_TRANSLATIONS = {
  "Escape": "escape",
  "Space": "space",
  "Shift": "shift",
  "Alt": onMac() ? "option" : "alt",
  "Mod": onMac() ? "command" : "control",
} as const;


/** Like `useHotkeys` but with pre-set options. */
export const useShortcut = (
  keys: string,
  callback: () => void,
  options: Omit<Options, "delimiter"> = {},
  deps: unknown[] = [],
) => {
  return useHotkeys(keys, callback, { delimiter: ";", ...options }, deps);
};

/**
 * Helper to show an overlay of active shortcuts when Alt is pressed. Returns
 * `true` if the overlay should be shown.
 */
export const useShowAvailableShortcuts = () => {
  const [active, setActive] = useState(false);
  const enable = (event: KeyboardEvent) => {
    const correctKeyPressed = SHORTCUTS.general.showAvailableShortcuts.split(";")
      .some(s => s.trim().toLowerCase() == event.key.toLowerCase());
    if (correctKeyPressed) {
      setActive(true);
    }
  };
  const disable = () => setActive(false);

  useEffect(() => {
    document.addEventListener("keydown", enable);
    document.addEventListener("keyup", disable);
    document.addEventListener("mousedown", disable);
    window.addEventListener("blur", disable);
    return () => {
      document.removeEventListener("keydown", enable);
      document.removeEventListener("keyup", disable);
      document.removeEventListener("mousedown", disable);
      window.removeEventListener("blur", disable);
    };
  });

  return active;
};

type ShortcutKeysProps = {
  shortcut: string;
  large?: boolean;
};

export const ShortcutKeys: React.FC<ShortcutKeysProps> = ({ shortcut, large = false }) => {
  const { t } = useTranslation();
  return <KeyCombinationContainer>
    {shortcut.split("+").map((key, i) => {
      let s = key;
      if (key in KEY_TRANSLATIONS) {
        const translationKey = KEY_TRANSLATIONS[key as keyof typeof KEY_TRANSLATIONS];
        s = t(`shortcuts.keys.${translationKey}`);
      }
      const child = match(key, {
        "left": () => <FiArrowLeft title={s} />,
        "right": () => <FiArrowRight title={s} />,
        "Mod": () => onMac() ? <FiCommand title={s} /> : <>{s}</>,
        "Alt": () => onMac() ? <LuOption title={s} /> : <>{s}</>,
        "Shift": () => <>{s}<LuArrowBigUp size={20} title={s} /></>,
        "Tab": () => <>{s}<TabIcon /></>,
      }) ?? <>{s}</>;

      return <SingleKeyContainer key={i} css={{
        ...key === "l" && { fontFamily: "monospace" },
        ...!large && {
          height: 30,
          minWidth: 30,
          backgroundColor: COLORS.neutral10,
          color: COLORS.neutral80,
        },
      }}>
        {child}
      </SingleKeyContainer>;
    })}
  </KeyCombinationContainer>;
};

type ShortCutOverviewProps = {
  close: () => void;
};

export const ShortcutOverview: React.FC<ShortCutOverviewProps> = ({ close }) => {
  const { t } = useTranslation();

  return <OverlayBox maxWidth={1000} close={close} title={t("shortcuts.label")}>
    {Object.entries(SHORTCUTS).map(([groupId, group]) => {
      const key = groupId as keyof typeof SHORTCUTS;
      const shortcuts = Object.entries(group).map(([name, keys]) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: t((SHORTCUT_TRANSLATIONS[key] as any)[name]),
        combinations: keys.split(";").map((combination, i) => (
          <ShortcutKeys key={i} shortcut={combination.trim()} large />
        )),
      }));

      return <ShortcutGroupOverview
        key={groupId}
        alternativeSeparator={t("shortcuts.sequence-seperator")}
        title={t(GROUP_ID_TRANSLATIONS[key])}
        shortcuts={shortcuts}
      />;
    })}
  </OverlayBox>;
};


const GROUP_ID_TRANSLATIONS = {
  general: "shortcuts.general.title",
  videoSetup: "steps.video.label",
  audioSetup: "steps.audio.label",
  recording: "steps.record.label",
  review: "steps.review.label",
  finish: "steps.finish.label",
} as const satisfies Record<keyof typeof SHORTCUTS, string>;
