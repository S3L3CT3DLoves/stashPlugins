const ratingSliderHTML = `
<div class="input-group">
    <input placeholder="Rating" name="rating" type="range" id="rating-slider" class="form-range form-control" min="1" max="10" value="">
    <span class="input-group-text" id="rating-output">0</span>
</div>
`

const scenePagePattern = new RegExp("/scenes/(\\d+)")
let quickRatingConfig = {}

class QuickRating{
  constructor(){
    this.mode = ""
    this.maxValue = 1
    // Init based on plugin config
    if (quickRatingConfig["Astar10"]){
      this.mode == "STAR"
      this.maxValue = 10
    }
    else if (quickRatingConfig["Bslide10"]){
      this.mode = "SLIDE"
      this.maxValue = 10
    }
    else if (quickRatingConfig["Cslide20"]){
      this.mode = "SLIDE"
      this.maxValue = 20
    }
    else{
      this.mode = "NATIVE"
      this.maxValue = 5
    }

    this.ratingSliderElement = null
    this.ratingDisplayElement = null
    this.rating = 0
    this.sceneId = window.location.pathname.split('/')[2]
    this.getRatingFromAPI()
  }

  updateDisplay(){
    const ratingContainer = document.querySelector(".scene-toolbar-group > div")
    switch (this.mode) {
      case "STAR":
        // Not supported yet
        break;
      case "SLIDE":
        ratingContainer.innerHTML = ratingSliderHTML
        this.ratingSliderElement = document.getElementById("rating-slider")
        this.ratingDisplayElement = document.getElementById("rating-output")

        this.ratingSliderElement.max = this.maxValue
        this.ratingSliderElement.addEventListener("input", (e) => { this.changeValue(e) })
        console.log(this.ratingSliderElement)
        this.displayValue()
        break;
      default:
        // Use native
        break;
    }
  }

  async getRatingFromAPI(){
    const query = `
          query FindScene($id: ID!) {
            findScene(id: $id) {
              id
              title
              rating100
            }
          }`;
    const variables = { id: this.sceneId };
    const response = await csLib.callGQL({ query, variables });
    let rating100 = response["findScene"]["rating100"] ?? 0
    this.rating = rating100 / (100 / this.maxValue)
  }

  async updateRatingAPI(newRating){
    const queryBody = {
      operationName : "SceneUpdate",
      query : `
        mutation SceneUpdate($input: SceneUpdateInput!) {
            sceneUpdate(input: $input) {
              rating100
            }
          }`,
      variables :{
          input : {
              id : this.sceneId,
              rating100 : newRating * (100 / this.maxValue)
          }
      }
  }
    await csLib.callGQL(queryBody);
  }

  displayValue(){
    this.ratingSliderElement.value = this.rating
    this.ratingDisplayElement.innerText = this.rating
  }

  changeValue(e){
    this.rating = e.target.value
    this.updateRatingAPI(e.target.value)
    this.displayValue()
  }
}

async function quickRating(page){
  if(Object.keys(quickRatingConfig).length == 0){
    // Init plugin
    console.log("Init quickRating")
    quickRatingConfig = await getConfig()
  }

  if (scenePagePattern.test(page)){
    let quickRatingPlugin = new QuickRating()
    ensureLibLoaded("csLib", 500).then(function(){
      csLib.waitForElement(".scene-toolbar-group", () => {
        quickRatingPlugin.updateDisplay()
      })
    });
  }
}

async function getConfig(){
  const defaultQuickRatingConfig = {
    "native": true,
    "Astar10": false,
    "Bslide10": false,
    "Cslide20": false
  }
  const config = await csLib.getConfiguration('quickRating', defaultQuickRatingConfig)
  return {...defaultQuickRatingConfig, ...config}
}


PluginApi.Event.addEventListener("stash:location", (e) => {
    quickRating(e.detail.data.location.pathname)
});

quickRating(window.location.pathname)

function ensureLibLoaded(libname, timeout) {
  var start = Date.now();
  return new Promise(waitForLib);

  function waitForLib(resolve, reject) {
      if (window[libname]){
        resolve(window[libname])
      }
      else if (timeout && (Date.now() - start) >= timeout){
          console.error("It seems you are missing a javascript library: ", libname)
          reject(new Error("timeout"))
      }
      else{
        setTimeout(waitForLib.bind(this, resolve, reject), 30)
      }  
  }
}