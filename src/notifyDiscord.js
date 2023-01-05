import Axios from "axios";

const discordApi = Axios.create();
const username = "XSSless";
const avatar_url =
  "https://user-images.githubusercontent.com/29874489/58731472-4f6c8080-83de-11e9-8206-992f4d777fdc.png";

export function notifyOOBCallback(data, webhookUrl) {
  return discordApi
    .post(webhookUrl, {
      username,
      avatar_url,
      embeds: [
        {
          title: "Out-of-Band Callback Alert",
          color: 15258703,
          fields: [
            {
              name: "Path",
              value: `[${data.path}](${data.path})`,
            },
            {
              name: "IP",
              value: `[${data.remoteIP}](https://whois.domaintools.com/${data.remoteIP})`,
            },
          ]
            .concat(
              { name: "Headers", value: "----------------" },
              Object.entries(data.headers).map(([name, value]) => ({
                name,
                value,
              })),
              Object.keys(data.body).length > 0 && {
                name: "Body",
                value: "----------------",
              },
              Object.entries(data.body).map(([name, value]) => ({
                name,
                value,
              }))
            )
            .filter(Boolean),
        },
      ],
    })
    .catch((error) => console.error("ERROR:", error?.response?.data || error));
}
