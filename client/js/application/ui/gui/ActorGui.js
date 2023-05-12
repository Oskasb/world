"use strict";

define([
        'ui/ActorGuiProcessor'
    ],
    function(
        ActorGuiProcessor
    ) {

        var ActorGui = function(actor) {
            this.actor = actor;
            this.guiWidgets = [];
        };


        ActorGui.prototype.addGuiWidget = function(guiWidget) {
            this.guiWidgets.push(guiWidget)
        };

        ActorGui.prototype.removeGuiWidget = function(w) {
            w.removeGuiWidget();
        };

        ActorGui.prototype.removeAllGuiWidgets = function() {
            while (this.guiWidgets.length) {
                this.removeGuiWidget(this.guiWidgets.pop())
            }
        };

        ActorGui.prototype.activateActorGui = function() {
            ActorGuiProcessor.activateActorGui(this.actor);
        };

        ActorGui.prototype.guiWidgetCount = function() {
            return this.guiWidgets.length;
        };

        return ActorGui;

    });

