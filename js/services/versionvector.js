(function() {
  angular.module('floodit').factory('VersionVector', function() {
    
    /**
     * \class VV
     * \brief the well-known version vector that characterizes causality between
     * updates
     * \param e the entry chosen by the local site (1 entry <-> 1 site)
     */
    var VersionVector = function(e) {
      this._entry = e;
      this._vector = {};
    };
    
    /**
     * \brief increment the entry of the vector on local update
     */
    VersionVector.prototype.increment = function(){
        if (!(this._entry in this._vector)){
            this._vector[this._entry] = 0;
        };
        
        this._vector[this._entry] = this._vector[this._entry] + 1;
    };
    
    /**
     * \brief increment from a remote version vector supposedly ready
     * \param vv the received version vector
     */
    VersionVector.prototype.incrementFrom = function (vv){
        if (!(vv._entry in this._vector)){
            this._vector[vv._entry] = 0;
        };
        
        this._vector[vv._entry] = vv._vector[vv._entry]; // if ready, it means + 1 on the entry
    };
    
    /**
     * \brief check if the target VV is causally ready 
     * \param vv the version vector to check
     */
    VersionVector.prototype.isReady = function(vv){
      var ready = true;

      // #1 verify that all entry of this._vector exists in vv
      var keys = Object.keys(this._vector);
      var i = 0;

      while (ready && i<keys.length){
        if (!(keys[i] in vv._vector) || (this._vector[keys[i]] > vv._vector[keys[i]])){
          ready = false;
        };

        ++i;
      };

      // #2 verify that all entry of vv._vector exists in this._vector
      var keys = Object.keys(vv._vector);
      var i = 0;

      while (ready && i<keys.length){
        if ((keys[i]!=vv._entry) &&
          (!(keys[i] in this._vector) ||
          (this._vector[keys[i]] > vv._vector[keys[i]]))){

          ready = false;
        };

        ++i;
      };

      ready = (ready &&
        ((vv._vector[vv._entry]==1) ||
        ((vv._entry in this._vector) &&
        (vv._vector[vv._entry] == (this._vector[vv._entry] +1) ))));

        return ready;
    };
    
    /**
     * \brief check if the target vv is strictly lower than the local one. Probably
     * meaning that the information linked to it has already been delivered
     * \param vv the version vector to check
     */
    VersionVector.prototype.isLower = function(vv){
      return ((vv._entry in this._vector) && (vv._vector[vv._entry] <= this._vector[vv._entry]));
    };
    
    VersionVector.prototype.clone = function() {
      var c;
      
      if (this._entry.clone != undefined) {
        c = new VV(this._entry.clone());
      } else {
        c = new VV(this._entry);
      }
      
      c.incrementFrom(this);
      
      return c;
    };
    
    VersionVector.prototype.toString = function() {
      return '{entry: ' + this._entry + ', vector: ' + JSON.stringify(this._vector) + '}';
    };
    
    VersionVector.prototype.toJSON = function() {
      return JSON.stringify(this._vector);
    };
    
    return VersionVector;
  });
})();

