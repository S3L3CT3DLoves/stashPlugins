const UI_CONTAINER_HTML = `
<div id="pluginContainer">
    <div class="form-container edit-buttons-container px-3 pt-3 row">
        <div class="col-12" id="buttons-container">
        </div>
    </div>
</div>
`

const UI_BTNCFG_HTML = `
<form id="configModal" method="dialog">
    <h3>QuickEdit Configuration</h3>
    <div class="scrollable">
        <h4 class="mt-2">Groups</h4>
        <div class="mt-2 mb-2" id="configModalGroupsContainer">
            <div class="mb-2 mr-5 col-12 row" id="configModalGroupsList">
            </div>
            <div class="input-group row col-6">
                <div class="input-group-append">
                    <button type="button" id="addGroupButton" class="btn btn-sm btn-secondary">Add Group</button>
                </div>
                <input type="text" id="addGroupInput" class="form-control" placeholder="new group name"></input>
            </div>
        </div>
        <h4 class="mt-4">Tags</h4>
        <div class="mt-2 mb-2" id="configModalListContainer">
        </div>
    </div>
    <div>
        <button id="configModalClose" formmethod="dialog" class="btn btn-secondary" type="submit" autofocus>Close Popup</button>
        <div class="float-right mr-5">
            <button id="configModalDlConfig" title="Save the config to a file on your computer" class="btn btn-secondary ml-1" >Backup to file</button>
            <button id="configModalUpConfig" title="Upload a backup config file and reload the page" class="btn btn-secondary ml-1" >Restore from file</button>
        </div>
    </div>
</form>
`

const FA_TRASH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="svg-inline--fa fa-trash" role="img">
<path fill="currentColor" d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
</svg>
`
