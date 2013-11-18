/****************************************
 * Dependances : seedrandom.js
 ***************************************/

/****************************************
 * TODO :
 *  - node.size est maintenant inutile
 *  - node.children devrait être un objet
 *    natif plutôt qu'un tableau (l'espace
 *    d'un noeud supprimé reste alloué (null))
 ****************************************/

/*!
 * \class Triplet
 * 
 * \param a First element of triplet tuple.
 * \param b Second element of triplet tuple.
 * \param c Third element of triplet tuple.
 */
function Triplet(a, b, c) {

  // ! The first tuple element.
  this.first = a;

  // ! The second tuple element.
  this.second = b;

  // ! The third tuple element.
  this.third = c;
}

/*!
 * \class Position
 * \extends Triplet
 * 
 * \param value An integer.
 * \param siteID A site identifier.
 * \param clock A clock value.
 */
function Position(value, siteID, clock) {
  if (!clock) {
    var clock = 0;
  }

  Triplet.call(this, value, siteID, clock);
}

Position.prototype = new Triplet;
Position.prototype.constructor = Position;

/*!
 * \brief  Returns position's value (1rst element).
 * 
 * \return An integer in range of <tt>[0..LevelBase[</tt>.
 */
Position.prototype.getValue = function() {
  return this.first;
}

/*!
 * \brief Returns position's site ID (2nd element).
 * 
 * \return A site identifier.
 */
Position.prototype.getSiteID = function() {
  return this.second;
}

/*!
 * \brief Returns position's sclock (3rd element).
 * 
 * \return The clock value.
 */
Position.prototype.getClock = function() {
  return this.third;
}

/**
 * brief Compares a position to another.
 *
 * \param pos Another position.
 **/
Position.prototype.compareTo = function(pos) {
    var res = -1;

    if (this.siteID > pos.getSiteID()) {
        res = 1;
    }
    else if (this.siteID == pos.getSiteID()) {
        if (this.clock > pos.getClock()) {
            res = 1;
        }
        else if (this.clock == pos.getClock()) {
            res = 0;
        }
    }

    return res;
}

/**
 * \class LSEQNode
 * \brief A Node of an exponential tree.
 */
function LSEQNode(){
    this.positions = [];
    this.size = 0;
    this.children = [];
}

LSEQNode.prototype.ChildNumber = function(fragment, siteID, clock) {
	var num = 0;
	var found = false;
	var i = 0;

    // Find child
	while (!found && i < this.children.length) {
		if (i == fragment) {
			found = true;
		}
		else {
			if (this.children[i] != undefined && this.children[i] != null) {
				++num;
			}
			
			++i;
		}
	}

    // Find position
    if (found) {
        var positions = this.children[i].positions;
        
        found = false;
        i = 0;

        while (!found && i < positions.length) {
            if(positions[i].getSiteID() == siteID
                && positions[i].getClock() == clock) {

                found = true;
            }
            else if (positions[i] != undefined) {
                ++num;
            }

            ++i;
        }
    }
	
	return found ? num : undefined;
}

/**
 * \brief Returns a textual representation of the node.
 */
LSEQNode.prototype.toString = function(){
    var repr = '';

    for(var i=0; i<this.positions.length; i++){
        var pos = this.positions[i];

        if(pos != undefined){
            repr += pos.getValue();
        }
    }
    
    for(var i=0; i<this.children.length; i++){
        var child = this.children[i];
      
        if(child != undefined && child != null){
            repr += child.toString();
        }
    }
  
    return repr;
};

/**
 * \class LSEQTree
 * \brief Exponential tree for LSEQ
 */
function LSEQTree(base, boundary){
    const DEFAULT_BASE = 32;
    const DEFAULT_BOUNDARY = 10;
    
    this._base = base || DEFAULT_BASE;
    this._boundary = boundary || DEFAULT_BOUNDARY;
    this._strategies = [];
    this._strategies[0] = function(step, lowerBound, upperBound){
        Math.seedrandom();
        var offset = Math.floor(Math.random() * step) + 1;
        return lowerBound + offset;
    };
    
    this._strategies[1] = function(step, lowerBound, upperBound){
        Math.seedrandom();
        var offset = Math.floor(Math.random() * step) + 1;
        return upperBound - offset;
    };
    
    // Math.seedrandom();
    // this._seed = Math.floor(Math.random() * (10000 - 100) + 100);

    this._seed = '123654';
    this._root = new LSEQNode(null);
    this._root.children[0] = new LSEQNode(null);
    this._root.children[this._base - 1] = new LSEQNode(null);
}

