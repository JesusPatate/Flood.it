angular.module('floodit').factory('LseqCouple', function(LseqIdentifier) {
  
  var Couple = function(elt, id) {
    this.element = elt;
    this.id = id;
  };
    
  Couple.prototype.compare = function(o) {
    return this.id.compare(o.id);
  };
  
  return Couple;
});
