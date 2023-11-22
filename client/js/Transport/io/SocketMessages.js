

	SocketMessages = function() {

        var Messages = {
            ModuleStateRequest:{source:'ModuleStateRequest', method:'playerModuleRequest', target:'gameMain', reflect:false},
            RegisterPlayer:{source:'ServerGameMain', method:'registerPlayer', target:'gameMain', reflect:false},
            playerUpdate:{source:'', method:'', target:'gameMain', reflect:false},
            sectorUpdate:{source:'', method:'', target:'gameMain', reflect:false},
            clientConnected:{source:'Clients', method:'registerConnection', target:'clientRegistry', reflect:true},
            updateGameData:{source:'', method:'', target:'clientRegistry', reflect:false},
            RegisterClient:{source:'Clients', method:'registerClient', target:'clientRegistry', reflect:true},
            RequestPlayer:{source:'Clients', method:'requestPlayer', target:'clientRegistry', reflect:true},
            RequestProfileUpdate:{source:'Clients', method:'requestPlayer', target:'clientRegistry', reflect:false},
            ServerWorld:{source:'ServerWorld', method:'fetch', target:'clientWorld', reflect:true},
            ping:{source:'ping', method:'ping', target:'timeTracker', reflect:true}
        };

		this.messages = {};
		for (var key in Messages) {
			this.messages[key] = new Message(key, Messages[key])
		}

	};


	SocketMessages.prototype.getMessageById = function(id) {
		return this.messages[id];
	};


