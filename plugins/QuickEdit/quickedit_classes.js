const GroupType = {
    Split: "split",
    Grouped: "grouped",
    Single: "grouped-single"
}

class TagConfiguration{
    constructor(id = -1, name = "", stashName = "", stashSortName="", group = ""){
        this.stashId = id
        this.name = name
        this.stashName = stashName
        this.stashSortName = stashSortName
        this.group = group
    }

    static fromSavedData(savedObject){
        return new TagConfiguration(
            savedObject.stashId,
            savedObject.name,
            savedObject.stashName,
            savedObject.stashSortName,
            savedObject.group
        )
    }

    static fromStashTag(stashTagData){
        return new TagConfiguration(
            Number(stashTagData.id),
            "",
            stashTagData.name,
            stashTagData.sort_name,
            ""
        )
    }

    updateFromStashTag(stashTagData)  {
        this.stashName =  stashTagData.name;
        this.stashSortName = stashTagData.sort_name;
    }

    getDisplayName() {
        return this.name != "" ? this.name : this.stashName
    }

    getSortName() {
        return (this.stashSortName ? this.stashSortName : '') + this.getDisplayName();
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