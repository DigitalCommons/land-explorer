import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const authRoute = "/auth";
let sender = "landexplorer@digitalcommons.coop";
let senderName = "Land Explorer";

export const shareMapRegistered = async (
  recipient: string,
  recipient_firstname: string,
  sharer_firstname: string,
  sharer_lastname: string,
  map_name: string,
  domain: string
) => {
  const loginLink = domain + authRoute;
  const sharer_fullname = sharer_firstname + " " + sharer_lastname;   

  let body = "<!DOCTYPE html><html lang=\"en\" xmlns=\"http://www.w3.org/1999/xhtml\"><head></head><body>'";
  body += "<p>Dear " + capitalizeFirstLetter(recipient_firstname) + ",</p>";
  body += "<p>" + capitalizeFirstLetter(sharer_fullname) + " has given you access to their map: " + map_name + "</p>";
  body += "<p>You can login to Land Explorer by clicking <a href=\"" + loginLink + "\">here</a>.</p>";
  body += "<p>Once logged in, you can then view the map " + capitalizeFirstLetter(sharer_firstname) + " shared with you.</p>";
  body += "<p>Many thanks,<br/><br/>The Digital Commons Team</p>";
  body += "</body></html>";

  const msg = {
    to: recipient,
    from: {
      name: senderName,
      email: sender
    },
    subject: recipient_firstname + `, ${sharer_fullname} has shared a Land Explorer map with you`,
    html: body,
  };

  sgMail.send(msg).catch((error: Error) => {
    console.error(error);
  });
}



export const shareMapUnregistered = async (
  recipient: string,
  sharer_firstname: string,
  sharer_lastname: string,
  map_name: string,
  domain: string
) => {
  const loginLink = domain + authRoute;
  const sharer_fullname = sharer_firstname + " " + sharer_lastname;

  let body = "<!DOCTYPE html><html lang=\"en\" xmlns=\"http://www.w3.org/1999/xhtml\"><head></head><body>'";
  body += "<p>Hi There,</p>";
  body += "<p>" + capitalizeFirstLetter(sharer_fullname) + " has invited you to join Land Explorer and has given you access to their map: " + map_name + "</p>";
  body += "<p>You can register for an account by clicking <a href=\"" + loginLink + "\">here</a>.</p>";
  body += "<p>Once logged in, you can then view the map " + capitalizeFirstLetter(sharer_firstname) + " shared with you.</p>";
  body += "<p>Many thanks,<br/><br/>The Digital Commons Team</p>";
  body += "</body></html>";

  const msg = {
    to: recipient,
    from: {
      name: senderName,
      email: sender
    },
    subject: `${sharer_fullname} has shared a Land Explorer map with you and invited you to register`,
    html: body,
  };

  sgMail.send(msg).catch((error: Error) => {
    console.error(error);
  });
}

function capitalizeFirstLetter(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
