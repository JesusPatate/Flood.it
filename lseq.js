/****************************************
 * Dependances : seedrandom.js
 ***************************************/


/**
 * \class LSEQNode
 * \brief Node of an exponential tree
 */
function LSEQNode(value){
    this.value = value;
    this.size = 0;
    this.children = [];
}

/**
 * \brief Returns a textual representation of the node.
 */
LSEQNode.prototype.toString = function(){
    var repr = this.value && this.value.toString() || '';
  
    for(var i=0; i<this.children.length; i++){
        var child = this.children[i];
      
        if(child != undefined){
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
    
    this._seed = '123456789';
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
LSEQTree.prototype.insert = function(prevId, value, nextId){
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
    this.insertWithId(value, newId);    
    
    return newId;
};

/**
 * \brief Delete the element corresponding to the given id.
 *
 * \param id
 *      id of the element to delete.
 */
LSEQTree.prototype.delete = function(id){
    var parent = this._getNode(this._prefix(id, id.length - 2), function(node){
        node.size--;
    });
    var lastDepthId = id[id.length - 1];
    var node = parent.children[lastDepthId];
    node.value = null;
    
    // The node corresponding to the element is really removed if it has
    // no child.
    if(node.size == 0){
        parent.children[lastDepthId] = null;
    }
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
        if(node.children[id[i]] == undefined){
            node.children[id[i]] = new LSEQNode(null);
        }
        
        node = node.children[id[i]];
        fnode(node);
    }
      
    return node;
};

/**
 * \brief Returns the number of element in the tree.
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
 * \brief Tests if contains an id.
 *
 * \param id
 *      A node id.
 * 
 * \return true if given id matches an existing not empty node,
 *         false otherwise.
 */
LSEQTree.prototype.exist = function(id){
    var node = this._root;
    var found = true;
    var depth = 0;
    
    while(found && depth < id.length){
		node = node.children[id[depth]];
        found = node != undefined;
        depth++;
    }

    return found;
};

/**
 * \brief Insert a given value at a given id.
 *
 * \param value
 *   
 * \param id  
 */
LSEQTree.prototype.insertWithId = function(value, id){
	var newNode = this._getNode(id, function(node){
        node.size++;
    });
    
    newNode.size--;
    newNode.value = value;
};

/**
 * \class LSEQ
 * \brief 
 */
function LSEQ(){
    this._tree = new LSEQTree();
    this._offsetToId = [[0],[this._tree._base - 1]];
}

/**
 * \brief Insert the given value at the given offset.
 *
 * \param value
 *      the value to insert.
 * 
 * \param offset
 *      offset.
 */
LSEQ.prototype.insert = function(value, offset){
    if(offset < 0 || offset > this._tree.size()){
        throw new Error('Invalid offset');
    }
    
    var prevId = this._offsetToId[offset];
    var nextId = this._offsetToId[offset + 1];
    var id = this._tree.insert(prevId, value, nextId);
    
    this._offsetToId.splice(offset + 1, 0, id);
};

/**
 * \brief Delete the element at the given offset.
 *
 * \param offset
 *      offset.
 */
LSEQ.prototype.delete = function(offset){
    if(offset <= 0  || offset > this._tree.size()){
        throw new Error('Invalid offset');
    }
    
    var id = this._tree.getIdFromOffset(offset);
    this._tree.delete(id);
    return id;
};

/**
 * \brief 
 */
LSEQ.prototype.messageDelivered = function(msg){
    console.log(msg);
};

var lseq = new LSEQ();

for (var i = 0 ; i < 1000 ; ++i) {
	lseq.insert('|' + i, 0);
}

console.log(lseq._tree.toString());
