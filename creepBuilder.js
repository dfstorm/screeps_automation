var creepBuilder = {
    name: 'creepBuilder',
    role: 'builder',
    body: [
        [],
        [WORK,MOVE,CARRY], // 200
        [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY], // 550
        [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY],
        [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY],
        [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY],
        [
            WORK, WORK, WORK, WORK, WORK,     // 1000
            WORK, WORK, WORK, WORK, WORK,     //
            MOVE, MOVE, MOVE, MOVE, MOVE,     // 250
            CARRY, CARRY, CARRY, CARRY, CARRY,// 1000
            CARRY, CARRY, CARRY, CARRY, CARRY,//
            MOVE, MOVE, MOVE, MOVE, MOVE,     //
            MOVE, MOVE, MOVE, MOVE, MOVE      //
        ], // 2300
        [WORK,MOVE,CARRY],
        [WORK,MOVE,CARRY]
    ],
    limits: [0,3,3,3,4,2,2,1],

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

        let rIndex = Engine.m['cUtility'].getRoomIndexFromName(c.room.name);
        let r = Memory.engine.rooms[rIndex];
        let sbfound;

        switch (c.memory.mode) {
            case 0:

                Engine.m['cUtility'].findEnergy(Engine, c);
                break ;
            case 1:

                // builder
                const target = c.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
                if(target) {
                    if(c.build(target) == ERR_NOT_IN_RANGE) {
                        c.moveTo(target);
                    }
                } else {
                    c.memory.mode = 2;
                }
                break ;
            case 2:
                // Build roads
                if (r.RoomLevel < 2) {
                    c.memory.mode = 3;
                    break ;
                }
                oRoad = null;

                for (let ro in r.rRoadPath) {
                    let data = Game.spawns[r.rSpawn[0]].room.lookAt(
                        r.rRoadPath[ro].x,
                        r.rRoadPath[ro].y
                    );
                    sbfound = false;

                    if (data.length > 0) {
                        for (let d in data) {
                            if (data[d].type == 'structure') {
                                // There is allready a road here.
                                sbfound = true;
                            }
                        }
                    }
                    if (!sbfound) {
                        Game.rooms[c.room.name].createConstructionSite(
                            r.rRoadPath[ro].x,
                            r.rRoadPath[ro].y,
                            STRUCTURE_ROAD
                        );
                        c.memory.mode = 1;
                        break ;
                    }
                }
                if (c.memory.mode == 2) {
                    c.memory.mode = 3;
                }
                break ;
            case 3:
                // Build Walls
                oRoad = null;
                for (let ro in r.rWalls) {
                    let data = Game.spawns[r.rSpawn[0]].room.lookAt(
                        r.rWalls[ro].x,
                        r.rWalls[ro].y
                    );
                    sbfound = false;
                    if (data.length > 0) {
                        for (let d in data) {
                            if (data[d].type == 'structure') {
                                // There is allready a road here.
                                sbfound = true;
                            }
                        }
                    }
                    if (!sbfound) {
                        Game.rooms[c.room.name].createConstructionSite(
                            r.rWalls[ro].x,
                            r.rWalls[ro].y,
                            STRUCTURE_WALL
                        );
                        c.memory.mode = 1;
                        break ;
                    }
                }
                if (c.memory.mode == 3) {
                    c.memory.mode = 4;
                }
                break ;
            case 4:
                // Build Ramparts
                c.memory.mode = 5;
                break ;
            case 5:


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
                    } else {
                        c.memory.mode = 6;
                    }

                } else {
                    c.memory.mode = 6;
                }
                break ;
            case 6:
                if(c.upgradeController(c.room.controller) == ERR_NOT_IN_RANGE) {
                    c.moveTo(c.room.controller);
                }
                break ;
        }
    },

    // creepHook for module
    cHook : function (Engine, c) {
        if (c.memory.role == creepBuilder.role) {
            creepBuilder.fnc(Engine, c);
        }
    },

    // RoomHook for module.
    rHook : function (Engine, r) {
        let iCount = Engine.m['cUtility'].getCount(
            Engine,
            r.name,
            creepBuilder.role
        );
        let iMax = creepBuilder.limits[r.RoomLevel];
        if (iCount < iMax) {
            // should build
            Game.spawns[r.rSpawn[0]].spawnCreep(
                creepBuilder.body[r.RoomLevel],
                'Builder' + iCount + '--' +  Math.random().toString(36).substr(2, 9),
                {
                    memory : {
                        role: creepBuilder.role,
                        home: r.name,
                        module: creepBuilder.name
                    }
                }
            );
        }
    }
};
module.exports = creepBuilder;
