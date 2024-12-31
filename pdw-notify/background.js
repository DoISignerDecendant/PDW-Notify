console.log("Patriots.win Notifier service worker started");

function debugLog(message) {
  console.log(message); // Always log for now while debugging
  chrome.storage.sync.get(["debug"], (result) => {
    if (result.debug) {
      console.log(message);
    }
  });
}

async function waitForElement(tabId, selector, maxAttempts = 10) {
  debugLog(`Waiting for element: ${selector}`);
  return new Promise((resolve) => {
    let attempts = 0;
    const checkElement = async () => {
      attempts++;
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: (selector) => {
          const elements = document.querySelectorAll(selector);
          console.log(`Found ${elements.length} elements matching selector`);
          return elements.length > 0;
        },
        args: [selector],
      });

      if (results[0].result) {
        debugLog(`Found elements after ${attempts} attempts`);
        resolve(true);
      } else if (attempts < maxAttempts) {
        debugLog(
          `Attempt ${attempts}: No elements found, retrying in 1 second...`
        );
        setTimeout(checkElement, 1000);
      } else {
        debugLog(`Failed to find elements after ${maxAttempts} attempts`);
        resolve(false);
      }
    };
    checkElement();
  });
}

async function createTab() {
  debugLog("Creating background tab to load patriots.win...");
  return new Promise((resolve) => {
    chrome.tabs.create(
      { url: "https://patriots.win/", active: false },
      async (tab) => {
        debugLog(`Tab created with ID: ${tab.id}`);

        const onUpdated = (tabId, changeInfo, tabInfo) => {
          if (tabId === tab.id && changeInfo.status === "complete") {
            debugLog("Page load complete, waiting for content to render...");
            chrome.tabs.onUpdated.removeListener(onUpdated);
            resolve(tab);
          }
        };

        chrome.tabs.onUpdated.addListener(onUpdated);
      }
    );
  });
}

async function fetchPatriotsWin() {
  try {
    debugLog("Starting fetchPatriotsWin process");
    const tab = await createTab();

    // Wait for content to be available
    const elementsFound = await waitForElement(tab.id, "div.post.stickied");
    if (!elementsFound) {
      debugLog("Failed to find stickied posts, aborting");
      chrome.tabs.remove(tab.id);
      return;
    }

    debugLog("Executing script to extract stickied posts...");
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const stickiedElements = document.querySelectorAll("div.post.stickied");
        console.log(
          `Found ${stickiedElements.length} stickied post elements in page`
        );
        console.log("Page HTML:", document.documentElement.innerHTML);

        return Array.from(stickiedElements)
          .map((element) => {
            const linkElement = element.querySelector("a[target]");
            if (!linkElement) {
              console.log("Failed to find link element in:", element.outerHTML);
              return null;
            }

            let title = linkElement.textContent;
            // Replace newlines with spaces
            title = title.replace(/\r?\n|\r/g, " ");
            // Replace consecutive spaces with a single space
            title = title.replace(/\s+/g, " ");
            // Trim leading and trailing whitespace
            title = title.trim();

            return {
              title,
              url: linkElement.href,
            };
          })
          .filter((post) => post !== null);
      },
    });

    debugLog("Script execution complete");
    debugLog("Closing background tab...");
    chrome.tabs.remove(tab.id);

    const stickiedPosts = results[0].result;
    debugLog(`Extracted ${stickiedPosts.length} stickied posts:`);
    debugLog(JSON.stringify(stickiedPosts, null, 2));

    const oldStickiedPosts = await chrome.storage.local.get("stickiedPosts");
    debugLog("Previous stored posts:");
    debugLog(JSON.stringify(oldStickiedPosts.stickiedPosts || [], null, 2));

    const newPosts = stickiedPosts.filter(
      (post) =>
        !oldStickiedPosts.stickiedPosts?.some(
          (oldPost) => oldPost.url === post.url
        )
    );

    debugLog(`Found ${newPosts.length} new posts:`);
    debugLog(JSON.stringify(newPosts, null, 2));

    if (newPosts.length > 0) {
      debugLog("Creating notifications for new posts...");
      for (const post of newPosts) {
        chrome.notifications.create(
          {
            type: "basic",
            iconUrl: "icon.png",
            title: "New Patriots.win Stickied Post!",
            message: post.title,
            buttons: [{ title: "Open Patriots.win" }, { title: "View Post" }],
          },
          (notificationId) => {
            chrome.notifications.onClicked.addListener(
              (clickedNotificationId) => {
                if (clickedNotificationId === notificationId) {
                  chrome.tabs.create({ url: post.url });
                  chrome.notifications.clear(notificationId);
                }
              }
            );

            chrome.notifications.onButtonClicked.addListener(
              (buttonNotificationId, buttonIndex) => {
                if (buttonNotificationId === notificationId) {
                  if (buttonIndex === 0) {
                    // Open Patriots.win
                    chrome.tabs.create({ url: "https://patriots.win/" });
                  } else if (buttonIndex === 1) {
                    // View specific post
                    chrome.tabs.create({ url: post.url });
                  }
                  chrome.notifications.clear(notificationId);
                }
              }
            );
          }
        );
      }
    }

    const postsToStore = [
      ...newPosts,
      ...(oldStickiedPosts.stickiedPosts || []),
    ].slice(0, 10);

    debugLog("Storing updated posts list:");
    debugLog(JSON.stringify(postsToStore, null, 2));
    await chrome.storage.local.set({ stickiedPosts: postsToStore });
    debugLog("Storage update complete");
  } catch (error) {
    console.error("Error in fetchPatriotsWin:", error);
    debugLog("Full error details:");
    debugLog(JSON.stringify(error, null, 2));
  }
}

chrome.runtime.onInstalled.addListener(() => {
  debugLog("Extension installed/updated, creating alarm");
  chrome.storage.sync.get({ scraperInterval: 5 }, (result) => {
    chrome.alarms.create("fetchPatriotsWin", {
      periodInMinutes: result.scraperInterval,
    });
  });

  debugLog("Running initial scrape on install/reload");
  fetchPatriotsWin();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "fetchPatriotsWin") {
    debugLog("Alarm triggered, starting fetch");
    fetchPatriotsWin();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "rescrape") {
    debugLog("Rescrape message received, triggering fetch");
    fetchPatriotsWin();
  }
});

debugLog("Debug logging enabled");
