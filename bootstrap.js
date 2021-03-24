var bootstrap = {
    name: 'bootstrap',
    // Build the backbone memory
    refreshMemory : function(Engine) {
        console.log("Refreshing memory..");
        Memory.engine = null;
        Memory.engine = {
            rooms: []
        }
        Memory.engine.rooms = [];
        
        for(const i in Game.spawns) {
            let spawn = Game.spawns[i];
            let iRoomIndex = Engine.m['cUtility'].getRoomIndexFromName(spawn.room.name);
            if (iRoomIndex < 0) {
                Memory.engine.rooms.push({
                    name: spawn.room.name,
                    rSpawn: [],
                    rMap: []
                });
                iRoomIndex = Memory.engine.rooms.length - 1;
            }
            Memory.engine.rooms[iRoomIndex].rSpawn.push(spawn.name)
        }
      
        
        Engine.refresh = true;
    }
}

module.exports = bootstrap;
