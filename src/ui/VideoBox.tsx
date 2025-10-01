import React, { useEffect, useMemo, useRef, useState } from "react";
import equal from "fast-deep-equal";

import { usePresentContext } from "../util";
import { bug } from "@opencast/appkit";


const VideoBoxResizeContext = React.createContext<(() => void) | null>(null);

export const useVideoBoxResize = () =>
  usePresentContext(VideoBoxResizeContext, "useVideoBoxResize");

export type VideoBoxProps = {
  gap?: number;
  minWidth?: number;
  minHeight?: number;
  children: VideoBoxChild[];
};

export type VideoBoxChild = {
  body: JSX.Element;
  dimensions: () => [number, number] | null;
  /**
   * If `false` (default), the calculated size is used for the divs. Otherwise,
   * `width` and `height` are unset, which means the div takes the size of its
   * child. Used for error messages.
   */
  autoSize?: boolean;
};

// Manages one or two children with given aspect ratio.
//
// Each child is given an aspect ratio. The child will be rendered within a
// `<div>` that maintains this exact aspect ratio. In the one child case, that
// `<div>` also perfectly fits within the parent container. In the case of two
// children, those children are laid out in such a way that the utilized screen
// space is maximized while both children have the same width or height.
//
// `children` has to be the length 1 or 2! The parameter `gap` specifies the
// width of the empty space between the two children in the case that two
// children are given.
//
// Each child in `children` needs to be an object with the following fields:
//
// - `body`: the rendered DOM.
// - `dimensions`: a function returning `[width, height]` of the child (also
//   defining the aspect ratio). We require the dimensions instead of only the
//   aspect ratio to better detect changes in the video stream.
export const VideoBox: React.FC<VideoBoxProps> = ({
  gap = 0,
  minWidth = 180,
  minHeight = 140,
  children,
}) => {
  const [{ width, height }, setSize] = useState({ width: 1, height: 1 });
  const resizeObserver = useMemo(() => new ResizeObserver(entries => {
    // The fact that two arrays are involved are not relevant for our case here,
    // they always have a single element.
    const size = entries[0].contentBoxSize[0];
    setSize({ width: size.inlineSize, height: size.blockSize });
  }), []);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }
    return () => resizeObserver.disconnect();
  });

  // This is a dummy state to force a rerender.
  const [, setForceCounter] = useState(0);
  const forceRender = () => setForceCounter(v => v + 1);

  // We try to remember the last valid dimension. Otherwise, changing video
  // preferences for a non-16:9 strean leads to visual noise: the box always
  // changes between its aspect ratio and the fallback 16:9 ratio.
  const lastDimensions = useRef<([number, number] | null)[]>(children.map(() => null));
  const updateLastDimensions = (newDimensions: ([number, number] | null)[]) => {
    newDimensions.forEach((dimension, i) => {
      if (dimension) {
        lastDimensions.current[i] = dimension;
      }
    });
  };

  // Setup the handler for when a video stream is resized.
  let dimensions = children.map(c => c.dimensions());
  updateLastDimensions(dimensions);
  const resizeVideoBox = () => {
    const newDimensions = children.map(c => c.dimensions());
    if (!equal(newDimensions, dimensions)) {
      dimensions = newDimensions;
      updateLastDimensions(dimensions);
      forceRender();
    }
  };

  const ar = (dimensions: [number, number] | null): number =>
    dimensions == null ? 16 / 9 : dimensions[0] / dimensions[1];


  switch (children.length) {
    case 1: {
      const child = children[0];
      const aspectRatio = ar(lastDimensions.current[0]);

      // Calculate size of child
      let childWidth: number;
      let childHeight: number;

      if (width > height * aspectRatio) {
        // Child height perfectly matches container, extra space left and right
        childHeight = height;
        childWidth = height * aspectRatio;
      } else {
        // Child width perfectly matches container, extra space top and bottom
        childWidth = width;
        childHeight = (width / aspectRatio);
      }

      return (
        <VideoBoxResizeContext.Provider value={resizeVideoBox}>
          <div ref={ref} css={{ flex: "1 0 0", minHeight, display: "flex" }}>
            <div css={{
              ...!child.autoSize && {
                height: childHeight,
                width: childWidth,
              },
              minWidth: `${minWidth}px`,
              margin: "auto",
            }}>
              { child.body }
            </div>
          </div>
        </VideoBoxResizeContext.Provider>
      );
    }
    case 2: {
      // We need to decide whether the two videos are side by side or if one
      // should be below the other. We calculate the utilized space for each
      // option and then take the option that utilizes more space.
      //
      // Below we need to figure out the aspect ratios of the combined videos
      // either in row or column layout. Consider this table:
      //
      // |             | a      | b      | row    | column |
      // | ----------- | ------ | ------ | ------ | ------ |
      // | aspect      | 16:9   | 4:3    | 28:9   | 16:21  |
      // | normalized  | 1.77:1 | 1.33:1 | 3.11:1 | 0.76:1 |
      //
      // It shows the two aspect ratios a and b combined in both ways. In the
      // "row" case, the combined aspect ratio is simple: just add both children
      // aspect ratios. The column case is more difficult. First we have to
      // normalize both with respect to the width. This results in 1:0.56 and
      // 1:0.75 respectively. We can now add those, resulting in 1:1.31.
      // Finally, we normalize with respect to height again: 0.76:1

      const aspectRatios = lastDimensions.current.map(d => ar(d));

      // Videos side by side (row).
      const { rowWidths, rowHeights } = (() => {
        const availableWidth = width - gap;
        const combinedAspectRatio = aspectRatios[0] + aspectRatios[1];
        if (availableWidth > height * combinedAspectRatio) {
          // Children height perfectly matches container, extra space left and
          // right.
          return {
            rowHeights: Array(2).fill(height),
            rowWidths: aspectRatios.map(ar => height * ar),
          };
        } else {
          // Children width perfectly matches container, extra space top and
          // bottom.
          const baseHeight = availableWidth / combinedAspectRatio;
          return {
            rowHeights: children.map(() => baseHeight),
            rowWidths: aspectRatios.map(ar => baseHeight * ar),
          };
        }
      })();

      // One video below the other (col/column).
      const { colWidths, colHeights } = (() => {
        const availableHeight = height - gap;
        const combinedAspectRatio =
          1 / ((1 / aspectRatios[0]) + (1 / aspectRatios[1]));

        if (width > availableHeight * combinedAspectRatio) {
          // Children height perfectly matches container, extra space left and
          // right.
          const width = availableHeight * combinedAspectRatio;
          return {
            colHeights: children.map((_c, i) => (width / aspectRatios[i])),
            colWidths: Array(2).fill(width),
          };
        } else {
          // Children width perfectly matches container, extra space top and
          // bottom.
          return {
            colHeights: children.map((_c, i) => (width / aspectRatios[i])),
            colWidths: Array(2).fill(width),
          };
        }
      })();

      // Finally, we compare the areas the two layouts would use. The one with
      // the larger area utilized wins.
      const rowArea = rowWidths[0] * rowHeights[0] + rowWidths[1] * rowHeights[1];
      const colArea = colWidths[0] * colHeights[0] + colWidths[1] * colHeights[1];
      let widths: number[];
      let heights: number[];
      let flexDirection: "row" | "column";
      if (rowArea > colArea) {
        flexDirection = "row";
        widths = rowWidths;
        heights = rowHeights;
      } else {
        flexDirection = "column";
        widths = colWidths;
        heights = colHeights;
      }

      return (
        <VideoBoxResizeContext.Provider value={resizeVideoBox}>
          <div
            ref={ref}
            css={{
              flex: "1 0 0",
              display: "flex",
              gap: gap,
              flexDirection,
              justifyContent: "space-between",
              minHeight,
            }}
          >
            <div css={{
              ...!children[0].autoSize && {
                height: heights[0],
                width: widths[0],
              },
              minWidth: `${minWidth}px`,
              margin: "auto",
            }}>
              { children[0].body }
            </div>
            <div css={{
              ...!children[1].autoSize && {
                height: heights[1],
                width: widths[1],
              },
              minWidth: `${minWidth}px`,
              margin: "auto",
            }}>
              { children[1].body }
            </div>
          </div>
        </VideoBoxResizeContext.Provider>
      );
    }
    default:
      return bug("Internal error: too few or too many video streams");
  }
};
