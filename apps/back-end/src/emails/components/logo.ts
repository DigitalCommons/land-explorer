import fs from "fs";
import path from "path";

// PNG rather than SVG, as most email clients (Gmail, Outlook) don't render SVGs.
// Lives in src/emails/static, which the React Email preview server serves at /static.
export const LOGO_CONTENT_ID = "landexplorer-logo";

/** Default logo src for sent emails - points at the inline attachment from logoAttachment() */
export const LOGO_CID_SRC = `cid:${LOGO_CONTENT_ID}`;

/** Logo src for the React Email preview server (`npm run email:dev`) */
export const LOGO_PREVIEW_SRC = "/static/logo.png";


const LOGO_PATH = path.join(__dirname, "../../../src/emails/static/logo.png");

/** 
 * Inline attachment referenced by the layout via cid: so the logo shows without being hosted 
 **/
export const logoAttachment = () => ({
  content: fs.readFileSync(LOGO_PATH).toString("base64"),
  filename: "logo.png",
  type: "image/png",
  disposition: "inline",
  content_id: LOGO_CONTENT_ID,
});
