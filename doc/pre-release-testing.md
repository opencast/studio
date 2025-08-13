# QA testing guidelines

(*This document is intended for developers, not for users*)

This document describes a rough guideline on how to test the application before merging `main` into `production`.
This is mainly to make testing easier and faster, as the tester does not have to remember everything.

### Browsers and Systems

Everything should be tested on all officially supported systems and browser:

- Edge (Windows 10)
- Firefox (any OS, but should be tested on Windows 10 from time to time)
- Chrome (any OS, but should be tested on Windows 10 from time to time)
- Firefox (Android)
- Chrome (Android)
- Safari (iOS)


### Testing Steps

#### UI

- **Logo and "Opencast Studio"** are visible?
- Make sure **only supported sources** are shown:
    - Mobile: only "Share webcam", not "Share desktop"
    - Desktop: should show both, "webcam" and "desktop"
- Make sure there are **no scrollbars** anywhere.
- Does page **"About"** exist and is easily reachable?
- Check **"Configure" dialog**:
    - Does it open?
    - Are all fields readable and editable?
    - Can it be submitted?

#### Recording

- Click "Share Webcam"
- On desktop, also click "Share desktop"
- Make sure the live-video is shown in the preview **uncropped** and with the **correct aspect ratio**.
- Make sure the recording **button turned red**
- Make sure all **links are disabled** (TODO: this still needs to be implemented)
- Pause and then resume
- Stop the recording
- Make sure the "production details" dialog pops up
- Check fields "Title" and "Presenter"
- Is the **media preview working**?
- Check buttons "Upload to Opencast", "Save Media" and "Discard"
    - Do they have useful colors (i.e. red for "discard")?
- Click "Upload to Opencast"
    - Make sure that the video was correctly uploaded to Opencast
- Repeat the recording
- Click "Save Media" and make sure the video is correct
