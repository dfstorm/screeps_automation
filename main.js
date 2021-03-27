
var Engine = {

    // module Array
    m : Array,

    // Run cHook for each module
    cHookRuntime : function (Engine) {
        for (const i in Game.creeps) {
            let creep = Game.creeps[i];
            for (const m in Engine.m) {
                if (Engine.m[m].cHook != undefined) {
                    let fnc = Engine.m[m].cHook;
                    try {
                        fnc(Engine, creep);
                    } catch (e) {
                        console.log("chook| " + m + " | " + e + " " + e.lineNumber);
                    }
                }
            }
        }
    },

    // Run rHook for each module
    rHoohRunetime : function (Engine) {
        for (const r in Memory.engine.rooms) {
            for (const m in Engine.m) {
                if (Engine.m[m].rHook != undefined) {
                    try {
                        let fnc = Engine.m[m].rHook;
                        fnc(Engine, Memory.engine.rooms[r]);
                    } catch (e) {
                        console.log("rHook| " + m + " | " +  e + " " + e.lineNumber);
                    }
                }
            }
        }
    },

    // Init - Entry point
    init : function() {
        // Module array
        const rM = [
            'cUtility',     // Generic Creep Tools
            'bootstrap',    // Init tools
            'creepBasic',   // Creep > Basic
            'creepMiner',
            'building',     // Buidling planner
            'creepBuilder', // Creep > Builder
            'creepUpdater', // creep > Updater
            'defence',

            'creepMover'
        ];

        // Load each module
        for (i in rM) {
            Engine.m[rM[i]] = require(rM[i]);
        }

        // Init memory base if needed.
        if (Memory.engine == null) {
            Engine.m['bootstrap'].refreshMemory(Engine);
            return ;
        }

        // Run cHook
        Engine.cHookRuntime(Engine);

        // Run rHook
        Engine.rHoohRunetime(Engine);

        // Remove dead creep memory
        if (Game.time % 20) {
            for(var i in Memory.creeps) {
                if(!Game.creeps[i]) {
                    delete Memory.creeps[i];
                }
            }
        }
    }
};

Engine.init();
