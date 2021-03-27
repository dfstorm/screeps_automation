var creepMover = {
  name: 'creepMover',
  role: 'mover',
  body: [
    [],
    [],
    [],
    [],
    [ // lvl4
      CARRY, CARRY, CARRY, CARRY,
      MOVE, MOVE
    ],
    [ // lvl 5
      CARRY, CARRY, CARRY, CARRY,
      MOVE, MOVE
    ],
    [ // lvl6 2300
      CARRY, CARRY, CARRY, CARRY, CARRY,
      CARRY, CARRY, CARRY, CARRY, CARRY, // 500
      MOVE, MOVE, MOVE, MOVE, MOVE,
      CARRY, CARRY, CARRY, CARRY, CARRY, // 500
      CARRY, CARRY, CARRY, CARRY, CARRY,
      MOVE, MOVE, MOVE, MOVE, MOVE,       // 500
      CARRY, CARRY, CARRY, CARRY, CARRY,
      CARRY, CARRY, CARRY, CARRY, CARRY, // 500
      MOVE, MOVE, MOVE, MOVE, MOVE // 250
    ],
    [ // lvl7
      CARRY, CARRY, CARRY, CARRY,
      MOVE, MOVE
    ],
    [ // lvl8
      CARRY, CARRY, CARRY, CARRY,
      MOVE, MOVE
    ]
  ],
  limits: [0,0,0,0,1,1,1,1,1],
  fnc: function (Engine, c) {
    Engine.m['cUtility'].addCount(
        Engine,
        c.memory.home,
        c.memory.role
    );

    if (c.memory.mode == 0) {
      switch (c.memory.seek) {
        case 0:
          let nfound =  false;
          // Is there a capacitor needed energy ?
          if (c.room.storage.store[RESOURCE_ENERGY] > c.store.getCapacity()) {

            let oTarget = c.pos.findClosestByRange(FIND_MY_STRUCTURES, {
              filter: (structure) => {
                return (
                    (
                        structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN
                    ) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                );
              }
            });
            if (oTarget) {
              c.memory.sOrigin = c.room.storage.id;
              c.memory.sDestination = oTarget.id;
              if (c.store.getUsedCapacity() > 0) {
                c.memory.mode = 2;
              } else {
                c.memory.mode = 1;
              }
            } else {
              nfound = true;
            }
          } else {
            nfound = true;
          }
          if (nfound == true) {
            c.memory.seek++;
          }
          break;
        case 1:
          // Look if a container need empying
          //
          if (
              c.room.storage == null ||
              c.room.storage == undefined
          ) {
            // No storage
            c.memory.seek++;
          } else {
            const containersWithEnergy = c.room.find(
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
            //console.log(containersWithEnergy);
            if (containersWithEnergy.length > 0) {
              c.memory.sOrigin = containersWithEnergy[0].id;
              c.memory.sDestination = c.room.storage.id;
              if (c.store.getUsedCapacity() > 0) {
                c.memory.mode = 2;

              } else {
                c.memory.mode = 1;
              }
            } else {
              c.memory.seek++;
            }
          }
          break;
        default:
          c.memory.seek = 0;
          break;
      }
    } else {
      c.memory.seek = 0;
    }
    let oAction = 0;

    switch (c.memory.mode) {
      case 1:
        // take it from container
        oDest = Game.getObjectById(c.memory.sOrigin);
        oAction = c.withdraw(oDest, RESOURCE_ENERGY);
        switch(oAction) {
          case ERR_NOT_IN_RANGE:
            c.moveTo(oDest);
            break;
          case OK:
          case ERR_FULL:
            c.memory.mode = 2;
            break;
          default:
            c.memory.mode = 0;
            break;
        }
        break;
      case 2:
        // put it in container
        oDest = Game.getObjectById(c.memory.sDestination);
        oAction = c.transfer(oDest, RESOURCE_ENERGY);
        switch (oAction) {
          case ERR_NOT_IN_RANGE:
            c.moveTo(oDest);
            break;
          case OK:
          case ERR_FULL:
            c.memory.mode = 0;
            c.memory.seek = 0;
            break;
          default:
            c.memory.mode = 0;
            break;
        }

        break ;
      default:
        c.memory.mode = 0;
        break;
    }
  },
  cHook: function (Engine, c) {
    if (c.memory.role == creepMover.role) {
      creepMover.fnc(Engine, c);
    }
  },
  rHook: function (Engine, r) {
    if (
        Game.rooms[r.name].storage != null &&
        Game.rooms[r.name].storage != null
    ) {
      // Only is there is a storage active.
      let iCount = Engine.m['cUtility'].getCount(
          Engine,
          r.name,
          creepMover.role
      );
      let iMax = creepMover.limits[r.RoomLevel];
      if (iCount < iMax) {
        Game.spawns[r.rSpawn[0]].spawnCreep(
            creepMover.body[r.RoomLevel],
            'mover' + iCount + '--' +  Math.random().toString(36).substr(2, 9),
            {
              memory : {
                role: creepMover.role,
                home: r.name,
                module: creepMover.name
              }
            }
        );
      }
    }
  }

};

module.exports = creepMover;
