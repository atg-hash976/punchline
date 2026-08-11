// Client-only: composes a shareable PNG (comic + caption overlaid) via
// canvas. Deliberately never includes just a bare link to the live app
// without the image — the point of sharing IS the image + caption.
//
// No name/city/timing on the card by design: whoever posts it is already
// putting their own name behind it by sharing it, so printing it again is
// redundant — same for how fast they wrote it.

export type ShareCardInput = {
  imageUrl: string;
  text: string;
};

const CARD_WIDTH = 1080;
const PAD = 56;
const CAPTION_FONT = "italic 500 40px Georgia, serif";
const CAPTION_LINE_HEIGHT = 52;
const BRAND_FONT = "700 30px Georgia, serif";
// Same four brand accents as the in-app wordmark (components/PunchlineLogo),
// starting on red — kept in sync here since canvas text can't share a
// component with the DOM.
const LOGO_COLORS = ["#C45B4A", "#4A7C59", "#C99A3B", "#4A80D6"];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load comic image"));
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawLogo(ctx: CanvasRenderingContext2D, centerX: number, y: number) {
  const text = "Punchline";
  ctx.font = BRAND_FONT;
  ctx.textAlign = "left";
  let x = centerX - ctx.measureText(text).width / 2;
  for (let i = 0; i < text.length; i++) {
    ctx.fillStyle = LOGO_COLORS[i % LOGO_COLORS.length];
    ctx.fillText(text[i], x, y);
    x += ctx.measureText(text[i]).width;
  }
  ctx.textAlign = "center";
}

export async function generateShareCard(input: ShareCardInput): Promise<Blob> {
  const img = await loadImage(input.imageUrl);
  const imgHeight = Math.round((img.naturalHeight / img.naturalWidth) * CARD_WIDTH);

  const scratch = document.createElement("canvas").getContext("2d");
  if (!scratch) throw new Error("Canvas not supported");
  scratch.font = CAPTION_FONT;
  const captionLines = wrapText(scratch, `“${input.text}”`, CARD_WIDTH - PAD * 2);

  const footerHeight =
    PAD + // top padding
    captionLines.length * CAPTION_LINE_HEIGHT + // caption
    40 + // gap
    56 + // brand row
    PAD; // bottom padding

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = imgHeight + footerHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.fillStyle = "#F2EDE7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, CARD_WIDTH, imgHeight);

  ctx.textAlign = "center";
  let y = imgHeight + PAD + 34;

  ctx.font = CAPTION_FONT;
  ctx.fillStyle = "#3A3632";
  for (const line of captionLines) {
    ctx.fillText(line, CARD_WIDTH / 2, y);
    y += CAPTION_LINE_HEIGHT;
  }

  drawLogo(ctx, CARD_WIDTH / 2, canvas.height - PAD + 20);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Failed to render share card"))), "image/png");
  });
}
