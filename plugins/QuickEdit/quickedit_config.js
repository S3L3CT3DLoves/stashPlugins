/** ButtonsConfig maintains the state of Buttons configuration, including the default config, and options to update it */
class ButtonsConfig{
    constructor(){
        this.groups = {}
        this.tags = []
    }

    

    getGroups(){
        return Object.keys(this.groups).sort((a , b) => this.groups[a].order - this.groups[b].order )
    }

    getTagsByGroup(groupID){
        return this.tags.filter((tag) => tag.group == groupID)
    }

    removeGroup(groupID){
        delete this.groups[groupID]
        this.saveConfig()
    }
    
    addGroup(groupId){
        this.groups[groupId] = new GroupConfiguration(
            groupId,
            GroupType.Split,
            Object.keys(this.groups).length + 1
        )
        this.saveConfig()
    }

    renameGroup(oldName, newName){
        if(oldName!= "" && newName!=""){
            this.groups[newName] = this.groups[oldName]
            delete this.groups[oldName]
            this.groups[newName].title = newName
            const refreshedTags = this.tags.filter((tag) => tag.group == oldName)
            refreshedTags.forEach(tag => tag.group = newName)
        }
    }

    moveGroup(groupId, position){
        let groups = this.getGroups()
        let groupIdx = groups.indexOf(groupId)
        let group = groups.splice(groupIdx, 1)
        groups.splice(position-1, 0, group)
        for (let index = 0; index < groups.length; index++) {
            this.groups[groups[index]].order = index+1
        }
        this.saveConfig()
    }

    setGroupCondition(groupId, tagId){
        this.groups[groupId].conditionId = tagId
    }

    getTag(tagId){
        return this.tags.find((tag) => tag.stashId == tagId)
    }

    moveTag(tagId, newGroup){
        const tag = this.getTag(tagId)
        if(tag){
            this.getTag(tagId).group = newGroup
            this.saveConfig()
            return true
        }
        return false
    }

    orderTags(){
        let orderedTags = this.tags.sort((tagA, tagB) => {
            let nameA = tagA.getDisplayName()
            let nameB = tagB.getDisplayName()
            return nameA.localeCompare(nameB)
        })
        this.tags = orderedTags
    }

    getOrCreateTag(stashTagData){
        let tag = this.getTag(stashTagData.id)
        if(tag){
            return tag
        }
        tag = TagConfiguration.fromStashTag(stashTagData)
        this.tags.push(tag)
        this.saveConfig()
        return tag
    }

    async saveConfig(){
        this.orderTags()
        /*
        localStorage.setItem("easytag-groups", JSON.stringify(this.groups))
        localStorage.setItem("easytag-tags", JSON.stringify(this.tags))
        */
        const defaultConfig = {
            "Groups" : JSON.stringify(this.groups),
            "Tags" : JSON.stringify(this.tags)
        }
        await csLib.setConfiguration('easytag', defaultConfig)
    }

    async loadConfig(){
        return csLib.getConfiguration('easytag', {"Groups" : "{}", "Tags" : "[]"}).then(storedConfig => {
            if(storedConfig){
                this.groups = JSON.parse(storedConfig["Groups"])
                Object.keys(this.groups).forEach((key) => this.groups[key] = GroupConfiguration.fromSavedData(this.groups[key], key))
                this.tags = JSON.parse(storedConfig["Tags"])
                Object.keys(this.tags).forEach((key) => this.tags[key] = TagConfiguration.fromSavedData(this.tags[key]))
            }
        })
        /*
        const storedGroups = localStorage.getItem("easytag-groups")
        const storedTags = localStorage.getItem("easytag-tags")
        if(storedGroups){
            this.groups = JSON.parse(storedGroups)
            Object.keys(this.groups).forEach((key) => this.groups[key] = GroupConfiguration.fromSavedData(this.groups[key], key))
        }
        if(storedTags){
            this.tags = JSON.parse(storedTags)
            Object.keys(this.tags).forEach((key) => this.tags[key] = TagConfiguration.fromSavedData(this.tags[key]))
        }
        */
    }
}

