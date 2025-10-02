import { Floating, FloatingContainer, FloatingTrigger, ProtoButton, match, useColorScheme } from "@opencast/appkit";
import { useTranslation } from "react-i18next";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { CSSObject } from "@emotion/react";
import { JSX, useState } from "react";

import { COLORS, focusStyle } from "../util";
import { SHORTCUTS, ShortcutKeys, useShortcut, useShowAvailableShortcuts } from "../shortcuts";


type StepButtonProps = {
  kind: "next" | "prev";
  label?: string;
  danger?: boolean;
  icon?: JSX.Element;
  disabled?: boolean;
  onClick?: () => void;
  popoverEntries?: ({
    icon: JSX.Element;
    label: string;
  } & ({ onClick: () => void } | { href: string }))[];
};

const StepButton: React.FC<StepButtonProps> = ({
  kind, label, icon, disabled, danger, onClick, popoverEntries,
}) => {
  const { t } = useTranslation();
  const showShortcut = useShowAvailableShortcuts();
  const isDark = useColorScheme().scheme === "dark";
  const { isHighContrast } = useColorScheme();
  const shortcut = match(kind, {
    prev: () => SHORTCUTS.general.prev,
    next: () => SHORTCUTS.general.next,
  });
  const [open, setOpen] = useState(false);
  const click = popoverEntries ? () => setOpen(old => !old) : () => onClick?.();
  useShortcut(shortcut, click, { enabled: !disabled }, [click, shortcut, disabled]);

  const button = (
    <ProtoButton
      disabled={disabled}
      onClick={click}
      css={{
        position: "relative",
        display: "flex",
        gap: 8,
        alignItems: "center",
        lineHeight: 1,
        ...focusStyle({ offset: -1 }),
        ...danger && { "--color-focus": COLORS.danger4 },
        borderRadius: 8,
        border: `1px solid ${danger ? COLORS.danger4 : COLORS.neutral50}`,
        color: danger ? COLORS.danger4 : COLORS.neutral80,
        backgroundColor: danger ? COLORS.danger0 : COLORS.neutral05,
        padding: "12px 24px",
        ...match(kind, {
          "next": () => ({ paddingRight: 16 }) as CSSObject,
          "prev": () => ({ paddingLeft: 16 }) as CSSObject,
        }),

        '&[data-floating-state="open"] svg': {
          transform: "rotate(-90deg)",
        },
        "svg": {
          transition: "transform 0.15s",
          flexShrink: 0,
        },

        "&[disabled]": {
          color: COLORS.neutral60,
          borderColor: COLORS.neutral15,
          backgroundColor: COLORS.neutral15,
        },

        "&:not([disabled]):hover, &:not([disabled]):focus-visible": {
          borderColor: danger ? COLORS.danger5 : COLORS.neutral70,
          color: danger ? COLORS.danger5 : COLORS.neutral90,
          boxShadow: isHighContrast ? "none" : "0 0 8px var(--shadow-color)",
          ...danger && { backgroundColor: COLORS.danger1 },
          ...isHighContrast && {
            outline: `2px solid ${danger ? COLORS.danger5 : COLORS.accent4}`,
            borderColor: "transparent",
          },
        },
      }}
    >
      {kind === "prev" && (icon ?? <FiChevronLeft />)}
      {label ?? t(`steps.${kind === "next" ? "next" : "back"}-button-label`)}
      {kind === "next" && (icon ?? <FiChevronRight css={{
      }}/>)}
      {showShortcut && !disabled && (
        <div css={{
          position: "absolute",
          top: -24,
          left: -6,
          padding: 2,
          borderRadius: 4,
          backgroundColor: COLORS.neutral05,
        }}><ShortcutKeys shortcut={shortcut} /></div>
      )}
    </ProtoButton>
  );

  // One would think we can just always return a `FloatingContainer`, which just
  // sometimes does nothing. But no: this confuses screenreaders as they would
  // always announce that this button opens a menu.
  if (!popoverEntries) {
    return button;
  }

  return (
    <FloatingContainer
      placement="top-end"
      open={open}
      onClose={() => setOpen(false)}
      ariaRole="menu"
      arrowSize={8}
      viewPortMargin={12}
      borderRadius={8}
      distance={6}
    >
      <FloatingTrigger>{button}</FloatingTrigger>
      <Floating
        backgroundColor={isDark ? COLORS.neutral15 : COLORS.neutral05}
        borderWidth={isDark ? 1 : 0}
        padding={0}
        shadowBlur={8}
      >
        <ul css={{
          borderRadius: 8,
          margin: 0,
          paddingLeft: 0,
          overflow: "hidden",
          listStyle: "none",
        }}>
          {popoverEntries?.map((entry, i) => {
            const style = {
              display: "flex",
              gap: 16,
              alignItems: "center",
              width: "100%",
              minWidth: 160,
              padding: 12,
              color: COLORS.neutral80,
              cursor: "pointer",
              textDecoration: "none",
              ...focusStyle({ inset: true }),
              "& > svg": {
                maxHeight: 23,
                fontSize: 23,
                color: COLORS.neutral60,
                width: 24,
                strokeWidth: 2,
                "& > path": { strokeWidth: "inherit" },
              },
              ":hover, :focus": {
                backgroundColor: COLORS.neutral10,
                color: "inherit",
              },
            };

            return (
              <li key={i} css={{
                ":first-of-type > *": { borderRadius: "8px 8px 0 0" },
                ":last-of-type> *": { borderRadius: "0 0 8px 8px" },
                ":not(:first-of-type)": {
                  borderTop: `1px solid ${COLORS.neutral30}`,
                },
              }}>
                {"href" in entry
                  ? <a
                    role="button"
                    href={entry.href}
                    css={style}
                    onKeyDown={e => {
                      if (e.key === " ") {
                        e.preventDefault();
                        window.location.href = entry.href;
                      }
                    }}
                  >
                    {entry.icon}
                    {entry.label}
                  </a>
                  : <ProtoButton onClick={entry.onClick} css={style}>
                    {entry.icon}
                    {entry.label}
                  </ProtoButton>
                }
              </li>
            );
          })}
        </ul>
      </Floating>
    </FloatingContainer>
  );
};

