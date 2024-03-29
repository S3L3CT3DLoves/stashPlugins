const GroupType = {
    Split: "split",
    Grouped: "grouped",
    Single: "grouped-single"
}

class TagConfiguration{
    constructor(id = -1, name = "", stashName = "", group = ""){
        this.stashId = id
        this.name = name
        this.stashName = stashName
        this.group = group
    }

    static fromSavedData(savedObject){
        return new TagConfiguration(
            savedObject.stashId,
            savedObject.name,
            savedObject.stashName,
            savedObject.group
        )
    }

    static fromStashTag(stashTagData){
        return new TagConfiguration(
            Number(stashTagData.id),
            "",
            stashTagData.name,
            ""
        )
    }

    getDisplayName(){
        return this.name != "" ? this.name : this.stashName
    }
}

class GroupConfiguration{
    constructor(title="", type = GroupType.Split, order = -1, conditionId = "-1"){
        this.type = type
        this.order = order
        this.title = title
        this.conditionId = conditionId
    }

    static fromSavedData(savedObject, title = ""){
        return new GroupConfiguration(
            title != "" ? title : savedObject.title,
            savedObject.type,
            savedObject.order,
            savedObject.conditionId
        )
    }

    maybeDisplayGroup(activeTags){
        if(this.conditionId == "-1"){
            return true
        }

        return activeTags.includes(this.conditionId)
    }
}