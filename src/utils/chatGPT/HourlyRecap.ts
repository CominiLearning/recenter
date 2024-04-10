import { TaggedTimeURL } from "../../types/TaggedTimeUrl";
import { WebsiteTime } from "../../types/WebsiteTime";
import { baseUrl, model } from "../CONSTANTS/ChatGPT";
import { API_CALL_FAILED_SUMMARY, NO_API_KEY_SUMMARY, SUMMARY_TIME_TOO_SHORT } from "../CONSTANTS/texts";
import { msToHM } from "../scripts/mmToHM";
import { estimatedCost } from "./EstimatedCost";


interface OrganizedHistory {
  [key: string]: { Explored: string[]; totalTime: string };
}

async function organizeHistoryByBaseUrl(
  history: chrome.history.HistoryItem[]
): Promise<OrganizedHistory> {
  const organizedHistory: OrganizedHistory = {};
  const times : WebsiteTime[] = (await chrome.storage.local.get("yesterdayTime")).yesterdayTime || [];
  history.forEach((entry) => {
    const url = entry.url;
    const baseUrl = new URL(url!).origin;

    if (!organizedHistory[baseUrl]) {
      const time = times.find((x : WebsiteTime) => x.url === baseUrl)?.time || 0;
      organizedHistory[baseUrl] = { Explored: [], totalTime: msToHM(time) };
    }
    if (!organizedHistory[baseUrl]["Explored"].includes(entry.title!))
      organizedHistory[baseUrl]["Explored"].push(entry.title!);
  });

  return organizedHistory;
}

export async function hourlyRecap(
  hourlyTime: TaggedTimeURL[] | undefined
): Promise<boolean> {
  var today = new Date().getTime();
  var hourAgo = today - 1000 * 60 * 60;
  if (!hourlyTime) {
    await chrome.storage.local.set({
      prevHourSummary: [
        SUMMARY_TIME_TOO_SHORT,
        today,
        0,
        0,
      ],
    });
    return false;
  }

  const timeSpent = hourlyTime.reduce((acc, website) => acc + website.time, 0);

  const productiveTime = hourlyTime.reduce((acc, website) => {
    if (website.tag === 1) {
      return acc + website.time;
    } else {
      return acc;
    }
  }, 0);

  const unfocusedTime = timeSpent - productiveTime;

  if (timeSpent <= 15 * 60 * 1000) {
    // if time spent less than 15 min
    await chrome.storage.local.set({
      prevHourSummary: [
        SUMMARY_TIME_TOO_SHORT,
        today,
        productiveTime,
        unfocusedTime,
      ],
    });
    return false;
  }

  const historyItems = await chrome.history.search({
    text: "",
    startTime: hourAgo,
    endTime: today,
    maxResults: 1000,
  });

  const organizedHistory = await organizeHistoryByBaseUrl(historyItems);

  const authKey = (await chrome.storage.local.get("authKey"))?.authKey; // api key
  if (!authKey) {
    await chrome.storage.local.set({
      prevHourSummary: [
        NO_API_KEY_SUMMARY,
        today,
        productiveTime, unfocusedTime
      ],
    });
    return false;
  }
  const lastCalled = (await chrome.storage.local.get("summaryLock")).summaryLock;
  if (new Date().getTime() - lastCalled <= 30 * 1000) {
    return false;
  }
  await chrome.storage.local.set({ summaryLock: new Date().getTime() });

  const summary = await prevHourSummary(organizedHistory, authKey, today);

  if (summary === "") {
    await chrome.storage.local.set({
      prevHourSummary: [
        API_CALL_FAILED_SUMMARY,
        today,
        productiveTime,
        unfocusedTime
      ],
    });
    return false;
  }

  await chrome.storage.local.set({ prevHourSummary: [summary, today, productiveTime, unfocusedTime] });
  return true;
}

async function prevHourSummary(
  history: OrganizedHistory,
  authKey: any,
  date: number
): Promise<String> {
  try {
    const requestBody = {
      model: model,
      messages: [
        {
          role: "user",
          content: `
            ${JSON.stringify(history)}
            This is the browser history in a certain time period. Summarize this into a simple 4 or 5 sentence summary. The goal of this summary is to help the user realize what they have been browsing and if that is wasteful. This should encourage them to spend less time on wasteful non-productive sites. This is also a summary for one hour and can say so. It is implicit that this is the browser history so need not be mentioned. This can be funny. This should be in accessible english and speak directly to the user and refer to them as "you"
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
    const fetchPromise = fetch(`${baseUrl}/chat/completions`, {
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
    const inputTokens = data.usage.prompt_tokens;
    const outputTokens = data.usage.completion_tokens;
    await estimatedCost(inputTokens, outputTokens, `hourlyRecap ${date}`);
    const summary = data.choices[0].message.content;
    return summary;
  } catch (err) {
    return (err as Error).message;
  }
}
