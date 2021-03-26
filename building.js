
var building = {
  name: 'building',

  /*
  Since I'm trying to get an "organic" buidling engine, each buidling is
  referenced here.

  It shoud be an array or array, by room.
  When we want a new building, we add an
  item into the room memory. Then a script looking at this
  memory will put the contruction site if needed.

  Then if a construction site is detected, a builder spawn.

  */

  buildingLimits : [
    null,
    null,
    [ // lvl 2
      {t: STRUCTURE_EXTENSION, n: 5}
    ],
    [ // lvl 3
      {t: STRUCTURE_EXTENSION, n: 10},
      {t: STRUCTURE_TOWER, n: 1}
    ],
    [ // lvl 4
      {t: STRUCTURE_EXTENSION, n: 20},
      {t: STRUCTURE_TOWER, n: 1},
      {t: STRUCTURE_STORAGE, n: 1}
    ],
    [ // lvl 5
      {t: STRUCTURE_EXTENSION, n: 30},
      {t: STRUCTURE_TOWER, n: 2},
      {t: STRUCTURE_STORAGE, n: 1}
    ],
    [ // lvl 6
      {t: STRUCTURE_EXTENSION, n: 40},
      {t: STRUCTURE_TOWER, n: 2},
      {t: STRUCTURE_STORAGE, n: 1},
      {t: STRUCTURE_TERMINAL, n: 1}
    ],
    [ // lvl 7
      {t: STRUCTURE_EXTENSION, n: 50},
      {t: STRUCTURE_TOWER, n: 3},
      {t: STRUCTURE_STORAGE, n: 1},
      {t: STRUCTURE_TERMINAL, n: 1}
    ],
    [ // lvl8
      {t: STRUCTURE_EXTENSION, n: 60},
      {t: STRUCTURE_TOWER, n: 6},
      {t: STRUCTURE_STORAGE, n: 1},
      {t: STRUCTURE_TERMINAL, n: 1}
    ]
  ],

  buildingTypes: [
    STRUCTURE_EXTENSION,
    STRUCTURE_TOWER,
    STRUCTURE_STORAGE,
    STRUCTURE_TERMINAL
  ],

  refrechBuildingList: function (Engine, r) {
    if (r.rBatiments == null || r.rBatiments == undefined){
      r.rBatiments = [];
    }
    if (r.RoomLevel < Game.rooms[r.name].controller.level)
    {
      let rRef = [];
      // Set a counter for each type of building
      for (let i in building.buildingTypes) {
        rRef[building.buildingTypes[i]] = 0;
      }
      // Set the right amount of suported buidling by room level'ish.
      for (let l in building.buildingLimits[r.RoomLevel + 1]) {
        rRef[building.buildingLimits[r.RoomLevel + 1][l].t] = building.buildingLimits[r.RoomLevel + 1][l].n;
      }
      // Remove already put buidling.
      if (r.rBatiments.length > 0) {
        for (let b in r.rBatiments) {
          rRef[r.rBatiments[b].t]--;
        }
      }
      // Populaire batiment memory with missing items.
      for (let type in rRef) {
        while (rRef[type] > 0) {
          r.rBatiments.push({
            t: type,
            s: 0, // 0: Init. 1: Place found, 2: Contruction site, 3: Built.
            x: 0,
            y: 0
          });
          rRef[type]--;
        }

      }
    }
  },

  isCrossingRoad: function (Engine, r, x, y) {
    if (r.rRoadPath != undefined) {
      for (let rO in r.rRoadPath) {
        if (r.rRoadPath[rO].x == x && r.rRoadPath[rO].y == y) {
          if (r.rRoadPath[rO].d != "storage") {
            return true;
          }
        }
      }
    }
    return false;
  },

  isAroundMiningSpot: function (Engine, r, x, y) {
    for (iR in r.rSources) {
      for (iS in r.rSources[iR].rSpot) {
        let rMSpot = building.lookAround(
            Engine,
            r,
            r.rSources[iR].rSpot[iS].x,
            r.rSources[iR].rSpot[iS].y
        );
        for (let inner in rMSpot) {
          if (rMSpot[inner].x == x && rMSpot[inner].y == y) {
            return true;
          }
        }
      }
    }
    return false;
  },


  isOnBuilding: function (Engine, r, x, y) {
    for (let b in r.rBatiments) {
      if (r.rBatiments[b].s > 0 && r.rBatiments[b].x == x && r.rBatiments[b].y == y) {
        return true;
      }
    }
    return false;
  },

  /*
    1- Must be reacheable (Path finding)
    2- Should be in groups
    3- Should be close to the spawn and storage.


  */

  findExtentionPlacement: function (Engine, r) {


    let iRange = 2;
    let MaxRange = 13;
    let oPos = null;

    let iXMin;
    let iXMax;
    let iYMin;
    let iYMax;
    let iX;
    let iY;

    let iSX = Game.spawns[r.rSpawn[0]].pos.x;
    let iSY = Game.spawns[r.rSpawn[0]].pos.y;

    let iStep = 0;
    let iInterval = 2;
    while (iRange < MaxRange && oPos == null) {
      iYMin = iSY - iRange;
      iYMax = iSY + iRange;
      iXMin = iSX - iRange;
      iXMax = iSX + iRange;
      iY = iYMin;
      while (iY >= iYMin && iY <= iYMax && oPos == null) {
        iX = iXMin;
        while (iX >= iXMin && iX <= iXMax && oPos == null) {
          if (iX >= iSX - (iRange - 1) && iX <= iSX + (iRange - 1) && iY >= iSY - (iRange - 1) && iY <= iSY + (iRange - 1)) {
            // inner range
          } else {
            if (building.getAt(r.rMap, iX, iY) != 1) {
              if (
                  !building.isCrossingRoad(Engine, r, iX ,iY) &&
                  !building.isAroundMiningSpot(Engine, r, iX ,iY)

              ) {
                if (++iStep > iInterval) {
                  iStep = 0;
                } else {
                  if (
                      building.lookAround(Engine, r, iX, iY).length == 9 &&
                      !building.isOnBuilding(Engine, r, iX, iY)
                  ) {

                    new RoomVisual(r.name).circle(
                        iX,
                        iY,
                        {
                          fill: 'transparent',
                          radius: 0.5,
                          fill: "blue"
                        }
                    );

                    oPos = {
                      x: iX,
                      y: iY
                    };
                  }
                }
              }
            }
          }
          iX++;
        }
        iY++;
      }
      iRange++;
    }
    return oPos;


  },

  findExtentionPlacementView: function (Engine, r, bi) {
    let iRange = 2;
    let MaxRange = 13;
    let oPos = null;

    let iXMin;
    let iXMax;
    let iYMin;
    let iYMax;
    let iX;
    let iY;

    let iSX = Game.spawns[r.rSpawn[0]].pos.x;
    let iSY = Game.spawns[r.rSpawn[0]].pos.y;

    let iStep = 0;
    let iInterval = 2;
    while (iRange < MaxRange && oPos == null) {
      iYMin = iSY - iRange;
      iYMax = iSY + iRange;
      iXMin = iSX - iRange;
      iXMax = iSX + iRange;
      iY = iYMin;
      while (iY >= iYMin && iY <= iYMax && oPos == null) {
        iX = iXMin;
        while (iX >= iXMin && iX <= iXMax && oPos == null) {
          if (iX >= iSX - (iRange - 1) && iX <= iSX + (iRange - 1) && iY >= iSY - (iRange - 1) && iY <= iSY + (iRange - 1)) {
            // inner range
          } else {
            if (building.getAt(r.rMap, iX, iY) != 1) {
              if (
                  !building.isCrossingRoad(Engine, r, iX ,iY) &&
                  !building.isAroundMiningSpot(Engine, r, iX ,iY)
                  // !building.isOnBuilding(Engine, r, iX, iY)
              ) {
                if (++iStep > iInterval) {
                  iStep = 0;
                } else {
                  if (building.lookAround(Engine, r, iX, iY).length == 9) {

                    new RoomVisual(r.name).circle(
                        iX,
                        iY,
                        {
                          fill: 'transparent',
                          radius: 0.5,
                          fill: "blue"
                        }
                    );
                  }
                }
              }
            }
          }
          iX++;
        }
        iY++;
      }
      iRange++;
    }

  },

  /*
    0: Building needed
    1: Location found
    2: Construction site placed
    3: Buidling built

  */
  findBuildSpace: function(Engine, r) {
    //r.rBatiments = [];
    building.refrechBuildingList(Engine, r);

    for (let b in r.rBatiments) {

      // watcher
      if (r.rBatiments[b].s > 0) {
        /*switch (r.rBatiments[b].t) {
          case STRUCTURE_EXTENSION:
            building.findExtentionPlacement(Engine, r, b);
            break;
        }*/
        let data = Game.spawns[r.rSpawn[0]].room.lookAt(
            r.rBatiments[b].x,
            r.rBatiments[b].y
        );
        let bF = false;
        for (let d in data) {
          if (r.rBatiments[b].s == 2 && data[d].type == "structure") {
            r.rBatiments[b].s = 3;
            bF = true;
          } else if (r.rBatiments[b].s == 2 && data[d].type == "constructionSite") {
            // keep going...
            bF = true;
          }
          if (!bF && r.rBatiments[b].s == 2) {
            // something happen. rebuld.
            r.rBatiments[b].s = 0;
          }

        }
      }

    }



    for (let b in r.rBatiments) {
      if (r.rBatiments[b].s == 0) {
        let oPos = null;
        switch (r.rBatiments[b].t) {
          case STRUCTURE_EXTENSION:
          case STRUCTURE_TOWER:
          case STRUCTURE_STORAGE:
          case STRUCTURE_TERMINAL:
            oPos = building.findExtentionPlacement(Engine, r, b);
            break;
        }
        if (oPos != null) {
          r.rBatiments[b].x = oPos.x;
          r.rBatiments[b].y = oPos.y;
          r.rBatiments[b].s = 1;

        }
        break ;
      }
    }

    let count = 0;
    for (let b in r.rBatiments) {
      if (r.rBatiments[b].s == 2) {
        count++;
      }
    }

    if (count == 0)
      for (let b in r.rBatiments) {
        if (r.rBatiments[b].s == 1) {
          r.rBatiments[b].s = 2;
          Game.rooms[r.name].createConstructionSite(
              r.rBatiments[b].x,
              r.rBatiments[b].y,
              r.rBatiments[b].t
          );
          break ;
        }
      }


  },

  getRoomControlLevelByEnergy: function(Engine, r) {
    let energy = Game.rooms[r.name].energyCapacityAvailable;
    let lvl = Game.rooms[r.name].controller.level;
    if (r.RoomLevel == undefined || r.RoomLevel == null) {
      r.RoomLevel = 0;
    }

    if (energy >= 2300 && lvl >= 6) {
      r.RoomLevel = 6;
    } else if (energy >= 1800 && lvl >= 5) {
      r.RoomLevel = 5;
    } else if (energy >= 1300 && lvl >= 4) {
      r.RoomLevel = 4;
    } else if (energy >= 800 && lvl >= 3) {
      r.RoomLevel = 3;
    } else if (energy >= 550 && lvl >= 2) {
      r.RoomLevel = 2;
    } else if (energy >= 300 && lvl >= 1) {
      // Buidling lvl 1 items.
      r.RoomLevel = 1;
    }

    return r.RoomLevel;
  },


  // Return type of terrain from a buffer for x,y
  getAt : function(buffer, x,y) {
    let pos = (y * 50) + x;
    return buffer[pos];
  },

  // Get rawbuffer data of asked room
  mapRoom: function (Engine, r) {
    const roomTerrain = Game.map.getRoomTerrain(r.name);
    r.rMap = roomTerrain.getRawBuffer();
  },

  planRoadForStorage: function (Engine, r) {
    if (r.rRoadPath == undefined) {
      return ;
    }

    if (
        Game.rooms[r.name].storage == null ||
        Game.rooms[r.name].storage == undefined
    ) {
      return ;
    }
    let isAlreadySet = false;
    for (let rp in r.rRoadPath) {
      if (r.rRoadPath[rp].d == "storage") {
        isAlreadySet = true;
      }
    }
    if (isAlreadySet) {
      return ;
    }
    let dest = new RoomPosition(
        Game.rooms[r.name].storage.pos.x,
        Game.rooms[r.name].storage.pos.y,
        r.name
    );
    let path = null;
    for (let rp in r.rRoadPath) {
      let origin = new RoomPosition(
          r.rRoadPath[rp].x,
          r.rRoadPath[rp].y,
          r.name
      );
      let oPath = PathFinder.search(origin, dest);
      if (path == null || oPath.path.length < path.length) {
        path = oPath.path;
      }
    }
    if (path != null) {
      path.pop();
      for (let p in path) {
        new RoomVisual(r.name).circle(
            path[p].x,
            path[p].y,
            {
              fill: 'transparent',
              radius: 0.5,
              fill: "gray"
            }
        );
        if (path[p].x > 0 && path[p].x < 49 && path[p].y > 0 && path[p].y < 49) {
          r.rRoadPath.push({
            x: path[p].x,
            y: path[p].y,
            d: "storage"
          });
        }
      }
    }

  },

  planExitRoads: function (Engine, r) {
    if (r.rRoadPath == undefined) {
      return ;
    }


    let exits = Game.map.describeExits(r.name);
    for (let e in exits) {
      const exitDir = Game.map.findExit(r.name, exits[e]);
      const sExit = Game.spawns[r.rSpawn[0]].room.find(exitDir);
      let path = null;
      for (let rp in r.rRoadPath) {
        let origin = new RoomPosition(
            r.rRoadPath[rp].x,
            r.rRoadPath[rp].y,
            r.name
        );
        let oPath = PathFinder.search(origin, sExit);
        if (path == null || oPath.path.length < path.length) {
          path = oPath.path;
        }
      }
      if (path != null) {
        for (let p in path) {

          new RoomVisual(r.name).circle(
              path[p].x,
              path[p].y,
              {
                fill: 'transparent',
                radius: 0.5,
                fill: "gray"
              }
          );
          console.log(path[p].x + ":" + path[p].y + "|" + exits[e]);
          if (path[p].x > 0 && path[p].x < 49 && path[p].y > 0 && path[p].y < 49) {
            r.rRoadPath.push({
              x: path[p].x,
              y: path[p].y,
              d: exits[e]
            });
          }
        }
      }
    }
  },

  planControllerRoad: function(Engine, r) {
    if (r.rRoadPath == undefined) {
      return ;
    }

    let dest = new RoomPosition(
        Game.rooms[r.name].controller.pos.x,
        Game.rooms[r.name].controller.pos.y,
        r.name
    );
    let path = null;
    for (let rp in r.rRoadPath) {
      let origin = new RoomPosition(
          r.rRoadPath[rp].x,
          r.rRoadPath[rp].y,
          r.name
      );
      let oPath = PathFinder.search(origin, dest);
      if (path == null || oPath.path.length < path.length) {
        path = oPath.path;
      }
    }

    if (path != null) {
      path.pop();
      path.pop();
      for (let p in path) {
        new RoomVisual(r.name).circle(
            path[p].x,
            path[p].y,
            {
              fill: 'transparent',
              radius: 0.5,
              fill: "gray"
            }
        );
        r.rRoadPath.push({
          x: path[p].x,
          y: path[p].y,
          d: 'c'
        });
      }
    }
    building.planExitRoads(Engine, r);
  },

  // Plan link betwen ressources of the room.
  planRoadPath: function(Engine, r) {
    if (r.rSources == undefined || (r.rRoadPath != undefined && r.rRoadPath != null)) {
      return ;
    }
    let SpawnPos = Game.spawns[r.rSpawn[0]].pos;

    r.rRoadPath = [];

    for (let iS in r.rSources) {
      let rPath = null;

      for (let iSp in r.rSources[iS].rSpot) {
        let DestPos = new RoomPosition(
            r.rSources[iS].rSpot[iSp].x,
            r.rSources[iS].rSpot[iSp].y,
            r.name
        );
        let oPath = PathFinder.search(SpawnPos, DestPos);
        if ((rPath == null || oPath.path.length < rPath.length) && !oPath.incomplete) {
          rPath = oPath.path;
        }
      }
      rPath.pop();
      for (let p in rPath) {
        new RoomVisual(r.name).circle(
            rPath[p].x,
            rPath[p].y,
            {
              fill: 'transparent',
              radius: 0.5,
              fill: "gray"
            }
        );

        r.rRoadPath.push({
          x: rPath[p].x,
          y: rPath[p].y,
          d: r.rSources[iS].id
        });


      }
    }
    building.planControllerRoad(Engine, r);
  },

  /*
  . . . . . .
  . x x * * .
  . . x # * .
  . . x x x .
  . . . . . .
  */
  lookAround : function (Engine, r, x, y) {
    let iXMin = x - 1;
    let iXMax = x + 1;
    let iYMin = y - 1;
    let iYMax = y + 1;

    let rReturn = [];

    let iY = iYMin;
    while (iY >= iYMin && iY <= iYMax) {
      let iX = iXMin;
      while (iX >= iXMin && iX <= iXMax) {
        if (r.rMap[(iY * 50) + iX] == 0 || r.rMap[(iY * 50) + iX] == 2) {
          rReturn.push({
            x: iX,
            y: iY
          });
        }
        iX++;
      }
      iY++;
    }
    return rReturn;
  },

  autoCleanSpot: function(Engine, r) {
    let iMaxTime = Game.time - 100;
    for (let iS in r.rSources) {
      for (let iSp in r.rSources[iS].rSpot) {
        if (r.rSources[iS].rSpot[iSp].timeSince < iMaxTime) {
          r.rSources[iS].rSpot[iSp].timeSince = null;
          r.rSources[iS].rSpot[iSp].takenBy = null;
        }
      }
    }

  },

  // Get room sources
  getRoomSources: function (Engine, r) {

    r.rSources = [];
    let rSource = Game.spawns[r.rSpawn[0]].room.find(FIND_SOURCES);
    for (let s in rSource) {
      let oSource = Game.getObjectById(rSource[s].id);
      let rAvailableSpot = building.lookAround(
          Engine,
          r,
          oSource.pos.x,
          oSource.pos.y
      );
      let rResSpot = [];
      for (ras in rAvailableSpot) {
        let oSpot = {
          x: rAvailableSpot[ras].x,
          y: rAvailableSpot[ras].y,
          takenBy: null,
          timeSince: null
        };
        rResSpot.push(oSpot);
      }
      let sourceModel = {
        id: oSource.id,
        pos: {
          x: oSource.pos.x,
          y: oSource.pos.y
        },
        rSpot: rResSpot
      };
      r.rSources.push(sourceModel);
    }
  },

  displaySpots : function(Engine, r) {

    if (r.rSources != undefined) {

      for (let rs in r.rSources) {

        for (let s in r.rSources[rs].rSpot) {
          let color = "green";
          if (r.rSources[rs].rSpot[s].takenBy != null) {
            color = "blue";
          }
          new RoomVisual(r.name).circle(
              r.rSources[rs].rSpot[s].x,
              r.rSources[rs].rSpot[s].y,
              {
                fill: 'transparent',
                radius: 0.5,
                fill: color
              }
          );
        }
      }
    }
  },

  displayRoads: function (Engine, r) {
    if (r.rRoadPath != undefined) {
      for (let rO in r.rRoadPath) {
        new RoomVisual(r.name).circle(
            r.rRoadPath[rO].x,
            r.rRoadPath[rO].y,
            {
              fill: 'transparent',
              radius: 0.5,
              fill: "gray"
            }
        );
      }
    }
  },

  displayBluildings: function (Engine, r) {
    if (r.rBatiments != undefined) {
      for (let rO in r.rBatiments) {
        if (r.rBatiments[rO].s > 0) {
          new RoomVisual(r.name).circle(
              r.rBatiments[rO].x,
              r.rBatiments[rO].y,
              {
                fill: 'transparent',
                radius: 0.5,
                fill: "yellow"
              }
          );
        }
      }
    }
  },

  planWalls: function (Engine, r) {
    // Only after path and storage
    if (
        r.rRoadPath == null ||
        r.rRoadPath == undefined ||
        Game.rooms[r.name].storage == null ||
        Game.rooms[r.name].storage == undefined
    ) {
      return ;
    }

    if (!(r.rWalls == null || r.rWalls == undefined)) {
      // already done.
      return ;
    }

    let rWalls = [];

    // top
    let x;
    let y;
// isCrossingRoad
//building.getAt
//r.rMap
    x = -1;
    y = 0;
    let rCorners = [];
    while (++x < 50) {
      let t = building.getAt(r.rMap, x, y);
      if (t == 0) {
        // detect corner
        if (building.getAt(r.rMap, x - 1, y) == 1) {
          rCorners = [];
          rCorners.push({
            x: x - 2,
            y: y + 1
          });
          rCorners.push({
            x: x - 2,
            y: y + 2
          });
          rCorners.push({
            x: x - 1,
            y: y + 2
          });
          for (let co in rCorners) {
            let ter = building.getAt(
                r.rMap,
                rCorners[co].x,
                rCorners[co].y
            );
            if (
                ter != 1 &&
                !building.isCrossingRoad(
                    Engine,
                    r,
                    rCorners[co].x,
                    rCorners[co].y
                )
            ) {
              rWalls.push({x: rCorners[co].x, y: rCorners[co].y});
            }
          }
        }

        if (building.getAt(r.rMap, x + 1, y) == 1) {
          rCorners = [];
          rCorners.push({
            x: x + 2,
            y: y + 1
          });
          rCorners.push({
            x: x + 2,
            y: y + 2
          });
          rCorners.push({
            x: x + 1,
            y: y + 2
          });
          for (let co in rCorners) {
            let ter = building.getAt(
                r.rMap,
                rCorners[co].x,
                rCorners[co].y
            );
            if (ter != 1 && !building.isCrossingRoad(
                Engine,
                r,
                rCorners[co].x,
                rCorners[co].y
            )) {
              rWalls.push({x: rCorners[co].x, y: rCorners[co].y});
            }
          }
        }

        let d = building.getAt(r.rMap, x, y + 2);
        if (
            d != 1 &&
            !building.isCrossingRoad(
                Engine,
                r,
                x,
                y + 2
            )
        ) {
          rWalls.push({x: x, y: y + 2});
        }
      }
    }
    x = 0;
    y = 49;
    while (++x < 50) {
      let t = building.getAt(r.rMap, x, y);
      if (t == 0) {
        // detect corner
        if (building.getAt(r.rMap, x - 1, y) == 1) {
          rCorners = [];
          rCorners.push({
            x: x - 2,
            y: y - 1
          });
          rCorners.push({
            x: x - 2,
            y: y - 2
          });
          rCorners.push({
            x: x - 1,
            y: y - 2
          });
          for (let co in rCorners) {
            let ter = building.getAt(
                r.rMap,
                rCorners[co].x,
                rCorners[co].y
            );
            if (
                ter != 1 &&
                !building.isCrossingRoad(
                    Engine,
                    r,
                    rCorners[co].x,
                    rCorners[co].y
                )
            ) {
              rWalls.push({x: rCorners[co].x, y: rCorners[co].y});
            }
          }
        }

        if (building.getAt(r.rMap, x + 1, y) == 1) {
          rCorners = [];
          rCorners.push({
            x: x + 2,
            y: y - 1
          });
          rCorners.push({
            x: x + 2,
            y: y - 2
          });
          rCorners.push({
            x: x + 1,
            y: y - 2
          });
          for (let co in rCorners) {
            let ter = building.getAt(
                r.rMap,
                rCorners[co].x,
                rCorners[co].y
            );
            if (ter != 1 && !building.isCrossingRoad(
                Engine,
                r,
                rCorners[co].x,
                rCorners[co].y
            )) {
              rWalls.push({x: rCorners[co].x, y: rCorners[co].y});
            }
          }
        }

        let d = building.getAt(r.rMap, x, y - 2);
        if (
            d != 1 &&
            !building.isCrossingRoad(
                Engine,
                r,
                x,
                y - 2
            )
        ) {
          rWalls.push({x: x, y: y - 2});
        }
      }
    }

    x = 0;
    y = 0;
    while (++y < 50) {
      let t = building.getAt(r.rMap, x, y);
      if (t == 0) {
        // detect corner
        if (building.getAt(r.rMap, x, y - 1) == 1) {
          rCorners = [];
          rCorners.push({
            x: x + 1,
            y: y - 2
          });
          rCorners.push({
            x: x + 2,
            y: y - 2
          });
          rCorners.push({
            x: x + 2,
            y: y - 1
          });
          for (let co in rCorners) {
            let ter = building.getAt(
                r.rMap,
                rCorners[co].x,
                rCorners[co].y
            );
            if (
                ter != 1 &&
                !building.isCrossingRoad(
                    Engine,
                    r,
                    rCorners[co].x,
                    rCorners[co].y
                )
            ) {
              rWalls.push({x: rCorners[co].x, y: rCorners[co].y});
            }
          }
        }

        if (building.getAt(r.rMap, x, y + 1) == 1) {
          rCorners = [];
          rCorners.push({
            x: x + 1,
            y: y + 2
          });
          rCorners.push({
            x: x + 2,
            y: y + 2
          });
          rCorners.push({
            x: x + 2,
            y: y + 1
          });
          for (let co in rCorners) {
            let ter = building.getAt(
                r.rMap,
                rCorners[co].x,
                rCorners[co].y
            );
            if (ter != 1 && !building.isCrossingRoad(
                Engine,
                r,
                rCorners[co].x,
                rCorners[co].y
            )) {
              rWalls.push({x: rCorners[co].x, y: rCorners[co].y});
            }
          }
        }

        let d = building.getAt(r.rMap, x + 2, y);
        if (
            d != 1 &&
            !building.isCrossingRoad(
                Engine,
                r,
                x + 2,
                y
            )
        ) {
          rWalls.push({x: x + 2, y: y});
        }
      }
    }

    x = 49;
    y = 0;
    while (++y < 50) {
      let t = building.getAt(r.rMap, x, y);
      if (t == 0) {
        // detect corner
        if (building.getAt(r.rMap, x, y - 1) == 1) {
          rCorners = [];
          rCorners.push({
            x: x - 1,
            y: y - 2
          });
          rCorners.push({
            x: x - 2,
            y: y - 2
          });
          rCorners.push({
            x: x - 2,
            y: y - 1
          });
          for (let co in rCorners) {
            let ter = building.getAt(
                r.rMap,
                rCorners[co].x,
                rCorners[co].y
            );
            if (
                ter != 1 &&
                !building.isCrossingRoad(
                    Engine,
                    r,
                    rCorners[co].x,
                    rCorners[co].y
                )
            ) {
              rWalls.push({x: rCorners[co].x, y: rCorners[co].y});
            }
          }
        }

        if (building.getAt(r.rMap, x, y + 1) == 1) {
          rCorners = [];
          rCorners.push({
            x: x - 1,
            y: y + 2
          });
          rCorners.push({
            x: x - 2,
            y: y + 2
          });
          rCorners.push({
            x: x - 2,
            y: y + 1
          });
          for (let co in rCorners) {
            let ter = building.getAt(
                r.rMap,
                rCorners[co].x,
                rCorners[co].y
            );
            if (ter != 1 && !building.isCrossingRoad(
                Engine,
                r,
                rCorners[co].x,
                rCorners[co].y
            )) {
              rWalls.push({x: rCorners[co].x, y: rCorners[co].y});
            }
          }
        }

        let d = building.getAt(r.rMap, x - 2, y);
        if (
            d != 1 &&
            !building.isCrossingRoad(
                Engine,
                r,
                x - 2,
                y
            )
        ) {
          rWalls.push({x: x - 2, y: y});
        }
      }
    }

    for (let w in rWalls) {
      new RoomVisual(r.name).circle(
          rWalls[w].x,
          rWalls[w].y,
          {
            fill: 'transparent',
            radius: 0.5,
            fill: "yellow"
          }
      );
    }
    r.rWalls = rWalls;
  },

  // Entry Hook. Run for each owned room.
  rHook : function (Engine, r) {
    if (r.rMap.length == 0)
    {
      building.mapRoom(Engine, r);
      return ;
    }
    if (r.rSources == undefined) {
      building.getRoomSources(Engine, r);
    }

    //r.rRoadPath = null;


    building.planRoadPath(Engine, r);


    // building.displaySpots(Engine, r);
    // building.displayRoads(Engine, r);
    //if (Game.time % 10) {
    building.autoCleanSpot(Engine, r);
    //}


    building.getRoomControlLevelByEnergy(Engine, r);

    building.findBuildSpace(Engine, r);

    building.planRoadForStorage(Engine, r);
    // building.findExtentionPlacementView(Engine, r);

    //building.displayBluildings(Engine, r);

    building.planWalls(Engine, r);
    //building.removeRoadExtrimities(Engine, r);
    /*
        1- Get the raw data to be able to analyze the map.
        2- Evaluate the best path to access ressources and set road for them
        3- Build around this road.

        A creep must have an easy way to
            Storage ==> capacitor
                    ==> spawn
                    ==> Labs
                    ==> Towers

            Mineral ==> Storage
            Lab     ==> Storage

        Donc, un point de départ:
        >>> Une room a nécessairement 2 sources énergitiques

        Donc, après que le path engine ait fait des liens entre les éléments,
        On cherche place le storage sur le chemin.
        Cela nous donne le point central de la nouvelle installation
        Puis ont cré le reste de la base de là.

     new RoomVisual(oBase.sName).circle(ifX,ifY, {fill: 'transparent', radius: 0.5, fill: '#5b9a50'});

     */

  }
};

module.exports = building;
