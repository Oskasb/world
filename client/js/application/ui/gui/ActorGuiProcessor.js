"use strict";

define([

    ],
    function(

    ) {

        var ActorGuiProcessor = function(actor) {

        };

        var attachSlotActionButton = function(slot, actorGui) {

                var addActionButtonToSlot = function(actionButton) {
                    actionButton.bindActionSlotCallbacks(slot);
                    actorGui.addGuiWidget(actionButton);
                };

                GuiAPI.buildGuiWidget('GuiActionButton', {configId:"widget_action_button", offset_x:slot.x, offset_y:slot.y}, addActionButtonToSlot);

        };

        ActorGuiProcessor.activateActorGui = function(actor) {

            var actorGui = actor.getActorGui();

            var guiApsReady = function(guiAps) {
                guiAps.setActionPointStatus(actor.getCharacterCombat().getActionPoints());
                actorGui.addGuiWidget(guiAps);
            };

            GuiAPI.buildGuiWidget('GuiActionPointStatus', {configId:"widget_action_point_container", anchor:'bottom_center', icon:'progress_horizontal'}, guiApsReady);

            var actionSlots = actor.getCharacterCombat().getActiontSlots().slots;

            for (var i = 0; i < actionSlots.length; i++) {
                attachSlotActionButton( actionSlots[i], actorGui)
            }

            var stickReady = function(stick) {
                stick.addInputUpdateCallback(actor.getCharacterMovement().getCallback('applyInputUpdate'));
                actorGui.addGuiWidget(stick);
            };

            GuiAPI.buildGuiWidget('GuiThumbstick', {configId:'widget_thumbstick', anchor:'bottom_left', icon:'directional_arrows'}, stickReady);

        };


        return ActorGuiProcessor;

    });

