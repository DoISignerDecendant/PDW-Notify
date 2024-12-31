# PDW Notify: The Patriots.win Notifier (Unofficial)

Hey there! 👋 PDW Notify is an unofficial browser extension that helps you stay up-to-date with the latest important posts on the https://patriots.win/ website. It periodically checks for new posts tagged with the "stickied" class and sends you convenient browser notifications when it finds something new. Never miss a key update again!

## What's so great about it? 🌟

- Works in the background, checking https://patriots.win/ every 5 minutes (you can change this)
- Scans page content to find posts marked as "stickied"
- Keeps track of the 10 most recent stickied posts
- Figures out when there's a new stickied post and lets you know
- Sends browser notifications with a link directly to the new post
- Lets you customize the check frequency to your liking
- Has a handy "Check Now" button to scan on-demand
- Built-in debug logging for us techies 🤓

## Sounds awesome! How do I get it? 🚀

1. Grab the code from this repository
2. Open your browser's extensions page:
   - Brave Browser: `brave://extensions`
   - Other browsers: Check your settings menu for "Extensions"
3. Flip on "Developer mode" (it's in the top right)
4. Hit "Load unpacked" and point it to the `pdw-notify` folder you just downloaded
5. Bam! You should see the extension in your browser now. You're all set! 😎

💡 Works great with:

- Brave Browser
- Other freedom-respecting browsers based on Chromium
- Any browser that supports Chrome-compatible extensions

## So how do I use this thing? 🤔

- Once installed, PDW Notify will start checking https://patriots.win/ every 5 minutes automatically
- Click the extension icon to open its popup where you can:
  - See a countdown to the next scheduled check
  - Force an immediate check with the "Check Now" button
  - Clear out the stored post history with "Clear stored posts"
  - Tweak the check frequency (in minutes) to whatever you like
- When a new stickied post pops up, you'll get a browser notification about it
  - Click the notification and it'll whisk you away to the post
  - Notifications will go away on their own after 10 seconds, or you can click "Dismiss"

## Tweaking it just how you like 🎛️

- Change the check frequency in the extension popup
  - Type in the number of minutes (5 or more) and click "Save"
  - It'll use your new timing from then on
- Turn on debug logging by pasting `chrome.storage.sync.set({debug: true})` into the Chrome developer console
  - This will spit out detailed debug info to the console
  - Set it to `false` when you've had enough of the gritty details

## How's it all work under the hood? ⚙️

- Built on Manifest V3, the latest and greatest from Chrome extensions
- The real magic happens in `background.js`:
  - `fetchPatriotsWin()` runs on a timer to check the site
  - Spins up a hidden tab, waits for the page to load, then runs a script to grab the stickied posts
  - Compares what it found to the stored posts to spot anything new
  - Stashes new posts and shows notifications
- The popup interface lives in `popup.html` and `popup.js`
  - Shows the countdown, lets you force a check, clear history, and set the frequency
- Debug logging is just a wrapper around `console.log` that you can flip on/off with `chrome.storage`

## A few things to keep in mind 📝

- PDW Notify needs a few standard permissions ("tabs", "scripting", "notifications", and "alarms") to do its thing
- It won't check more than once every 5 minutes to play nice with patriots.win
- It only keeps the 10 newest stickied posts around
- Notifications will vanish after 10 seconds
- If you install/update the extension while it's in the middle of a check, you might get some extra notifications
- Built with privacy in mind - no tracking, no data collection, and completely open-source code you can verify yourself