/**
 * \brief Inserts a new element in the tree and return the id attributed
 *  for the new element.
 *
 * \param prevId
 *      ID of the element just before the new one.
 * \param value
 *      Value of the new element.
 * \param nextId
 *      ID of the element just after the new one.
 */
LSEQTree.prototype.insert = function(value, siteID, clock, prevId, nextId){
    var depth = 0;
    var lowerBound = prevId[depth];
    var upperBound = nextId[depth];
    var interval = upperBound - lowerBound - 1;
    var parentId = this._prefix(prevId, depth - 1);
    
    while(interval < 1){
        depth++;

        if(prevId.length > depth && nextId.length > depth){
            lowerBound = prevId[depth];
            upperBound = nextId[depth];
            parentId = this._prefix(prevId, depth - 1);
        }
        else if(prevId.length > depth && nextId.length <= depth){
            lowerBound = prevId[depth];
            upperBound = this._maxId(depth);
            parentId = this._prefix(prevId, depth - 1);
        }
        else if(prevId.length <= depth && nextId.length <= depth){
            lowerBound = 0;
            upperBound = this._maxId(depth);
            parentId = this._prefix(prevId, depth - 1);
        }
        else{
            if(prevId[depth - 1] != nextId[depth - 1]){
                lowerBound = prevId[depth - 1];
                upperBound = nextId[depth - 1] + 1;
                parentId = this._prefix(prevId, depth - 2);
            }
            else{
                var jump = nextId.length - 1 - depth;
                depth = nextId.length - 1;
            
                if(nextId[depth] > 1){
                    lowerBound = 0;
                    upperBound = nextId[depth];
                    parentId = this._prefix(nextId, depth - 1);
                }
                else{
                    lowerBound = 0;
                    upperBound = this._maxId(depth + 1);
                    parentId = prevId.concat([0]);
              
                    for(var i=1; i<=jump; i++){
                        parentId = parentId.concat([0]);
                    }
                }
            }
        }
        
        interval = upperBound - lowerBound - 1;
    }
    
    var step = Math.min(this._boundary, interval);
    var strategyId = this._h(depth);
    
    var lastDepthId = this._strategies[strategyId](step, lowerBound, upperBound);
    var newId = parentId.concat(lastDepthId);
    
    this.insertWithId(newId, value, siteID, clock);    
    
    return newId;
};

/**
 * \brief Delete the element corresponding to the given id.
 *
 * \param id
 *      id of the element to delete.
 */
LSEQTree.prototype.delete = function(id, siteID, clock){
    var parent = this._getNode(this._prefix(id, id.length - 2),
        function(node){node.size--;});
    var lastDepthId = id[id.length - 1];
    var node = parent.children[lastDepthId];
    var found = false;
    var i = 0;
    
    while(!found && i<node.positions.length){
        if(node.positions[i].getSiteID() == siteID
            && node.positions[i].getClock() == clock){
                
            node.positions.splice(i, 1);
            node.size++;
            found = true;
        }
        else {
            ++i;
        }
    }
    
    // The node can be physically removed if it has neither position nor child.
    if(node.positions.length == 0 && node.children.length == 0){
        parent.children[lastDepthId] = null;
    }

    return found;
};

/**
 * \brief Returns id of the node just before the given offset
 * 
 * Example : getId(0) returns document starting node
 * 
 * \param offset An offset in the document
 */
LSEQTree.prototype._getId = function(offset){
    var id = [0];
    var siteID;
    var clock;
    
    var currentNode = this._root;
    var depth = 0;
    var n = 0;
    var stop = false;

    while (!stop && n < offset) {
        var i = 0;
        
        while (!stop && i < currentNode.children.length) {
			if(currentNode.children[i] != undefined) {
				var childSize = currentNode.children[i].size;
				var childPositions = currentNode.children[i].positions.length;
				
				// Child positions
				
				if (childPositions > 0) { // Not empty node
					if (n + childPositions < offset) {
						n += childPositions;
					}
					else {
						var pos = currentNode.children[i].positions[offset - n - 1];
						id[depth] = i;
						siteID = pos.getSiteID();
						clock = pos.getClock();
						stop = true;
					}
				}
				
				// Child children
				
				if(!stop) {
					if (n + childSize < offset) {
						n += childSize;
						++i;
					}
					else {
						currentNode = currentNode.children[i];
						id[depth] = i;
						++depth;
						i = 0;
					}
				}
			}
			else {
				++i;
			}
		}
		
		if(!stop) {
			id[depth] = this._base - 1;
			break;
		}
	}
    
	return {id:id, siteID:siteID, clock:clock};
};