/** ButtonsConfigUI contains the UI to manage the buttons configuration */
class ButtonsConfigUI{
    constructor(stashQL, buttonsConfig, uiRefreshCallback){
        this.buttonsConfig = buttonsConfig
        this.stashQL = stashQL
        this.callback = uiRefreshCallback
        this.allStashTags = []

        this.BTNCFG_CONTAINER = document.createElement("dialog")
        this.BTNCFG_CONTAINER.innerHTML = UI_BTNCFG_HTML
        this.BTNCFG_CONTAINER.querySelector("#configModalClose").addEventListener("click", () => this.hide())
        this.refreshGroups()
        this.BTNCFG_CONTAINER.querySelector("#addGroupButton").addEventListener("click", () => this.addGroup())


        const btnParent = document.querySelector("div[role='tablist'] > div[role='group']")
        this.BTNCFG_BUTTON = document.createElement("div")
        this.BTNCFG_BUTTON.setAttribute("class", "nav-item")
        this.BTNCFG_BUTTON.innerHTML = `
        <button title="Configure EasyTags" type="button" class="minimal btn btn-secondary">
            <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="gear" class="svg-inline--fa fa-gear " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M481.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-30.9 28.1c-7.7 7.1-11.4 17.5-10.9 27.9c.1 2.9 .2 5.8 .2 8.8s-.1 5.9-.2 8.8c-.5 10.5 3.1 20.9 10.9 27.9l30.9 28.1c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-39.7-12.6c-10-3.2-20.8-1.1-29.7 4.6c-4.9 3.1-9.9 6.1-15.1 8.7c-9.3 4.8-16.5 13.2-18.8 23.4l-8.9 40.7c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-8.9-40.7c-2.2-10.2-9.5-18.6-18.8-23.4c-5.2-2.7-10.2-5.6-15.1-8.7c-8.8-5.7-19.7-7.8-29.7-4.6L69.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l30.9-28.1c7.7-7.1 11.4-17.5 10.9-27.9c-.1-2.9-.2-5.8-.2-8.8s.1-5.9 .2-8.8c.5-10.5-3.1-20.9-10.9-27.9L8.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l39.7 12.6c10 3.2 20.8 1.1 29.7-4.6c4.9-3.1 9.9-6.1 15.1-8.7c9.3-4.8 16.5-13.2 18.8-23.4l8.9-40.7c2-9.1 9-16.3 18.2-17.8C213.3 1.2 227.5 0 242 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l8.9 40.7c2.2 10.2 9.4 18.6 18.8 23.4c5.2 2.7 10.2 5.6 15.1 8.7c8.8 5.7 19.7 7.7 29.7 4.6l39.7-12.6c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM242 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"></path></svg>
        </button>
        `
        this.BTNCFG_BUTTON.addEventListener("click", () => this.show())
    }

    enable(){
        document.body.appendChild(this.BTNCFG_CONTAINER)
        const btnParent = document.querySelector("div.scene-toolbar > span:nth-child(2)")
        btnParent.insertBefore(this.BTNCFG_BUTTON, btnParent.lastChild)
    }

    disable(){
        this.BTNCFG_CONTAINER.remove()
        this.BTNCFG_BUTTON.remove()
    }

    show(){
        this.BTNCFG_CONTAINER.showModal()
        this.refreshTagList()
    }

    hide(){
        this.BTNCFG_CONTAINER.close()
        this.callback()
    }

    refreshConfig(newConfig){
        this.buttonsConfig = newConfig
        this.refreshGroups()
    }

