export function sendMail(email, name = "guest", subject, mailContent) {
  new Request("https://api.mailchannels.net/tx/v1/send", {
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
        email: "konsum@example.com",
        name: "Workers - MailChannels integration",
      },
      subject: "Look! No servers",
      content: [
        {
          type: "text/plain",
          mailContent,
        },
      ],
    }),
  });
}
