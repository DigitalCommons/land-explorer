import fs from "fs";
import path from "path";
import { LOGO_CONTENT_ID } from "./components/logo";

const LOGO_PATH = path.join(__dirname, "../../src/emails/static/logo.png");

// Read once at load so a missing logo crashes the server loudly at startup, rather
// than failing every send inside email.ts's catch where nobody sees it
const logoContent = fs.readFileSync(LOGO_PATH).toString("base64");

/**
 * Inline attachment referenced by the layout via cid: so the logo shows without being hosted
 **/
export const logoAttachment = () => ({
  content: logoContent,
  filename: "logo.png",
  type: "image/png",
  disposition: "inline",
  content_id: LOGO_CONTENT_ID,
});
