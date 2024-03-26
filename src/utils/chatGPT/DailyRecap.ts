export async function dailyRecap() : Promise<boolean>{
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var startTime = yesterday.setHours(0, 0, 0, 0);
  var endTime = yesterday.setHours(23, 59, 59, 999);

  const historyItems = await chrome.history.search({
    text: "",
    startTime: startTime,
    endTime: endTime,
    maxResults: 200,
  });
  const simplifiedItems: any[] = [];

  historyItems.forEach(function (historyItem) {
    const { url, lastVisitTime } = historyItem;

    const simplifiedItem = {
      url: url,
      lastVisitTime: lastVisitTime,
    };

    simplifiedItems.push(simplifiedItem);
  });
  const authKey = (await chrome.storage.local.get("authKey"))?.authKey; // api key
  if (!authKey) {
    await chrome.storage.local.set({
      prevDaySummary: ["Please enter an api key to get the summary", yesterday.toDateString()],
    });
    return false;
  }
  if((await chrome.storage.local.get("lockAPI")).lockAPI) {
    return false;
  }
  await chrome.storage.local.set({lockAPI : true});

  const summary = await prevDaySummary(simplifiedItems, authKey, yesterday);

  if (summary === "") {
    await chrome.storage.local.set({
      prevDaySummary: [
        "An unexpected error occurred while trying to generate a summary",
        yesterday.toDateString(),
      ],
    });
    await chrome.storage.local.set({lockAPI : false});
    return false;
  }

  await chrome.storage.local.set({ prevDaySummary: [summary, yesterday.toDateString()] });
  await chrome.storage.local.set({lockAPI : false});
  return true;
}

async function prevDaySummary(
  history: any[],
  authKey: any,
  date: Date
): Promise<String> {
  try {
    const requestBody = {
      model: "gpt-3.5-turbo-0125",
      messages: [
        {
          role: "user",
          content: `
          ${JSON.stringify(history)}
          This is the browser history in a certain time period. Summarize this into a simple 7-8 sentence summary. The goal of this summary is to help the user realize what they have been browsing and if that is wasteful. This should encourage them to spend less time on wasteful non-productive sites. This is also a summary for the previous day and can say so. It is implicit that this is the browser history so need not be mentioned. This can be funny. This should be in accessible english and speak directly to the user and refer to them as "you"
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
    prevUsage.push({ cost: usage * pricing, summary: date });
    await chrome.storage.local.set({ usage: prevUsage });
    const summary = data.choices[0].message.content;
    return summary;
  } catch (err) {
    console.log(err);
    return "";
  }
}