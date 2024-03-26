import { updateWebsitesInStorage } from "../queryStorage/UpdateWebsitesInStorage";

interface Website {
  id: string;
  website: string;
  tag: number;
}

interface TaggedWebsite {
  URL: string;
  CLASSIFICATION: string;
}

function pushToArray(
  classification: string,
  taggedWebsites: Website[],
  website: string
) {
  let tag = 0;
  if (classification === "productive") {
    tag = 1;
  } else if (classification === "unsure") {
    tag = 2;
  } else if (classification === "wasteful") {
    tag = 3;
  }
  taggedWebsites.push({ id: website, website, tag });
}

async function apiCall(website: string, authKey: any) {
  try {
    const requestBody = {
      model: "gpt-3.5-turbo-0125",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `Imagine you're a digital detective tasked with classifying websites as either 'wasteful,' 'productive,' or 'unsure.' You're given a website URL, and you must determine its classification based on whether it helps with work, is used to kill time, or is ambiguous in its purpose. For the purpose of this task, 'work' is defined as any activity that contributes to one's professional or educational goals, such as research, learning, collaboration, or productivity tools. Your output should be a JSON object containing the classification, the URL. For example, if the website is Netflix.com and the description is your response might be: {'CLASSIFICATION': 'Wasteful', 'URL': 'netflix.com'}. Now, classify ${website}
      `,
        },
      ],
    };
    const timeoutPromise = new Promise<Response>((resolve, reject) => {
      setTimeout(() => {
        const timeoutError = new Error("API call timeout");
        const timeoutResponse = new Response(
          JSON.stringify({ error: timeoutError }),
          {
            status: 408,
            statusText: "Request Timeout",
            headers: { "Content-Type": "application/json" },
          }
        );
        reject(timeoutResponse);
      }, 30000);
    });
    const fetchPromise = fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authKey}`,
      },
      body: JSON.stringify(requestBody),
    });
    const res: Response = await Promise.race([fetchPromise, timeoutPromise]);
    if (!res.ok) {
      throw new Error("API request failed");
    }
    const data = await res.json();
    const usage = data.usage.total_tokens;
    const pricing = 1.5 / 1000000;
    const prevUsage = (await chrome.storage.local.get("usage"))?.usage || [];
    prevUsage.push({ cost: usage * pricing, website: website });
    await chrome.storage.local.set({ usage: prevUsage });
    const classifiedWebsites = data.choices[0].message.content;
    const classifiedWebsitesObject = JSON.parse(classifiedWebsites);
    await chrome.storage.local.set({ lastApiCall: new Date().getTime() });
    return classifiedWebsitesObject;
  } catch (err) {
    console.log(err);
    await chrome.storage.local.set({ lastApiCall: new Date().getTime() }); // don't let any api call for next 2.5 min
    return { website: website, CLASSIFICATION: "untagged" };
  }
}

export async function AITagging() {
  try {
    const authKey = (await chrome.storage.local.get("authKey"))?.authKey; // api key
    const websiteList: string[] = (
      await chrome.storage.local.get("visitedURLs")
    )?.visitedURLs; // untagged urls
    if (!websiteList || websiteList.length === 0) {
      return;
    }

    const preTaggedUrls: TaggedWebsite[] =
      (await chrome.storage.local.get("preTaggedUrls"))?.preTaggedUrls || []; // list of pre tagged urls

    const taggedWebsites: Website[] = [];

    const website: string = websiteList[0]; // get the first untagged website

    let classification = "untagged";

    const obj: TaggedWebsite | undefined = preTaggedUrls.find(
      (obj) => obj.URL === website
    ); // find the current url in pre-tagged list

    if (obj) {
      // if found, push it to our list
      classification = obj.CLASSIFICATION.toLowerCase();
      pushToArray(classification, taggedWebsites, website);
    } else if (authKey) {
      // if api key is stored, try tagging it using chat gpt
      const lastApiCall =
        (await chrome.storage.local.get("lastApiCall"))?.lastApiCall ||
        new Date(0).getTime();
      const currentTime = new Date().getTime();
      if (currentTime - lastApiCall < 30000) {
        // if last api call was less than 2 minutes ago, skip to prevent rate limit
        return;
      }
      const tagged: TaggedWebsite = await apiCall(website, authKey); // tag the website
      classification = tagged.CLASSIFICATION?.toLowerCase();
      pushToArray(classification, taggedWebsites, website);
    }
    updateWebsitesInStorage(taggedWebsites); // update the website in storage
  } catch (e) {
    console.error(e);
  }
}
