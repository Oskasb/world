
class HomeScenario {
    constructor() {

        let updateHome = function(value) {
            if (value.scenario) {
                if (value.scenario === 'home') {
                    this.tickHomeScenario()
                }
            }
        }.bind(this)

        evt.on(ENUMS.Event.SCENARIO_UPDATE, updateHome);
    }

    tickHomeScenario() {
        let scenarioTime = GameAPI.getGameTime();
        let player = GameAPI.getMainCharPiece()();
        if (player){

            if (Math.random() < 0.02) {


                let randomAnims = [
                    'CT_ML_R',
                    'CT_MR_R',
                    'CT_TC_R',
                    'CT_TR_R',
                    //    'DEAD',
                    //    'FALL',
                    'GD_BCK_R',
                    'GD_HI_R',
                    'GD_HNG_R',
                    'GD_INS_R',
                    //    'GD_LFT_FF',  // broken
                    'GD_LNG_R',
                    'GD_LOW_R',
                    'GD_MID_R',
                    'GD_RT_FF',
                    'GD_SHT_R',
                    'GD_SID_R',
                    'IDLE',
                    //    'IDL_HI_CB',
                    //    'IDL_LO_CB',
                    //    'RUN',
                    //   'SET_LFT_FF',  // broken
                    'SET_RT_FF',
                    'SW_BCK_R',
                    'SW_SID_R',
                    //    'WALK',
                    //    'WALK_BODY',
                    //    'WALK_COMBAT'
                ];

                let count = randomAnims.length;

                let key = randomAnims[ Math.floor( scenarioTime*2) % count];

                //    GuiAPI.printDebugText("ANIM KEY: "+key);

             //   player.applyPieceAnimationState(key)
            }

        }


        let effectCb = function(eftc) {
            //     console.log("effect add: ", effect)
            eftc.activateEffectFromConfigId()
            //    client.gameEffects.push(effect);
            eftc.pos.x = Math.sin(261*scenarioTime)*(7) + (Math.random()*3.2);
            eftc.pos.y = Math.sin(34 *scenarioTime) * 3  + 2 + Math.random() * 3;
            eftc.pos.z = Math.cos(261*scenarioTime)*(18) + (Math.random()*3.2 + 16);
            eftc.setEffectPosition(eftc.pos)
        };

        if (Math.random() < 0.15) {
            EffectAPI.buildEffectClassByConfigId('additive_particles_8x8', 'effect_action_point_wisp',  effectCb)
        }

        //   ThreeAPI.setCameraPos(
        //       Math.cos(scenarioTime*0.2)*1.2+2,
        //        Math.sin(scenarioTime*0.4)*0.5+5,
        //       Math.sin(scenarioTime*0.2)*1.2-8
        //   );

        //    ThreeAPI.cameraLookAt(0, 3, 0);


    }
    tickScenario(tpf, scenarioTime) {
        this.tickHomeScenario(tpf, scenarioTime)
    }

}

export { HomeScenario }