
var cUtility = {
    name: 'cUtility',
    getRoomIndexFromName : function(name) {
        let i = -1;
        while (++i < Memory.engine.rooms.length)
        {
            if (Memory.engine.rooms[i].name == name) {
                return i;
            }
        }
        return -1;
    },

    isAvailableSpot: function(Engine, c) {
        let rIndex = cUtility.getRoomIndexFromName(c.room.name);
        let r = Memory.engine.rooms[rIndex];
        for (iR in r.rSources) {
            for (iS in r.rSources[iR].rSpot) {
                if (r.rSources[iR].rSpot[iS].takenBy == null) {
                    return true;
                }
            }
        }
        return false;
    },

    getMeASpot: function(Engine, c) {
        let rIndex = cUtility.getRoomIndexFromName(c.room.name);
        let r = Memory.engine.rooms[rIndex];
        let path = null;
        let iRs = null;
        let iSs = null;

        if (c.memory.savedSpot == undefined || c.memory.savedSpot == null) {
            for (iR in r.rSources) {

                let oSource = Game.getObjectById(r.rSources[iR].id);

                let iAllReadyReserved = 0;
                for (iS in r.rSources[iR].rSpot) {
                    if (r.rSources[iR].rSpot[iS].takenBy != null) {
                        let creep = Game.getObjectById(r.rSources[iR].rSpot[iS].takenBy);
                        if (creep != null) {
                            iAllReadyReserved = iAllReadyReserved + creep.store.getFreeCapacity();
                        }

                    }
                }

                if ((oSource.energy - iAllReadyReserved) >= c.store.getFreeCapacity()) {
                    for (iS in r.rSources[iR].rSpot) {
                        if (r.rSources[iR].rSpot[iS].takenBy == null) {
                            let DestPos = new RoomPosition(
                                r.rSources[iR].rSpot[iS].x,
                                r.rSources[iR].rSpot[iS].y,
                                r.name
                            );
                            let oPath = PathFinder.search(c.pos, DestPos);
                            if (path == null || oPath.path.length < path.length) {
                                path = oPath.path;
                                iRs = iR;
                                iSs = iS;
                            }
                        }
                    }
                }


            }
        }
        if (path != null) {
            c.memory.savedSpot = r.rSources[iRs].rSpot[iSs];
            c.memory.sourceId = r.rSources[iRs].id;
            r.rSources[iRs].rSpot[iSs].takenBy = c.id;
            r.rSources[iRs].rSpot[iSs].timeSince = Game.time;
        }
    },

    clearMySpot: function(Engine, c) {
        let rIndex = cUtility.getRoomIndexFromName(c.room.name);
        let r = Memory.engine.rooms[rIndex];
        let bFound = false;
        for (iR in r.rSources) {
            for (iS in r.rSources[iR].rSpot) {
                if (r.rSources[iR].rSpot[iS].takenBy == c.id) {
                    bFound = true;
                    r.rSources[iR].rSpot[iS].takenBy = null;
                    r.rSources[iR].rSpot[iS].timeSince = null;
                }
            }
        }
        if (!bFound) {
            //console.log("Warning; Seat not found. Maybe was deleted by the safety");
        }
        c.memory.savedSpot = null;
        c.memory.sourceId = null;
    },


    findEnergy(Engine, c) {
        // Low CPU energy seek
        if (
            c.memory.findEnergy == undefined ||
            c.memory.findEnergy == null
        ) {
            c.memory.findEnergy = -1;
            c.memory.findEnergyTarget = null;
        }

        if (c.memory.findEnergyTarget == null && c.memory.savedSpot == null) {
            switch (c.memory.findEnergy) {
                case -1: // init
                    c.memory.findEnergy = 0;
                    break;
                case 0: // try main storage
                    if (c.room.storage == undefined || c.room.storage == null) {
                        c.memory.findEnergy++;
                    } else {
                        if (c.room.storage.store[RESOURCE_ENERGY] > (c.store.getCapacity() * 2)) {
                            c.memory.findEnergyTarget = c.room.storage.id;
                        } else {
                            c.memory.findEnergy++;
                        }
                    }
                    break ;
                case 1: // try a small container
                    const containersWithEnergy = c.pos.findClosestByRange(
                        FIND_STRUCTURES,
                        {
                            filter: (i) =>
                                i.structureType == STRUCTURE_CONTAINER &&
                                i.store[
                                    RESOURCE_ENERGY
                                    ] >= c.store.getFreeCapacity(
                                RESOURCE_ENERGY
                                )
                        }
                    );
                    // console.log(containersWithEnergy);
                    if (containersWithEnergy != null) {
                        c.memory.findEnergyTarget = containersWithEnergy.id;
                    } else {
                        c.memory.findEnergy++;
                    }
                    break ;
                case 2: // try a dropped resource
                    const targets = c.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
                    if(targets != null) {
                        c.memory.findEnergyTarget = targets.id;
                    } else {
                        c.memory.findEnergy++;
                    }
                    break ;
                case 3: // try a spot
                    if (cUtility.isAvailableSpot(Engine, c) && (c.memory.savedSpot == null || c.memory.savedSpot == undefined)) {
                        cUtility.getMeASpot(Engine, c);
                    } else {
                        c.memory.findEnergy++;
                    }
                    break ;
                default: // reload.
                    c.memory.findEnergy = 0;
                    break ;
            }
        } else {
            if (c.memory.savedSpot != null) {
                let source = Game.getObjectById(c.memory.sourceId);
                c.harvest(source);
                c.moveTo(c.memory.savedSpot.x, c.memory.savedSpot.y);
            } else {
                let oDest = Game.getObjectById(c.memory.findEnergyTarget);
                let oAction = null;
                if (c.memory.findEnergy === 0 || c.memory.findEnergy === 1) {
                    // withdraw
                    oAction = c.withdraw(oDest, RESOURCE_ENERGY);
                } else if (c.memory.findEnergy === 2) {
                    oAction = c.pickup(oDest, RESOURCE_ENERGY);
                }
                if (oAction == -9) {
                    c.moveTo(oDest);
                } else {
                    c.memory.findEnergyTarget = null;
                    c.memory.findEnergy = -1;
                }
            }
        }

        if (c.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            c.memory.findEnergyTarget = null;
            c.memory.findEnergy = -1;
        }

    },
    addCount : function (Engine, room, role) {
        //console.log("+1 to " + room + "for unit " + role);
        if (cUtility.rLimits[room] == undefined) {
            cUtility.rLimits[room] = [];
        }
        cUtility.rLimits[room].push(role)
    },
    getCount: function (Engine, room, role) {
        if (cUtility.rLimits[room] == undefined) {
            console.log("no index for " + room);
            return 0;
        }
        let iCount = 0;
        let i = -1;

        while (++i < cUtility.rLimits[room].length) {
            if (cUtility.rLimits[room][i] == role) {
                iCount++;
            }
        }
        return iCount;
    },
    rLimits: []
};

module.exports = cUtility;