    refreshGroups(){
        const groupsListContainer = this.BTNCFG_CONTAINER.querySelector("#configModalGroupsList")
        // Clear current list
        groupsListContainer.innerHTML = ""


        const groupsList = this.buttonsConfig.getGroups()
        for (const group of groupsList) {
            const currentGroup = this.buttonsConfig.groups[group]
            const groupTag = document.createElement('div')
            groupTag.setAttribute("class", "card card-sm")
            groupTag.id = "configModalGroupsList" + group
            groupTag.innerHTML = `
            <div class="card-body">
                <h5 class="card-title ml-1">` + group + `</h5>
            </div>
            `
            groupTag.querySelector("div > h5").addEventListener("click", () => {
                let newName = prompt("Rename group to:", group)
                if(newName && newName != group){
                    this.renameGroup(group,newName)
                }
            })

            const deleteBtn = createButton(-1 ,FA_TRASH_SVG ,"minimal btn btn-warning float-right mr-1", () => {
                if(confirm("Are you sure you want to delete the group: " + group)){
                    this.removeGroup(group)
                }
            })
            groupTag.querySelector("div > h5").appendChild(deleteBtn)

            const splitBtn = createButton("groupType-" + group + "_split", "Split", "btn btn-secondary btn-sm", (event)=> {
                this.groupChangeType(event, group)
            })
            const groupedBtn = createButton("groupType-" + group + "_grouped", "Grouped", "btn btn-secondary btn-sm", (event)=> {
                this.groupChangeType(event, group)
            })
            const singleBtn = createButton("groupType-" + group + "_grouped-single", "Single", "btn btn-secondary btn-sm", (event)=> {
                this.groupChangeType(event, group)
            })

            const inputRow = document.createElement("div")
            inputRow.classList.add("row", "mt-2","mb-2","mr-3")

            const positionGroup = document.createElement("div")
            positionGroup.setAttribute("class", "input-group input-group-sm col-4")
            positionGroup.innerHTML = `
            <div class='input-group-prepend'>
                <span class='input-group-text'>Pos.</span>
            </div>
            `
            const positionField = document.createElement("input")
            positionField.value = currentGroup.order
            positionField.classList.add("form-control")
            positionGroup.appendChild(positionField)
            positionField.addEventListener("change", (event)=> {
                this.buttonsConfig.moveGroup(group, event.target.value)
                this.refreshGroups()
            })

            const conditionGroup = document.createElement("div")
            conditionGroup.setAttribute("class", "input-group input-group-sm col-8")
            conditionGroup.id="condition"
            conditionGroup.innerHTML = `
            <div class='input-group-prepend'>
                <span class='input-group-text'>Condition Tag</span>
            </div>
            `
            const conditionInput = document.createElement("select")
            conditionInput.classList.add("form-control")
            let options = "<option value='-1'>Always Active</option>"
            this.buttonsConfig.tags.map(tag => {
                let selected = currentGroup.conditionId == tag.stashId ? "selected" : ""
                options+= "<option value='" + tag.stashId + "' " + selected +" >" + tag.getDisplayName() + "</option>"
            })
            conditionInput.innerHTML = options
            conditionInput.addEventListener("change", event => {
                this.buttonsConfig.setGroupCondition(group, event.target.value)
            })
            conditionGroup.appendChild(conditionInput)

            inputRow.appendChild(positionGroup)
            inputRow.appendChild(conditionGroup)



            const btnsContainer = document.createElement("div")
            btnsContainer.classList.add("btn-group")
            btnsContainer.appendChild(splitBtn)
            btnsContainer.appendChild(groupedBtn)
            btnsContainer.appendChild(singleBtn)
            groupTag.querySelector("div > div").appendChild(btnsContainer)
            groupTag.querySelector("div > div").appendChild(inputRow)

            setButtonActive(btnsContainer.querySelector("[id='easyTagButtongroupType-" + group + "_" + this.buttonsConfig.groups[group].type + "']"), true)

            groupsListContainer.appendChild(groupTag)
        }

    }

    removeGroup(groupID){
        this.buttonsConfig.removeGroup(groupID)
        this.BTNCFG_CONTAINER.querySelector("[id='configModalGroupsList" + groupID + "']").remove()
        this.refreshTagGroups()
    }

    addGroup(){
        const groupName = this.BTNCFG_CONTAINER.querySelector("#addGroupInput").value
        if(groupName != ""){
            this.buttonsConfig.addGroup(groupName)
            this.refreshGroups()
            this.refreshTagGroups()
            this.BTNCFG_CONTAINER.querySelector("#addGroupInput").value = ""
        }
    }

