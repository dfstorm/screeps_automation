
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

        /* if (c.room.storage.store[RESOURCE_ENERGY] > 2000) {
          if (c.withdraw(c.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            c.moveTo(c.room.storage);
          }
        } else { */



        let bDropt = false;
        if (c.memory.savedSpot == null) {

            const targets = c.room.find(FIND_DROPPED_RESOURCES);
            if(targets.length) {
                for (let t in targets) {
                    if (targets[t].amount >= c.store.getFreeCapacity()){
                        bDropt = true;
                        if(c.pickup(targets[t]) == ERR_NOT_IN_RANGE) {
                            c.moveTo(targets[t]);
                        }
                    }
                }
            }}


        if (!bDropt) {
            if (cUtility.isAvailableSpot(Engine, c) && (c.memory.savedSpot == null || c.memory.savedSpot == undefined)) {
                cUtility.getMeASpot(Engine, c);
            } else {
                // No spot available or already
            }
        }




        if (c.memory.savedSpot != null) {

            //console.log("we are using a spot!");
            let source = Game.getObjectById(c.memory.sourceId);
            //console.log(source);
            c.harvest(source);
            c.moveTo(c.memory.savedSpot.x, c.memory.savedSpot.y);


        } else if(!bDropt) {
            var sources = c.room.find(FIND_SOURCES);
            if(c.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                c.moveTo(sources[0]);
            }
        }

        // }

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
