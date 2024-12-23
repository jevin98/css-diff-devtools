import type { SelectedElType } from './types'

interface _Window extends chrome.windows.Window {
  tabs: Array<chrome.tabs.Tab>
}

class SendMessage {
  private currentTabId: number | undefined
  constructor() {
    this.init()
  }

  private async init() {
    const [currentTab] = await browser.tabs.query({ active: true })

    this.currentTabId = currentTab.id!
  }

  public async send(data: Array<SelectedElType>) {
    const windows = await browser.windows.getAll({ populate: true });

    (windows as unknown as Array<_Window>).forEach((window) => {
      for (const tab of window.tabs) {
        if (tab.id !== this.currentTabId) {
          // Send selected data to other windows/tabs
          browser.tabs.sendMessage(
            tab.id!,
            data,
          )
        }
      }
    })
  }
}

const SM = new SendMessage()

export default SM
