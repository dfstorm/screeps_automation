var creepUpdater = {
    name: 'creepUpdater',
    role: 'updater',
    body: [
        [],
        [],
        [], // 550
        [
            WORK, WORK, WORK, WORK,
            MOVE, MOVE, MOVE, MOVE,
            CARRY, CARRY, CARRY, CARRY
        ], // 800
        [
            WORK, WORK, WORK, WORK, WORK, WORK, // 600
            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, // 350
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY // 350
        ], // 1300
        [
            WORK, WORK, WORK, WORK, WORK, WORK, // 600
            MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, // 350
            CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY // 350
        ],
        [
            WORK, WORK, WORK, WORK, WORK,     // 1000
            WORK, WORK, WORK, WORK, WORK,     //
            MOVE, MOVE, MOVE, MOVE, MOVE,     // 250
            CARRY, CARRY, CARRY, CARRY, CARRY,// 1000
            CARRY, CARRY, CARRY, CARRY, CARRY,//
            MOVE, MOVE, MOVE, MOVE, MOVE,     //
            MOVE, MOVE, MOVE, MOVE, MOVE      //
        ], // 2300
        [WORK, MOVE, CARRY],
        [WORK, MOVE, CARRY]
    ],
    limits: [0, 0, 2, 2, 2, 2, 2, 1],

    // inner function for the creep
    fnc: function (Engine, c) {
        Engine.m['cUtility'].addCount(
            Engine,
            c.memory.home,
            c.memory.role
        );

        if (c.memory.mode == null || c.memory.mode == undefined) {
            c.memory.mode = 0;
        }
        if(c.store[RESOURCE_ENERGY] == 0) {
            c.memory.mode = 0;
        }
        if(c.store.getFreeCapacity(RESOURCE_ENERGY) == 0 && c.memory.mode == 0) {
            Engine.m['cUtility'].clearMySpot(Engine, c);
            c.memory.mode = 1;
        }

        switch (c.memory.mode) {
            case 0:
                Engine.m['cUtility'].findEnergy(Engine, c);
                break;
            case 1:
                if(c.upgradeController(c.room.controller) == ERR_NOT_IN_RANGE) {
                    c.moveTo(c.room.controller);
                }
                break;
        }
    },

    // creepHook for module
    cHook : function (Engine, c) {
        if (c.memory.role == creepUpdater.role) {
            creepUpdater.fnc(Engine, c);
        }
    },

    // RoomHook for module.
    rHook : function (Engine, r) {
        let iCount = Engine.m['cUtility'].getCount(
            Engine,
            r.name,
            creepUpdater.role
        );
        let iMax = creepUpdater.limits[r.RoomLevel];
        if (iCount < iMax) {
            // should build
            Game.spawns[r.rSpawn[0]].spawnCreep(
                creepUpdater.body[r.RoomLevel],
                'Updater' + iCount + '--' +  Math.random().toString(36).substr(2, 9),
                {
                    memory : {
                        role: creepUpdater.role,
                        home: r.name,
                        module: creepUpdater.name
                    }
                }
            );
        }
    }
}

module.exports = creepUpdater;