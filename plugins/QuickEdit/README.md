# *QuickEdit*
Adds a new Tab to the Scene UI to make one-handed Editing easier 😉

# Requirement
- Stash (v0.24+)

# Installation
- Download the whole folder '**QuickEdit**'
- Place it in your **plugins** folder
- Reload plugins (Settings > Plugins > Reload)
- *quickedit* appears

# Usage
The plugin is automatically displayed as a Tab called *QuickEdit* in the Scene page
**The plugin must be configured before use!**

Features
- Saves your changes directly to Stash, no need to Save !
- Fully configurable list of tags
- Easy rating system

ToDo
- Bugfix: When using the native Edit tab, the changes made in QuickEdit are lost
- Improvement: Search tag in the config menu
- Improvement: Dropdown list for large groups of type single
- Improvement: Give more rating options (5-stars, 10-stars, 5-slider, 10-slider, 20-slider)

Features for the future
- Background color for each group
- Config export/restore to file


# Configuration
Configuration happens in the Config UI, you can access it by clicking the "gear" icon in any scene (should be next to the "Organised" icon)
This will allow you to define:
- Tag groups you want to use
- Which tag belongs to which group
- Set aliases for Tags (to shorten their names for example)
- Only display groups of tags if a certain tag is selected

# Warning
The configuration is saved in the brower's LocalStorage, don't clear it or you will lose your configuration !


This plugin does not play nicely with the traditional **Edit** tab in Stash.

Because the plugin saves all the changes directly, this is not reflected in the Edit tab.

After using **QuickEdit**, reload your browser page before making changes in the **Edit** tab.