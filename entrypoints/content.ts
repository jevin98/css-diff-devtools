export default defineContentScript({
  matches: ['*://*/*'],

  registration: 'manifest',

  main() {
    // Receive data transmitted from the tab page being operated
    // And send it to the devTools page for rendering
    browser.runtime.onMessage.addListener((data) => {
      browser.runtime.sendMessage(data)
    })
  },
})
