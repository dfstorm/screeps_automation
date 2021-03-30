var creepMover = {
  name: 'creepMover',
  role: 'mover',
  body: [
    [],
    [],
    [],
    [],
    [ // lvl4 (20x50 + 300)
      CARRY, CARRY, CARRY, CARRY,
      MOVE, MOVE
    ],
    [ // lvl 5 (30x50 + 300) 1800
      CARRY, CARRY, CARRY, CARRY, CARRY, // 500
      CARRY, CARRY, CARRY, CARRY, CARRY,
      CARRY, CARRY, CARRY, CARRY, CARRY, // 500
      CARRY, CARRY, CARRY, CARRY, CARRY,
      MOVE, MOVE, MOVE, MOVE, MOVE, // 500
      MOVE, MOVE, MOVE, MOVE, MOVE
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
    /*  Concept
     *  1- While I have no "task", drone around
     *  by fuelling the storage.
     * 
     * If a capacitor need energy, a task is created.
     * 
     * 1- To find the energy, looks for
     * 
     *    1- Dropped energy
     *    2- Containers
     *
     * 
     * */
    if (c.memory.task == undefined)
    {
      c.memory.task == null
    }
    
    // TODO: Add task attribution here ^^'
    
    if(c.store[RESOURCE_ENERGY] == 0) {
      c.memory.mode = -1;
    }
    
    if (c.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
      c.memory.mode = 1;
    }
    
    switch(c.memory.mode) {
      case -1:
        const target = c.pos.findClosestByRange(
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
        if (target != null) {
          c.memory.target = target.id;
          c.memory.mode = 0;
        }
        break ;
      case 0:
        if (c.memory.target == undefined || c.memory.target == null) {
          c.memory.mode = -1;
          break ;
        }
        const targetObj = Game.getObjectById(c.memory.target);
        if (targetObj == null) {
          c.memory.mode = -1;
          break ;
        }
        const oAction =  c.withdraw(targetObj, RESOURCE_ENERGY);
        switch(oAction) {
          case ERR_NOT_IN_RANGE:
            c.moveTo(targetObj);
            break;
          case OK:
          case ERR_FULL:
            c.memory.mode = 1;
            break;
          default:
            c.memory.mode = -1;
            break;
        }
        break ;
      case 1:
        const oActionBis = c.transfer(c.room.storage, RESOURCE_ENERGY);
        switch (oActionBis) {
          case ERR_NOT_IN_RANGE:
            c.moveTo(c.room.storage);
            break;
          case OK:
          case ERR_FULL:
            c.memory.mode = -1;
            break;
          default:
            c.memory.mode = -1;
            break;
        }
        break ;
      default:
        c.memory.mode = -1;
        break ;
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
