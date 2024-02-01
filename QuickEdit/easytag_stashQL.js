/** StashGraphQL contains helper functions to Read and Write to the current Stash scene. It is stateful and maintains a copy of the scene at all times. */
class StashGraphQL{
    constructor(endpoint){
        this.endpoint = endpoint
        this.sceneData = {}
        this._tagQuery = `
        mutation SceneUpdate($input: SceneUpdateInput!) {
            sceneUpdate(input: $input) {
              ...SceneData
              __typename
            }
          }
          
          fragment SceneData on Scene {
            rating100
            tags {
              ...SlimTagData
              __typename
            }
            __typename
          }
          
          fragment SlimTagData on Tag {
            id
            name
            __typename
          }`
    }

    updateLocalScene(jsonData){
        if(typeof jsonData.data.findScene !== 'undefined'){
            this.sceneData = jsonData.data.findScene
        }
        else if(typeof jsonData.data.sceneUpdate !== 'undefined'){
            this.sceneData.rating100 = jsonData.data.sceneUpdate.rating100
            this.sceneData.tags = jsonData.data.sceneUpdate.tags
        }
        console.log(this.sceneData)
    }

    sceneHasTag(tagId){
        return this.sceneData.tags.find((tag) => tag.id == tagId)
    }

    async getScene(sceneID){
        const query = `query FindScene($id: ID!, $checksum: String) {
            findScene(id: $id, checksum: $checksum) {
              ...SceneData
              __typename
            }
          }
          
          fragment SceneData on Scene {
            id
            title
            rating100
            studio {
              ...SlimStudioData
              __typename
            }
            tags {
              ...SlimTagData
              __typename
            }
            performers {
              ...PerformerData
              __typename
            }
            __typename
          }
          
          fragment SlimStudioData on Studio {
            id
            name
            __typename
          }
          
          fragment SlimTagData on Tag {
            id
            name
            __typename
          }
          
          fragment PerformerData on Performer {
            id
            name
            disambiguation
            gender
            alias_list
            favorite
            rating100
            __typename
          }
        `
        const queryBody = {
            operationName : "FindScene",
            query : query,
            variables : {
                id : sceneID
            }
        }

        await fetch(this.endpoint,{
            method: 'POST',
            body: JSON.stringify(queryBody),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((ret) => ret.json()).then((ret) => this.updateLocalScene(ret))
    }

    async addTag(tagId){
        let newTagIds = new Set(this.sceneData.tags.map((tag) => tag.id))
        newTagIds.add(tagId)

        const queryBody = {
            operationName : "SceneUpdate",
            query : this._tagQuery,
            variables :{
                input : {
                    id : this.sceneData.id,
                    tag_ids : [...newTagIds]
                }
            }
        }

        let response = fetch(this.endpoint,{
            method: 'POST',
            body: JSON.stringify(queryBody),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((ret) => ret.json()).then((ret) => this.updateLocalScene(ret))

        return response
    }

    async removeTag(tagId){
        let newTagIds = new Set(this.sceneData.tags.map((tag) => tag.id))
        if(newTagIds.has(tagId)){
            newTagIds.delete(tagId)
        }
        const queryBody = {
            operationName : "SceneUpdate",
            query : this._tagQuery,
            variables :{
                input : {
                    id : this.sceneData.id,
                    tag_ids : [...newTagIds],
                    rating100 : this.sceneData.rating100
                }
            }
        }

        let response = fetch(this.endpoint,{
            method: 'POST',
            body: JSON.stringify(queryBody),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((ret) => ret.json()).then((ret) => this.updateLocalScene(ret))
        return response
    }

    async batchUpdateTags(addTags = [], removeTags = []){
        let newTagIds = new Set(this.sceneData.tags.map((tag) => parseInt(tag.id)))
        
        for (const tagId of addTags) {
            newTagIds.add(tagId)
        }
        for (const tagId of removeTags) {
            newTagIds.delete(tagId)
        }

        const queryBody = {
            operationName : "",
            query : this._tagQuery,
            variables :{
                input : {
                    id : this.sceneData.id,
                    tag_ids : [...newTagIds],
                    rating100 : this.sceneData.rating100
                }
            }
        }

        let response = fetch(this.endpoint,{
            method: 'POST',
            body: JSON.stringify(queryBody),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((ret) => ret.json()).then((ret) => this.updateLocalScene(ret))
        return response

    }

    async setRating(rating){
        const queryBody = {
            operationName : "SceneUpdate",
            query : this._tagQuery,
            variables :{
                input : {
                    id : this.sceneData.id,
                    rating100 : rating
                }
            }
        }

        let response = fetch(this.endpoint,{
            method: 'POST',
            body: JSON.stringify(queryBody),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((ret) => ret.json()).then((ret) => this.updateLocalScene(ret))

        return response
    }

    async getAllTags(){
        const query = `query AllTagsForFilter {
            allTags {
              id
              name
              aliases
              __typename
            }
          }
        `
        const queryBody = {
            operationName : "AllTagsForFilter",
            query : query,
            variables : {
            }
        }

        const call = await fetch(this.endpoint,{
            method: 'POST',
            body: JSON.stringify(queryBody),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const result = await call.json()

        return result
    }
}