type StepContainerProps = React.PropsWithChildren<{
  title: string;
  note?: string;
  nextButton?: Omit<StepButtonProps, "kind">;
  prevButton?: Omit<StepButtonProps, "kind">;
}>;

export const StepContainer: React.FC<StepContainerProps> = ({
  title,
  note,
  nextButton,
  prevButton,
  children,
}) => {
  return (
    <div css={{
      flex: "1",
      minWidth: "var(--min-page-width)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: 12,
      "@media (min-width: 500px) and (min-height: 500px)": {
        gap: 16,
        padding: 24,
      },
    }}>
      <div>
        <h1 aria-live="polite" css={{
          textAlign: "center",
          fontSize: 32,
          fontWeight: 700,
          color: COLORS.neutral70,
          "@media screen and (max-width: 600px), screen and (max-height: 400px)": {
            fontSize: 26,
          },
        }}>{title}</h1>
        {note && (
          <div css={{
            fontSize: 14,
            color: COLORS.neutral60,
            textAlign: "center",
            lineHeight: 1.3,
            maxWidth: "100ch",
            margin: "0 auto",
          }}>
            {note}
          </div>
        )}
      </div>
      <div css={{
        flex: "1",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
      }}>
        {children}
      </div>
      <div css={{
        display: "flex",
        justifyContent: "end",
        alignItems: "end",
        gap: 8,
        minHeight: 42,
      }}>
        {prevButton && <StepButton kind="prev" {...prevButton} />}
        {nextButton && <StepButton kind="next" {...nextButton} />}
      </div>
    </div>
  );
};
