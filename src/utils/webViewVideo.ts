export const VIDEO_SIZE_SCRIPT = `
(function () {
  var video = document.querySelector("video");
  if (!video) return;

  function sendSize() {
    var width = video.videoWidth;
    var height = video.videoHeight;
    if (!width || !height) return;
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: "size", width: width, height: height })
    );
  }

  video.addEventListener("loadedmetadata", sendSize);
  video.addEventListener("loadeddata", sendSize);
})();
true;
`;

interface BuildVideoHtmlOptions {
  posterUrl?: string | null;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export function buildVideoHtml(
  mediaUrl: string,
  {
    posterUrl,
    autoplay = false,
    loop = false,
    muted = false,
    controls = false,
  }: BuildVideoHtmlOptions = {},
) {
  const poster = posterUrl ? ` poster="${posterUrl}"` : "";
  const attrs = [
    autoplay && "autoplay",
    loop && "loop",
    muted && "muted",
    controls && "controls",
    "playsinline",
  ]
    .filter(Boolean)
    .join(" ");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        overflow: hidden;
      }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      video {
        display: block;
        max-width: 100%;
        max-height: 100%;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border: 0;
        outline: none;
        border-radius: 8px;
        background: transparent;
      }
    </style>
  </head>
  <body>
    <video src="${mediaUrl}"${poster} ${attrs}></video>
  </body>
</html>`;
}
