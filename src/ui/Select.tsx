import React, { JSX } from "react";

import { COLORS, focusStyle } from "../util";
import { useColorScheme } from "@opencast/appkit";


type Props = JSX.IntrinsicElements["select"];

/** Styled `<select>` */
export const Select = React.forwardRef<HTMLSelectElement, Props>((props, ref) => (
  <select ref={ref} {...props} css={{
    position: "relative",
    borderRadius: 6,
    padding: "6px 12px",
    paddingRight: 32,
    backgroundColor: "transparent",
    border: `1px solid ${COLORS.neutral25}`,

    // Remove any browser styles and re-add custom arrow
    appearance: "none",
    background: 'url("data:image/svg+xml;utf8,'
      + "<svg xmlns='http://www.w3.org/2000/svg' width='2' height='1' "
      + `fill='${useColorScheme().scheme === "light" ? "%23555" : "%23aaa"}'>`
      + "<polygon points='0,0 2,0 1,1'/>"
      + '</svg>") no-repeat',
    backgroundSize: 12,
    backgroundPosition: "calc(100% - 12px) center",

    option: {
      backgroundColor: COLORS.neutral05,
      color: COLORS.neutral90,
    },
    ...focusStyle({ offset: -1 }),
  }}>{props.children}</select>
));
