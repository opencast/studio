import React from "react";

import { DEFINES } from "./defines";
import { COLORS } from "./util";
import { OverlayBox } from "./layout";


type Props = {
  close: () => void;
};

export const About: React.FC<Props> = ({ close }) => (
  <OverlayBox maxWidth={800} close={close} title="Opencast Studio">
    <article css={{
      p: {
        margin: "8px 0",
      },
      h2: {
        marginTop: 24,
        marginBottom: 4,
        fontSize: 21,
      },
      a: {
        color: COLORS.accent7,
        "&:hover": {
          textDecoration: "none",
          color: COLORS.accent8,
        },
      },
    }}>
      <p>
        A web-based recording studio for <a href="https://opencast.org">Opencast</a>.
      </p>
      <p>
        Opencast Studio allows you to record your camera, your display and your microphoneʼs audio.
        You can then either download your recordings or upload them directly to an Opencast
        instance (usually the one of your university).
      </p>
      <p>
        This is free software under the terms of the{" "}
        <a href="https://github.com/opencast/studio/blob/main/LICENSE">
          MIT License
        </a>{" "}
        developed by <a href="https://elan-ev.de">elan e.V.</a> in cooperation
        with the <a href="https://ethz.ch">ETH Zürich</a>.
      </p>

      <h2>How it works</h2>
      <p>
        Opencast Studio uses the recording capabilities built into modern browsers to record
        audio and video streams. The recording happens in the userʼs browser and no server is
        involved in the recording.
      </p>

      <h2>Support</h2>
      <p>
        If you are experiencing any difficulties or found any bugs,
        please take a look at the{" "}
        <a href="https://github.com/opencast/studio/issues">
          issue tracker on GitHub
        </a>.
        Before filing a new issue, please check if one about your topic already exists.
        We regularly check incoming issues and do our best to address bugs in a timely manner.
      </p>

      <h2>Credits</h2>
      <p>
        Thanks to the following people and institutions for contributing to this project:
      </p>
      <ul>
        <li>
          <a href="https://github.com/slampunk">Duncan Smith</a> for starting this
          project
        </li>
        <li>
          <a href="https://github.com/cilt-uct">University of Cape Town (CILT)</a>
          {" "}for letting Duncan start the project
        </li>
        <li>
          <a href="https://ethz.ch">ETH Zürich</a> for financial support and
          testing
        </li>
        <li>
          <a href="https://github.com/elan-ev">elan e.V.</a> for the re-implementation
          and the ongoing development
        </li>
        <li>
          And many members from the Opencast community who helped along the way.
        </li>
      </ul>

      <h2>Version</h2>
      <p>
        Build date {DEFINES.buildDate ?? "?"},
        commit{" "}
        <a
          aria-label="Git commit on GitHub"
          href={"https://github.com/opencast/studio/commit/" + DEFINES.commitSha}
        >
          {DEFINES.commitSha ?? "?"}
        </a>.
      </p>
    </article>
  </OverlayBox>
);
