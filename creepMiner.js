var creepMiner = {
  name: 'creepMiner',
  role: 'miner',
  body: [
    [],
    [], // 200
    [], // 550
    [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE],
    [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE],
    [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE],
    [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE],
    [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE],
    [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE]
  ],
  limits: [0,0,0,2,2,2,2,2],

  workedSource: [],

  fnc: function (Engine, c) {
    Engine.m['cUtility'].addCount(
        Engine,
        c.memory.home,
        c.memory.role
    );

    if (c.memory.mode == null || c.memory.mode == undefined) {
      c.memory.mode = 0;
    }

    var rIndex = Engine.m['cUtility'].getRoomIndexFromName(c.room.name);
    var r = Memory.engine.rooms[rIndex];

    if (c.memory.sourceId != null && c.memory.sourceId != undefined) {
      creepMiner.workedSource.push(c.memory.sourceId);
      var oSource = Game.getObjectById(c.memory.sourceId);
    }

    switch (c.memory.mode) {
      case 0: // Clean up. If I am here, a creep died.
        c.memory.sourceId = null;
        for (let iS in r.rSources) {
          if (creepMiner.workedSource.indexOf(r.rSources[iS].id) < 0) {
            c.memory.sourceId = r.rSources[iS].id;
          }
        }
        if (c.memory.sourceId != null) {
          c.memory.mode = 1;
        } else {
          // Waiting for an empty place.
        }
        break ;
      case 1: // move to it.
        const path = c.pos.findPathTo(oSource, {ignoreCreeps: true});
        if(path.length > 1) {
          c.move(path[0].direction);
        } else {
          c.memory.mode = 2;
        }
        break;
      case 2: // arived.
        for (let iS in r.rSources) {
          if (r.rSources[iS].id == c.memory.sourceId) {
            for (let iSpot in r.rSources[iS].rSpot) {
              if (c.pos.x == r.rSources[iS].rSpot[iSpot].x && c.pos.y == r.rSources[iS].rSpot[iSpot].y) {
                r.rSources[iS].rSpot[iSpot].takenBy = c.id;
                r.rSources[iS].rSpot[iSpot].timeSince = c.ticksToLive + Game.time;
                c.memory.mode = 3;
              }
            }
          }
        }
        break;
      case 3: // put a storage ?
        let data = Game.rooms[c.room.name].lookAt(
            c.pos.x,
            c.pos.y
        );
        let bShouldBuild = false;
        for (let iB in data) {
          if (!(data[iB].type == "structure" || data[iB].type == "constructionSite")) {
            bShouldBuild = true;
          }
        }
        if (bShouldBuild) {
          Game.rooms[c.room.name].createConstructionSite(
              c.pos.x,
              c.pos.y,
              STRUCTURE_CONTAINER
          );
        }
        c.memory.mode = 4;
        break;
      case 4: // Working
        c.harvest(oSource);
        break;
    }


  },
  // creepHook for module
  cHook : function (Engine, c) {
    if (c.memory.role == creepMiner.role) {
      creepMiner.fnc(Engine, c);
    }
  },

  // RoomHook for module.
  rHook : function (Engine, r) {
    let iCount = Engine.m['cUtility'].getCount(
        Engine,
        r.name,
        creepMiner.role
    );
    let iMax = creepMiner.limits[r.RoomLevel];
    if (iCount < iMax) {
      Game.spawns[r.rSpawn[0]].spawnCreep(
          creepMiner.body[r.RoomLevel],
          'miner' + iCount + '--' +  Math.random().toString(36).substr(2, 9),
          {
            memory : {
              role: creepMiner.role,
              home: r.name,
              module: creepMiner.name
            }
          }
      );
    }
  }
};

module.exports = creepMiner;
