/**
 * iStonk design system primitives.
 *
 * Ported 1:1 from the design system bundle. The shape hierarchy is meaning:
 * pills for conversation, squircles for objects you hold, tape for data.
 * One tangerine element per view, and it should be the thing that opens
 * Messages.
 */

export { Avatar, Badge, Button, Chip } from "./core";
export type { BadgeState, ButtonProps } from "./core";

export { ETH_LOGO_URL, TokenLogo, USDC_LOGO_URL } from "./token-logo";

export { Input, OtpField } from "./forms";

export { ClaimRow, DataRow, Figure, Receipt, TickerTape } from "./data";
export type { ReceiptRow, TapeItem } from "./data";

export { Bubble, LinkPreview, Tapback, ThreadHeader } from "./messaging";

export { Eyebrow, Panel, PanelHead, SectionHead, Toast } from "./chrome";

export {
  ExternalIcon,
  MASCOT_AVATAR_SRC,
  MASCOT_SRC,
  Mascot,
  MsgGlyph,
  OG_SRC,
  Wordmark,
} from "./brand";
