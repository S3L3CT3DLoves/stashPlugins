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
    constructor(title="", type = GroupType.Split, order = -1, conditionIds = []){
        this.type = type
        this.order = order
        this.title = title
        this.conditionIds = conditionIds
    }

    static fromSavedData(savedObject, title = ""){
        return new GroupConfiguration(
            title != "" ? title : savedObject.title,
            savedObject.type,
            savedObject.order,
            savedObject.conditionIds
        )
    }

    maybeDisplayGroup(activeTags){
        if(this.conditionIds == []){
            return true
        }

        return this.conditionIds.some(id => activeTags.includes(id))
    }
}