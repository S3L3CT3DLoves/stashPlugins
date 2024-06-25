const pagePattern = new URLPattern({ pathname: '/scenes/*' });

let cleanupUISettings = {
  queue: false,
  markers: false,
  filters: false,
  file_info: false,
  history: false
}
const tabsTextMap = {
  "queue" : 'queue',
  "markers" : "markers",
  "filters" : "filters",
  "file info" : "file_info",
  "history" : "history"
}

function cleanupUI(){
  const tabList = Array.from(document.querySelectorAll("div[role='tablist'] > .nav-item"))
  console.log(tabList)
  tabList.forEach((tab) => {
    let tabText = tab.textContent.toLocaleLowerCase()
    if (tabText in tabsTextMap && tabsTextMap[tabText] != "") {
      // The tab can be managed
      if (cleanupUISettings[tabText]){
        tab.style.display = 'none'
      }
      else{
        tab.style.display = ''
      }
      
    }
  }) 

}


/** Called when page changes to verify if the plugin must be displayed */
async function updateDisplay(){
    console.log("Page Change");
    // DO STUFF HERE
    let active = pagePattern.test(window.location.href)
    if(active){
      console.log("Cleaning UI")
      await delay(500)
      cleanupUI()
    }
    else{

    }
}

async function updateSettings(){
  let config = await csLib.getConfiguration('cleanupUI',cleanupUISettings)
  cleanupUISettings = {...cleanupUISettings, ...config}
}

/** Detects page changes */
const observePageChange = () => {
    let oldHref = document.location.href;
    const body = document.querySelector("body");
    const observer = new MutationObserver(mutations => {
      if (oldHref !== document.location.href) {
        oldHref = document.location.href;
        updateDisplay()
      }
    });
    observer.observe(body, { childList: true, subtree: true });
  };

// Init the plugin & page change listener
updateSettings()
updateDisplay()
observePageChange()

// Generic helper functions

function delay(milliseconds){
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}