    renameGroup(oldName, newName){
        this.buttonsConfig.renameGroup(oldName, newName)
        this.refreshGroups()
        this.refreshTagGroups()
        this.buttonsConfig.saveConfig()
    }

    refreshTagList(){
        const listContainer = this.BTNCFG_CONTAINER.querySelector("#configModalListContainer")
        listContainer.innerHTML = ""

        this.stashQL.getAllTags().then((tags) => {
            this.allStashTags = tags.data.allTags
            for (const tag of this.allStashTags) {
                let tagC = this.buttonsConfig.getTag(tag.id)

                const tagElement = document.createElement("div")
                tagElement.setAttribute("class", "tag-list-row row")
                tagElement.id = "tagElement-" + tag.id

                const tagTitle = document.createElement("div")
                tagTitle.setAttribute("class", "col-2 my-auto")
                tagTitle.innerText = tag.name
                if(tagC && tagC.group != ""){
                    tagTitle.classList.add("font-weight-bold")
                }

                
                const tagAliasInput = document.createElement("input")
                tagAliasInput.setAttribute("class", "form-control text-input col-1 mr-4")
                tagAliasInput.type = "text"
                tagAliasInput.placeholder = "Display name"
                if(tagC){
                    tagAliasInput.value = tagC.name
                }
                else{
                    tagAliasInput.value = ""
                }
                
                tagAliasInput.addEventListener("change", (event) => {
                    let tagConf = this.buttonsConfig.getOrCreateTag(tag)
                    tagConf.name = event.target.value
                })

                const tagButtonsContainer = document.createElement("div")
                tagButtonsContainer.setAttribute("class", "btn-group ml-4")
                tagButtonsContainer.setAttribute("role", "group")

                tagElement.appendChild(tagTitle)
                tagElement.appendChild(tagAliasInput)
                tagElement.appendChild(tagButtonsContainer)
                listContainer.appendChild(tagElement)
            }
            this.refreshTagGroups()
        })
    }

    refreshTagGroups(){
        const listContainer = this.BTNCFG_CONTAINER.querySelector("#configModalListContainer")
        const groupsList = this.buttonsConfig.getGroups()
        for (const tag of listContainer.childNodes) {
            const tagId = tag.id.split('-').pop()
            const btnsContainer = tag.querySelector(".btn-group")
            btnsContainer.innerHTML = ""
            
            const noneButton = createButton("tagGroupButton-" + tagId + "-none" , "None", "btn btn-primary btn-sm active", (event) => {
                this.setTagGroup(event, tagId, "")
            })
            btnsContainer.appendChild(noneButton)

            for (const group of groupsList) {
                const groupButton = createButton("tagGroupButton-" + tagId + "-" + group, group, "btn btn-secondary btn-sm", (event) => {
                    this.setTagGroup(event, tagId, group)
                })

                btnsContainer.appendChild(groupButton)
            }
        }

        for (const tag of this.buttonsConfig.tags) {
            if(tag.group != ""){
                const noneButton = listContainer.querySelector("#easyTagButtontagGroupButton-" + tag.stashId + "-none")
                const groupButton = listContainer.querySelector("#easyTagButtontagGroupButton-" + tag.stashId + "-" + tag.group)
                setButtonActive(noneButton, false)
                setButtonActive(groupButton, true)
            }
        }
    }

    groupChangeType(event, group){
        selectSingleButton(event)

        const groupType = event.target.id.split("_").pop()
        this.buttonsConfig.groups[group].type = groupType
    }

    setTagGroup(event, tagID, groupID){
        selectSingleButton(event)

        if(!this.buttonsConfig.getTag(tagID)){
            const stashTag = this.allStashTags.find((tag) => tag.id == tagID)
            this.buttonsConfig.getOrCreateTag(stashTag)
        }
        this.buttonsConfig.moveTag(tagID, groupID)
    }

}
