// Issue #419: the controls Mumcord puts on an embedded YouTube or Twitch player.
//
// "Copy link" goes through the engine to the system clipboard, because a cross-origin player
// page cannot copy. Full screen: only the frames Mumcord grants the permission may ask for it, so
// the player's own button works, and Mumcord's control below the player does the same for
// keyboard users. What the window looks like on a real desktop (KDE, GNOME, Windows, macOS) is the
// manual check of the issue; here the harness checks the state the page reports.
import { browser, expect, $ } from "@wdio/globals";
import { app, bot, testenv } from "../../helpers/index.ts";
import {
  addFirstServer,
  finishWizard,
  joinChannel,
  readClipboard,
  selectChannel,
  waitMessage,
} from "../../helpers/chat-ui.ts";

function card(title: string) {
  return $(
    `//article[contains(@class,'link-card')][.//p[@class='link-card__title' and .='${title}']]`,
  );
}

async function say(html: string): Promise<void> {
  await bot(["say", "--channel", "Lobby", html], { name: "EmbedBot", hold: 1 });
}

/** Whether the page's full screen is on the element the selector names. */
function onScreen(selector: string): Promise<boolean> {
  return browser.execute(
    (sel: string) => document.fullscreenElement === document.querySelector(sel),
    selector,
  );
}

describe("chat: full screen and copy link on an embed (issue #419)", () => {
  before(async () => {
    await testenv.up("v15");
    await app.restart();
    await finishWizard();
    await addFirstServer(testenv.ports.v15);
    await joinChannel("Lobby");
    await selectChannel("Lobby");
  });

  it("copies the canonical video link, without the parameters the player adds", async () => {
    await say('<a href="https://youtu.be/dQw4w9WgXcQ?si=abc">embed me</a>');
    await waitMessage("embed me");
    const preview = card("YouTube video");
    await preview.waitForDisplayed({ timeout: 15_000 });
    await preview.$("button.link-card__copy").click();
    await browser.waitUntil(
      async () =>
        (await readClipboard("text")) === "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      { timeout: 10_000, timeoutMsg: "the card did not put the link on the clipboard" },
    );
  });

  it("lets only the player frame ask for full screen, and shows that player on the screen", async () => {
    await say('<a href="https://www.twitch.tv/mumcordtest">play it</a>');
    await waitMessage("play it");
    const preview = card("Twitch video");
    await preview.waitForDisplayed({ timeout: 15_000 });
    await preview.$("button.link-card__play").click();
    const frame = await $("iframe.link-card__player");
    await frame.waitForExist({ timeout: 15_000 });

    // The permission the embed needs, and nothing more: no popups, no top navigation.
    const allow = await frame.getAttribute("allow");
    expect(allow).toContain("fullscreen");
    expect(await frame.getAttribute("allowfullscreen")).toBe("true");
    const sandbox = await frame.getAttribute("sandbox");
    expect(sandbox).not.toContain("allow-popups");

    await $("button.link-card__fullscreen").click();
    await browser.waitUntil(() => onScreen("iframe.link-card__player"), {
      timeout: 5_000,
      timeoutMsg: "the player did not go full screen",
    });
    // Escape is the player's and the app's way back to the chat.
    await browser.keys("Escape");
    await browser.waitUntil(async () => !(await onScreen("iframe.link-card__player")), {
      timeout: 5_000,
      timeoutMsg: "full screen did not end",
    });
  });
});
