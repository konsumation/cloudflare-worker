export async function sendMail(email, subject, mailContent, name = "guest") {
  return await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email, name }],
        },
      ],
      from: {
        email: "info@ramid.de",
        name: "Workers - MailChannels integration",
      },
      subject,
      content: [
        {
          type: "text/html",
          value: mailContent,
        },
      ],
    }),
  });
}
