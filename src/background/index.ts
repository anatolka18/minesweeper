chrome.action.onClicked.addListener(async () => {
  const popupPath = import.meta.env.DEV ? 'src/popup/index.html' : 'popup.html';
  const popupUrl = chrome.runtime.getURL(popupPath);

  await chrome.windows.create({
    url: popupUrl,
    type: 'popup',
    width: 850,
    height: 700,
    focused: true,
  });
});