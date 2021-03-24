var defence = {

  maintenance (Engine, r) {
    
    
    const maxHits = 20000;
    
    const targets = Game.rooms[r.name].find(FIND_STRUCTURES, {
    filter: object => object.hits < (object.hitsMax > maxHits ? maxHits : object.hitsMax)
    });

    targets.sort((a,b) => a.hits - b.hits);

    var towers = Game.rooms[r.name].find(
            FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});

    if(targets.length > 0) {
      towers.forEach(tower => tower.repair(targets[0]));
    }
  
  },

  rHook : function (Engine, r) {
    
    var hostiles = Game.rooms[r.name].find(FIND_HOSTILE_CREEPS);
    if(hostiles.length > 0) {
        var username = hostiles[0].owner.username;
        //Game.notify(`User ${username} spotted in room ${roomName}`);
        var towers = Game.rooms[r.name].find(
            FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        towers.forEach(tower => tower.attack(hostiles[0]));
    } else {
      defence.maintenance(Engine, r);
    }
  
  }
  
};

    
    
module.exports = defence;