/**
 * \brief Returns the strategy id corresponding to the given depth of the tree.
 *
 * \param depth
 *      the depth in the tree.
 */
LSEQTree.prototype._h = function(depth){
    Math.seedrandom(this._seed * (depth + 1));
    return Math.round(Math.random());
};

/**
 * \brief Returns the maximum authorized child index for a given depth of the
 * tree.  
 *
 * \param depth
 *      the depth in the tree.
 */
LSEQTree.prototype._maxId = function(depth){
    return this._base * (1 << depth);
};

/**
 * \brief Returns the node corresponding to the given id and creates it if it
 * doesn't exist.
 *
 * \param id
 *      id of the wanted node.
 * 
 * \param f
 *      optional function to apply on every node of the path given by the id.
 */
LSEQTree.prototype._getNode = function(id, f){
    var fnode = f || function(node){};
    var node = this._root;
    
    fnode(node);
  
    for(var i=0; i<id.length; i++){        
        if(node.children[id[i]] == undefined || node.children[id[i]] == null){
            node.children[id[i]] = new LSEQNode(null);
        }
        
        node = node.children[id[i]];
        fnode(node);
    }
      
    return node;
};

/**
 * \brief Returns the number of elements in the tree.
 */
LSEQTree.prototype.size = function(){
    return this._root.size;
};

/**
 * \brief Returns the given id truncated to depth.
 *
 * \param id
 *      id to truncate.
 * 
 * \param depth
 */
LSEQTree.prototype._prefix = function(id, depth){
    return id.slice(0, depth + 1);
};

/**
 * \brief Returns a textual representation of the tree.
 */
LSEQTree.prototype.toString = function(){
    return this._root.toString();
};

/**
 * \brief Insert a given value at a given id.
 *
 * \param value
 *   
 * \param id  
 */
LSEQTree.prototype.insertWithId = function(id, value, siteID, clock){
    var position = new Position(value, siteID, clock);
    var stop = false;
    var i = 0;
	
	var node = this._getNode(id, function(node){node.size++;});
	node.size--;
    
    while(!stop && i< node.positions.length){
        if(node.positions[i].compareTo(position) > 0) {
            stop = true;
        }
        else {
            ++i;
        }
    }

    node.positions.splice(i, 0, position);
};

/**
 * \class LSEQ
 * \brief 
 */
function LSEQ(){
    EventEmitter.call(this);
    
    this._tree = new LSEQTree();
}

LSEQ.prototype = Object.create(EventEmitter.prototype);
LSEQ.prototype.constructor = LSEQ;

/**
 * \brief Insert the given value at the given offset.
 *
 * \param value
 *      the value to insert.
 * 
 * \param offset
 *      offset.
 */
LSEQ.prototype.insert = function(offset, value, siteID, clock){
    if(offset < 0 || offset > this.size()){
        throw new Error('Invalid offset');
    }
    
    var prevId = this._tree._getId(offset).id;
    var nextId = this._tree._getId(offset + 1).id;
    
    var id = this._tree.insert(value, siteID, clock, prevId, nextId);

    this.emit('insert', {value:value, id:id, siteID:siteID, clock:clock});
    
    return id;
};

/**
 * \brief Insert a new node with given id and value.
 *
 * \param value
 *      Value of the new node.
 * 
 * \param id
 *      ID of the new node.
 */
LSEQ.prototype.foreignInsert = function(id, value, siteID, clock) {
    this._tree.insertWithId(id, value, siteID, clock);

    // Get parent node
    
	var parentId = id.slice(0, id.length - 1);
    var parent = this._tree._getNode(parentId);

    // Get not empty parent node
    // [0.0.0] => []
    // [12.3.0] => [12.3]

    var i = parentId.length - 1;

    while(parentId[i] == 0) {
        parentId.pop();
        i = parentId.length - 1;
    }

    // Compute new node offset
    
	var parentOffset = this._getOffset(parentId);
	var num = parent.ChildNumber(id[id.length - 1], siteID, clock);
	var newOffset = parentOffset + num + 1;

    this.emit('foreignInsert', {value:value, id:id, offset:newOffset, siteID:siteID});
	
	return newOffset;
};

/**
 * \brief Delete the element at the given offset.
 *
 * \param offset
 *      offset.
 */
