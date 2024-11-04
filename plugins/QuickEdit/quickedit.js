/** Main UI of the plugin */
class PluginUI {
    constructor(stashGQL, buttonsConfig){
        this.stashGQL = stashGQL
        this.buttonsConfig = buttonsConfig
        this.groupContainers = []

        this.ENABLED = false
        this.UI_TAB = document.createElement("div")
        this.UI_TAB.setAttribute('class', 'nav-item')
        this.UI_TAB.innerHTML = '<a role="tab" data-rb-event-key="scene-quickedit-panel" aria-selected="false" class="nav-link">QuickEdit</a>'

        this.UI_CONTAINER = document.createElement("div")
        this.UI_CONTAINER.setAttribute("role", "tabpanel")
        this.UI_CONTAINER.setAttribute("aria-hidden", "true")
        this.UI_CONTAINER.setAttribute("class", "fade tab-pane")
        this.UI_CONTAINER.innerHTML = UI_CONTAINER_HTML
    }

    generateButtons(){
        const btnsContainer = this.UI_CONTAINER.querySelector("#buttons-container")
        // Cleanup if this is a re-generate
        btnsContainer.innerHTML = ""

        // Generate all buttons based on ButtonsConfig
        const allGroups = this.buttonsConfig.getGroups()
        for (const groupName of allGroups) {
            const groupData = this.buttonsConfig.groups[groupName]

            const groupContainer = document.createElement("div")
            groupContainer.setAttribute("class", "form-group row")
            groupContainer.id = "btnContainer" + groupName

            this.groupContainers.push(groupContainer)
    
            const label = document.createElement("label")
            label.setAttribute("class", "form-label col-form-label col-3 my-auto font-weight-bold text-truncate")
            label.innerText = groupName + ":"
            label.id = "btnLabel" + groupName
            groupContainer.appendChild(label)
    
            const container1 = document.createElement("div")
            container1.setAttribute("class", "col-9 ml-auto")
            
            const container2 = document.createElement("div")

            if(groupData.type != GroupType.Split){
                container2.setAttribute("class", "btn-group")
                container2.setAttribute("role", "group")
            }
            container1.appendChild(container2)

            const groupTags = this.buttonsConfig.getTagsByGroup(groupName)
    
            for (const tag of groupTags) {
                const btn = document.createElement("button")
                btn.setAttribute("class", "btn btn-secondary")
                btn.id = tag.stashId
                btn.title = tag.stashName
                btn.innerText = tag.getDisplayName()
                btn.setAttribute("group-type", groupData.type)
    
                if(groupData.type == GroupType.Split){
                    btn.classList.add("mr-2")
                    btn.classList.add("mb-2")
                }

                if(groupData.type == GroupType.Single){
                    btn.addEventListener("click", (e) => this.switchSingleTag(e))
                }
                else{
                    btn.addEventListener("click", (e) => this.toggleTag(e))
                }
    
                container2.appendChild(btn)
            }
    
            groupContainer.appendChild(container1)
            btnsContainer.appendChild(groupContainer)
        }
    }

    show(){
        // Add tab in tablist
        const tabParent = document.querySelector("div[role='tablist']")
        tabParent.insertBefore(this.UI_TAB,tabParent.lastChild)

        // Add page to be opened when tab is selected
        const containerParent = document.querySelector(".tab-content")
        containerParent.appendChild(this.UI_CONTAINER)

        // Add click listener to all tabs to capture clicks
        const allTabs = document.querySelectorAll("div[role='tablist'] > div[class='nav-item']")
        for (const tab of allTabs) {
            tab.addEventListener("click", () => this.switchTab(tab))
        }

        // When switching scenes through the Video navigation, if the QuickEdit tab was already active, it stays active
        if(this.UI_TAB.querySelector("a").classList.contains("active")){
            this.switchTab(this.UI_TAB)
        }
    }

    hide(){
        this.UI_TAB.remove()
        this.UI_CONTAINER.remove()
        this.stashGQL.sceneData = {}
        this.groupContainers = []
    }

    /** Called when a tab is clicked, either displays the plugin or hides it to allow normal Stash behaviour */
    switchTab(activeTab){
        console.debug("Switch Tab: " , activeTab)
        console.debug("QuickEdit Tab: " , activeTab == this.UI_TAB)
        if(activeTab == this.UI_TAB){
            // disable current active tab
            const allTabs = document.querySelectorAll("div[role='tablist'] > div[class='nav-item'] > a")
            for (const tab of allTabs) {
                if(tab.classList.contains("active")){
                    tab.classList.remove("active")
                }
            }
            const allContainers = document.querySelectorAll(".tab-content > div")
            for (const container of allContainers) {
                if(container.classList.contains("active")){
                    container.classList.remove("show")
                    container.classList.remove("active")
                }
            }
    
            // Show the plugin tab
            this.UI_TAB.lastChild.classList.toggle("active")
    
            this.UI_CONTAINER.classList.add("show")
            this.UI_CONTAINER.classList.add("active")
            console.debug("Showing :" , this.UI_CONTAINER)
    
            this.updateDisplay()
        }
        else{
            // Make sure the plugin is not displayed
            this.UI_TAB.lastChild.classList.remove("active")
    
            this.UI_CONTAINER.classList.remove("show")
            this.UI_CONTAINER.classList.remove("active")
        }
    }

