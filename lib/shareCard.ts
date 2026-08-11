// Client-only: composes a shareable PNG (comic + caption overlaid) via
// canvas. Deliberately never includes just a bare link to the live app
// without the image — the point of sharing IS the image + caption.
//
// Anyone can share any visible caption, not just their own — so the card
// shows who wrote it (username + city), and a "You" pill next to the name
// when the sharer is that caption's actual author. No pill means it isn't
// theirs; that's the whole point of showing it.
//
// Visually it's built to read as unmistakably "Punchline" even out of
// context on a feed: rounded corners (matching every card in the app), a
// brand-gradient frame and divider using the exact four accent colors, and
// the same rainbow wordmark used in-app.

export type ShareCardInput = {
  imageUrl: string;
  text: string;
  username: string;
  city?: string | null;
  isYou?: boolean;
  date: string;
};

const CARD_WIDTH = 1080;
const PAD = 56;
const CORNER_RADIUS = 48;
const FRAME_WIDTH = 10;
const DIVIDER_HEIGHT = 8;
const CAPTION_FONT = "italic 500 44px Georgia, serif";
const CAPTION_LINE_HEIGHT = 57;
const META_FONT = "500 33px Menlo, monospace";
const PILL_FONT = "700 24px Menlo, monospace";
// Same weight/tracking/color as the "DAILY CAPTION CONTEST" eyebrow in the
// site header (font-mono text-[11px] tracking-[0.2em] uppercase text-blue-dark).
const TAGLINE_FONT = "500 22px Menlo, monospace";
const TAGLINE_LETTER_SPACING = "4px";
const TAGLINE_COLOR = "#3868AC";
// Same mono font as the tagline, one size down and muted — matches the
// on-site date treatment (font-mono text-[11px] text-ink-faint).
const DATE_FONT = "500 20px Menlo, monospace";
const DATE_COLOR = "#B7AFA9";
const BRAND_FONT = "700 36px Georgia, serif";
// Same four brand accents as the in-app wordmark (components/PunchlineLogo)
// and the color-reveal sheen (ComicCard) — starting on red, kept in sync
// here since canvas can't share a component or a Tailwind class with the DOM.
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

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function brandGradient(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  gradient.addColorStop(0, LOGO_COLORS[3]); // blue
  gradient.addColorStop(0.33, LOGO_COLORS[1]); // forest
  gradient.addColorStop(0.66, LOGO_COLORS[2]); // gold
  gradient.addColorStop(1, LOGO_COLORS[0]); // coral
  return gradient;
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

  // Superscript "BETA" — same mono font/color as the on-site date, so it
  // reads as a badge on the wordmark rather than part of it.
  ctx.font = "500 16px Menlo, monospace";
  ctx.fillStyle = "#B7AFA9";
  ctx.fillText("BETA", x + 6, y - 14);

  ctx.textAlign = "center";
}

// "— username, city" plus, if isYou, a blue "You" pill right after the
// name — the only way a viewer can tell this is the sharer's own caption
// versus one they just liked enough to pass along.
function drawAttribution(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  username: string,
  city: string | null | undefined,
  isYou: boolean
) {
  const label = `— ${username}${city ? `, ${city}` : ""}`;
  ctx.font = META_FONT;
  const labelWidth = ctx.measureText(label).width;

  ctx.font = PILL_FONT;
  const pillPadX = 18;
  const pillGap = 14;
  const pillH = 44;
  const pillLabelWidth = ctx.measureText("You").width;
  const pillW = isYou ? pillLabelWidth + pillPadX * 2 : 0;

  const totalWidth = labelWidth + (isYou ? pillGap + pillW : 0);
  let x = centerX - totalWidth / 2;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = META_FONT;
  ctx.fillStyle = "#8A817C";
  ctx.fillText(label, x, y);
  x += labelWidth;

  if (isYou) {
    x += pillGap;
    const pillY = y - pillH * 0.72;
    roundRectPath(ctx, x, pillY, pillW, pillH, pillH / 2);
    ctx.fillStyle = "#4A80D6";
    ctx.fill();
    ctx.font = PILL_FONT;
    ctx.fillStyle = "#FFFFFF";
    ctx.textBaseline = "middle";
    ctx.fillText("You", x + pillPadX, pillY + pillH / 2 + 1);
    ctx.textBaseline = "alphabetic";
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
    DIVIDER_HEIGHT + // brand-gradient divider under the comic
    PAD + // top padding
    captionLines.length * CAPTION_LINE_HEIGHT + // caption
    16 + // gap
    52 + // attribution row
    150 + // gap — pushes the brand block down into its own footer band
    50 + // Punchline wordmark
    36 + // gap
    28 + // tagline row
    28 + // gap
    30; // tight bottom margin — date rests right above the card's edge

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = imgHeight + footerHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Clip the whole card to rounded corners — every card in the app is
  // rounded, a shared PNG with square corners would read as off-brand.
  roundRectPath(ctx, 0, 0, canvas.width, canvas.height, CORNER_RADIUS);
  ctx.save();
  ctx.clip();

  ctx.fillStyle = "#F2EDE7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, CARD_WIDTH, imgHeight);

  // Brand-gradient divider — the same four-color recipe as the color-reveal
  // sheen, so the two moments (revealing, then sharing) visually rhyme.
  ctx.fillStyle = brandGradient(ctx, 0, 0, CARD_WIDTH, 0);
  ctx.fillRect(0, imgHeight, CARD_WIDTH, DIVIDER_HEIGHT);

  ctx.textAlign = "center";
  let y = imgHeight + DIVIDER_HEIGHT + PAD + 34;

  // A large, faint decorative quote mark behind the caption — an echo of
  // the quotes every caption already sits in throughout the app.
  ctx.font = "italic 900 220px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(74, 128, 214, 0.10)";
  ctx.fillText("“", PAD - 24, y + 28);
  ctx.textAlign = "center";

  ctx.font = CAPTION_FONT;
  ctx.fillStyle = "#3A3632";
  for (const line of captionLines) {
    ctx.fillText(line, CARD_WIDTH / 2, y);
    y += CAPTION_LINE_HEIGHT;
  }

  y += 16;
  drawAttribution(ctx, CARD_WIDTH / 2, y, input.username, input.city, Boolean(input.isYou));

  y += 150;
  drawLogo(ctx, CARD_WIDTH / 2, y);

  y += 36;
  ctx.font = TAGLINE_FONT;
  ctx.fillStyle = TAGLINE_COLOR;
  ctx.letterSpacing = TAGLINE_LETTER_SPACING;
  ctx.fillText("DAILY CAPTION CONTEST", CARD_WIDTH / 2, y);
  ctx.letterSpacing = "0px";

  y += 28;
  ctx.font = DATE_FONT;
  ctx.fillStyle = DATE_COLOR;
  ctx.fillText(input.date, CARD_WIDTH / 2, y);

  ctx.restore(); // drop the rounded-rect clip before framing

  // A brand-gradient frame around the whole card, echoing the colored
  // ring/border treatment used on cards throughout the app (e.g. the gold
  // ring around the #1 leaderboard card).
  ctx.lineWidth = FRAME_WIDTH;
  ctx.strokeStyle = brandGradient(ctx, 0, 0, canvas.width, canvas.height);
  roundRectPath(
    ctx,
    FRAME_WIDTH / 2,
    FRAME_WIDTH / 2,
    canvas.width - FRAME_WIDTH,
    canvas.height - FRAME_WIDTH,
    CORNER_RADIUS
  );
  ctx.stroke();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Failed to render share card"))), "image/png");
  });
}
