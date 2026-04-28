let gameWindowId: number | null = null;

chrome.action.onClicked.addListener(async () => {
  if (gameWindowId !== null) {
    try {
      const existingWindow = await chrome.windows.get(gameWindowId);
      if (existingWindow) {
        await chrome.windows.update(gameWindowId, { focused: true });
        return;
      }
    } catch {
    }
  }

  const popupUrl = chrome.runtime.getURL('src/popup/index.html');

  const newWindow = await chrome.windows.create({
    url: popupUrl,
    type: 'popup',
    width: 600,
    height: 550,
    focused: true,
  });

  gameWindowId = newWindow.id!;

  chrome.windows.onRemoved.addListener((closedWindowId) => {
    if (closedWindowId === gameWindowId) {
      gameWindowId = null;
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'resizeGameWindow') {
    if (gameWindowId && message.windowId === gameWindowId) {
      chrome.windows.update(gameWindowId, {
        width: message.width,   
        height: message.height + 24, 
      });
    }
    sendResponse({ success: true });
  }
  return false;
});