    updateDisplay(){
        if(!this.ENABLED){
            console.debug("Display not enabled")
            return
        }

        this.generateButtons()
        // Set buttons value
        const allButtons = this.UI_CONTAINER.querySelectorAll("#buttons-container button")
        for (const btn of allButtons) {
            if(this.stashGQL.sceneHasTag(btn.id)){
                setButtonActive(btn, true)
            }
            else{
                setButtonActive(btn, false)
            }
        }
        this.updateDisplayGroups()
    
    }

    updateDisplayGroups(addedIds = [], removedIds = []){
        for (const groupContainer of this.groupContainers) {
            const groupName = groupContainer.id.slice(12)
            const tagIds = this.stashGQL.sceneData.tags.map(tag => tag.id)
            const currentGroup =this.buttonsConfig.groups[groupName]
            groupContainer.style.display = currentGroup.maybeDisplayGroup(tagIds) ? "flex" : "none"

            // Due to lag, also force the newly changed tags
            if(addedIds.includes(currentGroup.conditionId)){
                groupContainer.style.display = "flex"
            }
            else if(removedIds.includes(currentGroup.conditionId)){
                groupContainer.style.display = "none"
            }
        }
    }

    toggleTag(event){
        setButtonActive(event.target, !event.target.classList.contains("active"))
    
        // Add or Remove tag in Stash
        if(this.stashGQL.sceneHasTag(event.target.id)){
            this.stashGQL.removeTag(event.target.id)
            this.updateDisplayGroups([],[event.target.id])
        }
        else{
            this.stashGQL.addTag(event.target.id)
            this.updateDisplayGroups([event.target.id], [])
        }
        
    }

    switchSingleTag(event){
        // Only one button+tag can be Active at one time
        const allGroupBtns = event.target.parentElement.querySelectorAll("button")
        let removeTags = []
        for (const btn of allGroupBtns) {
            if(btn == event.target){
                setButtonActive(btn, true)
            }
            else{
                setButtonActive(btn, false)
                removeTags.push(btn.id)
            }
        }
        this.stashGQL.batchUpdateTags([event.target.id], removeTags)
        this.updateDisplayGroups([event.target.id], removeTags)
    }

    clearActiveTab(){
        this.switchTab()
    }
}


PluginApi.Event.addEventListener("stash:location", (e) => {
    quickEditMain(e.detail.data.location.pathname.startsWith("/scenes/"))
})


const btnConfig = new ButtonsConfig()
const stashGQL = new StashGraphQL(window.location.origin + "/graphql")
const pluginUI = new PluginUI(stashGQL, btnConfig)

function refreshUI(){
    btnConfig.saveConfig()
    pluginUI.updateDisplay()
}

const btnConfigUI = new ButtonsConfigUI(stashGQL, btnConfig, refreshUI)

async function quickEditMain(display){
    if(display){
        // Always reset the UI, in case this is a Scene -> Scene page change
        pluginUI.hide()
        btnConfigUI.disable()

        // Give the page a bit of time to load
        await delay(500)

        // Get Scene data in stash
        await stashGQL.getScene(window.location.pathname.split('/').pop())

        pluginUI.ENABLED = true
        pluginUI.show()
        btnConfigUI.enable()
    }
    else{
        pluginUI.ENABLED = false
        pluginUI.hide()
        pluginUI.clearActiveTab()
        btnConfigUI.disable()
    }
}

// Init the plugin
quickEditMain(window.location.pathname.startsWith("/scenes/"))




// Generic helper functions

function delay(milliseconds){
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

function createButton(id = -1, name, classAttr, clickListener){
    const newButton = document.createElement("button")
    newButton.setAttribute("type", "button")
    newButton.setAttribute("class", classAttr)
    newButton.innerHTML = name

    if(id != -1){
        newButton.id = "easyTagButton" + id
    }
    if(typeof clickListener == "function"){
        newButton.addEventListener("click", clickListener)
    }
    return newButton
}

function setButtonActive(button, enabled){
    if(button == null){
        return
    }
    if(enabled){
        button.classList.add("active")
        button.classList.remove("btn-secondary")
        button.classList.add("btn-success")
    }
    else{
        button.classList.remove("active")
        button.classList.add("btn-secondary")
        button.classList.remove("btn-success")
    }
}

function selectSingleButton(event){
    for (const btn of event.target.parentElement.childNodes) {
        if(btn == event.target){
            setButtonActive(btn, true)
        }
        else{
            setButtonActive(btn, false)
        }
    }
}