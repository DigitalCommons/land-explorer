
import axios from "axios";

export const buttonDownClient = axios.create({
  baseURL: "https://api.buttondown.email/v1",
  headers: {
    Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`
  }
});

export async function signUpToMarketing(marketing: boolean, email: string) {
  if (!marketing) {
    return
  }
  try {
    await buttonDownClient.post("/subscribers",
      {
        email: email,
        referrer_url: "https://app.landexplorer.coop/register",
      },        
    )
  } catch(err) {
    // If someone is already subscribed to the newsletter ignore it
    const code = axios.isAxiosError(err) ? err.response?.data?.code : undefined;
    if (code === "email_already_exists") {
      console.log("Buttondown: already subscribed:", email);
    } else {
      // If we get any other buttondown error log it as an error
      //   but continue so the app doesn't crash and restart -
      //   prevously the unhandledRejection handler would kill
      //   the server mid registration
      console.error(
        "Buttondown subscribe failed for",
        email,
        code ?? (err as Error)?.message
      );
    }
  }
}
