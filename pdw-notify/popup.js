document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get({ scraperInterval: 5 }, (result) => {
    document.getElementById("scraper-interval").value = result.scraperInterval;
  });

  updateCountdown();
  setInterval(updateCountdown, 1000);
});

function showNotification(message) {
  const container = document.getElementById("notification-container");
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  container.appendChild(notification);

  // Remove notification after 10 seconds with animation
  setTimeout(() => {
    notification.classList.add("hiding");
    setTimeout(() => {
      container.removeChild(notification);
    }, 300); // Wait for animation to complete
  }, 10000);
}

function updateCountdown() {
  chrome.alarms.get("fetchPatriotsWin", (alarm) => {
    const countdownElement = document.getElementById("countdown-timer");
    if (!alarm) {
      countdownElement.textContent = "Unknown";
      return;
    }

    const now = Date.now();
    const timeUntilAlarm = alarm.scheduledTime - now;

    if (timeUntilAlarm <= 0) {
      countdownElement.textContent = "Any moment now...";
      return;
    }

    const minutes = Math.floor(timeUntilAlarm / 60000);
    const seconds = Math.floor((timeUntilAlarm % 60000) / 1000);

    if (minutes > 0) {
      countdownElement.textContent = `${minutes}m ${seconds}s`;
    } else {
      countdownElement.textContent = `${seconds}s`;
    }
  });
}

document.getElementById("settings-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const scraperInterval = parseInt(
    document.getElementById("scraper-interval").value
  );

  if (scraperInterval < 5) {
    showNotification("Scraper interval cannot be less than 5 minutes.");
    return;
  }

  chrome.storage.sync.set({ scraperInterval }, () => {
    chrome.alarms.create("fetchPatriotsWin", {
      periodInMinutes: scraperInterval,
    });
    showNotification("Settings saved!");
  });
});

document.getElementById("clear-posts").addEventListener("click", () => {
  chrome.storage.local.remove("stickiedPosts", () => {
    chrome.runtime.sendMessage({ action: "rescrape" });
    showNotification("Stored posts cleared. Rescraping...");
  });
});