LSEQ.prototype.delete = function(offset){
    if(offset < 0 || offset > this.size()){
        throw new Error('Invalid offset');
    }
    
    var id = this._tree._getId(offset).id;
    var siteID = this._tree._getId(offset).siteID;
    var clock = this._tree._getId(offset).clock;
    
    this._tree.delete(id, siteID, clock);

    this.emit('delete', {id:id, siteID:siteID, clock:clock});
    
    return id;
};

/**
 * \brief Delete the element with the given id.
 *
 * \param id
 *      ID of the node to delete.
 */
LSEQ.prototype.foreignDelete = function(id, siteID, clock){
    
    // Get parent node
    
	var parentId = id.slice(0, id.length - 1);
    var parent = this._tree._getNode(parentId);

    // Get not empty parent node
    // [0.0.0] => []
    // [12.3.0] => [12.3]

    var i = parentId.length - 1;

    while(parentId[i] == 0) {
        parentId.pop();
        i = parentId.length - 1;
    }

    // Compute the offset of the node to delete
    
	var parentOffset = this._getOffset(parentId);
	var num = parent.ChildNumber(id[id.length - 1], siteID, clock);
	var offset = parentOffset + num + 1;
	
    this._tree.delete(id, siteID, clock);

    this.emit('foreignDelete', {offset:offset});
};

LSEQ.prototype._getOffset = function(id) {
	var offset = 0;
	var lowerIdx = 0;
	var upperIdx = this._tree.size();
	var found = false;
	
	if(id.length == 0 || ((id.length == 1) && (id[0] = 0))) {
		found = true;
		offset = 0;
	}
	
	else {
		while((found == false) && (lowerIdx <= upperIdx)) {
			var midIdx = Math.floor((lowerIdx + upperIdx) / 2);
			var midId = this._tree._getId(midIdx).id;
			
			var comp = this._compareIDs(id, midId);
			
			if(comp < 0) {
				upperIdx = midIdx;
			}
			else if (comp > 0) {
				lowerIdx = midIdx + 1;
			}
			else {
				found = true;
			}
		}
		
		if (midId == id) {
			offset = midIdx;
		}
		else {
			offset = undefined;
		}
	}
	
	return offset;
};

LSEQ.prototype.size = function(){
    return this._tree.size();
};

/**
 * Compare 2 LSEQ node ids.
 * 
 * \param id1 A node ID
 * \param id2 A node ID
 * 
 * \return 
 * <ul>
 * <li>-1 if id1 < id2</li>
 * <li>0 if id1 = id2</li>
 * <li>1 if id1 > id2</li><
 * /ul>
 */
LSEQ.prototype._compareIDs = function(id1, id2) {
	var res = 0;
	var stop = false;
	var i = 0;
	
	while (stop == false) {
		var fragment1 = id1[i];
		var fragment2 = id2[i];
		
		if (fragment1 == undefined && fragment2 == undefined) {
			stop = true;
			res = 0;
		}
		else if (fragment1 == undefined) {
			stop = true;
			res = -1;
		}
		else if (fragment2 == undefined) {
			stop = true;
			res = 1;
		}
		else {
			var diff = fragment1 - fragment2;
			
			if (diff > 0) {
				stop = true;
				res = 1;
			}
			else if (diff < 0) {
				stop = true;
				res = -1;
			}
		}
		
		if(stop == false) {
			++i;
		}
	}
	
	return res;
};

/**
 * \brief 
 */
LSEQ.prototype.onDelivery = function(message){
    if(!message.error) {
        if(message.local) { // Local site edition
            // if message.msg.type == insert then insert()
            // else if message.msg.type == delete then delete()
        }
        else { // Distant site edition
            // if message.msg.type == insert then foreignInsert()
            // else if message.msg.type == delete then foreignDelete()
        }
    }
    else {
        // Error of causality
    }
};

var siteID = 'abc';
var lseq = new LSEQ();
var x;

for (var i = 0 ; i < 10 ; ++i) {
	var id = lseq.insert(i, '|' + i, siteID, (parseInt(i)+1));
}

console.log(lseq._tree.toString());

console.log(lseq.delete(3));
console.log(lseq._tree.toString());

//lseq.delete(2);
//console.log(lseq._tree.toString());
//console.log(lseq._tree._root.size);

//var id = lseq.insert(6, '|a', siteID, 0);
//console.log(lseq._tree.toString());
//console.log(lseq._tree._root.size);

//var siteID2 = 'ghjk';
//lseq.foreignInsert(id, '|b', siteID2, 0);
//console.log(lseq._tree.toString());
//console.log(lseq._tree._root.size);

//lseq.foreignDelete(id, siteID, 0);
//console.log(lseq._tree.toString());
//console.log(lseq._tree._root.size);

