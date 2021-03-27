var creepBasic = {
    name: 'creepBasic',
    role: 'basic',
    body: [
        [],
        [WORK,MOVE,CARRY],
        [WORK,MOVE,CARRY],
        [WORK,MOVE,CARRY],
        [WORK,MOVE,CARRY],
        [WORK,MOVE,CARRY],
        [WORK,MOVE,CARRY],
        [WORK,MOVE,CARRY],
        [WORK,MOVE,CARRY]
    ],
    limits: [3,3,5,5,6,2,2,1,1],

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
        let oTarget = null;
        switch (c.memory.mode) {
            case 0:
                Engine.m['cUtility'].findEnergy(Engine, c);
                break ;
            case 1:

                oTarget = c.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (structure) => {
                        return (
                            structure.structureType == STRUCTURE_TOWER &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > c.store.getCapacity(RESOURCE_ENERGY)
                        );
                    }
                });
                if (oTarget) {

                    oAction = c.transfer(oTarget, RESOURCE_ENERGY);
                    if (oAction == ERR_NOT_IN_RANGE) {
                        c.moveTo(oTarget);
                    }

                } else {
                    c.memory.mode = 2;
                }
                break ;
            case 2:

                oTarget = c.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (structure) => {
                        return (
                            (
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_EXTENSION
                            ) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                        );
                    }
                });
                if (oTarget) {

                    oAction = c.transfer(oTarget, RESOURCE_ENERGY);
                    if (oAction == ERR_NOT_IN_RANGE) {
                        c.moveTo(oTarget);
                    }

                } else {
                    c.memory.mode = 3;
                }
                break ;
            case 3:

                if(c.upgradeController(c.room.controller) == ERR_NOT_IN_RANGE) {
                    c.moveTo(c.room.controller);
                }
                break ;
        }
    },

    // creepHook for module
    cHook : function (Engine, c) {
        if (c.memory.role == creepBasic.role) {
            creepBasic.fnc(Engine, c);
        }
    },

    // RoomHook for module.
    rHook : function (Engine, r) {
        let iCount = Engine.m['cUtility'].getCount(
            Engine,
            r.name,
            creepBasic.role
        );
        let iMax = creepBasic.limits[r.RoomLevel];
        if (iCount < iMax) {
            // should build
            Game.spawns[r.rSpawn[0]].spawnCreep(
                creepBasic.body[r.RoomLevel],
                'Worker_' + iCount + '--' +  Math.random().toString(36).substr(2, 9),
                {
                    memory : {
                        role: creepBasic.role,
                        home: r.name,
                        module: creepBasic.name
                    }
                }
            );
        }
    }
};
module.exports = creepBasic;
