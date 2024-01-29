


let paperdollPage = null;

function updateCharacterPaperdollSys() {
    let navState = GuiAPI.getNavigationState()
    if (navState === ENUMS.NavigationState.CHARACTER) {

        if (paperdollPage === null) {
            paperdollPage = GuiAPI.activatePage('page_paperdoll_hero')
        }

    } else {
        if (paperdollPage !== null) {
            paperdollPage.closeGuiPage()
            paperdollPage = null;
        }
    }

}

class CharacterPaperdollUiSystem {
    constructor() {

    }


    initPaperdollSystem() {
        ThreeAPI.addPrerenderCallback(updateCharacterPaperdollSys);
    }


}

export { CharacterPaperdollUiSystem }