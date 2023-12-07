let statusIcons = {}
statusIcons[ENUMS.ActorStatus.SELECTED_ENCOUNTER] = 'icon_dagger';
statusIcons[ENUMS.ActorStatus.REQUEST_PARTY] = 'CAM_PARTY' ;
statusIcons[ENUMS.ActorStatus.ACTIVATING_ENCOUNTER] = 'icon_fight';
statusIcons[ENUMS.ActorStatus.ACTIVATED_ENCOUNTER] = 'icon_fight';
statusIcons[ENUMS.ActorStatus.RETREATING] = 'icon_run';
statusIcons[ENUMS.ActorStatus.EXIT_ENCOUNTER] = 'icon_sleep';


export {
    statusIcons
}