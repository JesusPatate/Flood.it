/*********************************************
Dépendances : 

Interface fournie :
  - messageDelivered(msg);

   
Interface requise: 

***********************************************/

function LSEQNode(value){
  this.value = value;
  this.children = [];
  this.next = null; // à voir
}

LSEQNode.prototype.toString = function(){
  var repr = this.value && this.value.toString() || '';
  
  for(var child in this.children){
    repr += this.children[child].toString();
  }
  
  return repr;
};

function LSEQ(){
  this._root = new LSEQNode();
  this._root.children[0] = new LSEQNode(null);
}

// pour l'instant on insère toujours au début
// id1 et id2 sont des listes de positions, ex: [12, 45, 122];
// on suppose que id1 < id2
// que id1 et id2 sont corrects
// et pas d'élément entre les id1 et id2
// si id1.length == id2.length alors seul le dernier élément de l'id est différent
// si id1.length != id2.length alors l'id le plus petit est commun à l'autre
// le nouvel id sera id1 < newId < id2
// pas de gestion des suppresions
LSEQ.prototype.insert = function(elem, id1, id2){
  var levelDiff = Math.abs(id1.length - id2.length);
  var lastLevelId = 0;
  var parentId = id1;
  var parent;
  
  if((levelDiff == 0 && id2[id1.length - 1] - id1[id1.length - 1] > 1) ||
      (levelDiff != 0 && id1[id1.length - 1] < Math.pow(id1.length - 1 + 5, 2))){
    lastLevelId = id1[id1.length - 1] + 1;
    parentId = id1.slice(0, id1.length - 1);
  }
  
  parent = this._getNode(parentId);
  parent.children[lastLevelId] = new LSEQNode(elem);
  return parentId.concat(lastLevelId);
};

LSEQ.prototype._getNode = function(id){
  var iter = this._root;
  
  for(var idLevel in id){
    iter = iter.children[id[idLevel]];
  }
  
  return iter;
};

LSEQ.prototype.delete = function(id){
};

LSEQ.prototype.toString = function(){
  return this._root.toString();
};

LSEQ.prototype.messageDelivered = function(msg){
  console.log(msg);
};