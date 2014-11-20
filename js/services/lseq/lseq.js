"use strict";

(function() {
  angular.module('floodit').service('lseq', function(LseqIdentifier, LseqCouple, lseqStrategies, lseqBase, Bigint) {
    var base = lseqBase;

    var siteID = null;
    var clock = 0;
    var hash = function(depth) { return depth%2; };
    var array = [];
    var length = 0;

    var callbacks = [];

    this.init = function(id) {
      siteID = id;

      array[0] = new LseqCouple(null, new LseqIdentifier(
        Bigint.int2bigInt(0, base.getSumBit(0)), [0], [0])); // lowest id
        
      array[1] = new LseqCouple(null, new LseqIdentifier(
        Bigint.int2bigInt(Math.pow(2, base.getBitBase(0)) - 1, base.getSumBit(0)),
        [Number.MAX_VALUE], [Number.MAX_VALUE])); // highest id
    };

    /*!
     * \brief return the identifier and element at the targeted index
     * \param index the index of the couple in the array
     * \return a LseqCouple
     */
    this.get = function(index) {
      return array[index];
    };

    /*!
     * \brief Inserts values at the given indexes
     * \param inArray an array of objects {index, element}
     * \return an array of LseqCouples
     */
    this.insert = function(inArray) {
      var outArray = [];
      var couples = [];
      
      for (var idx in inArray) {
        var index = inArray[idx].index;
        var element = inArray[idx].element;
        
        // #1 getting the bounds
        var pei = this.get(index);
        var qei = this.get(index + 1);

        // #2 generating the identifier between the bound
        clock += 1;
        var id = alloc(pei.id, qei.id);
        
        // #3 add it to the structure
        this.applyInsert(element, id);
        
        outArray.push({id: id, elt: element});
        couples.push(new LseqCouple(element, id));
      }

      if(outArray.length > 0) {
        notify('insertion', outArray);
      }

      return couples;
    };

    /*!
     * \brief Deletes elements according to their indexes.
     * \param array an array of indexes in ascending order
     * \return an array of the identifiers of the elements deleted
     */
    this.remove = function(array) {
      var outArray = [];

      for (var idx = array.length - 1 ; idx >= 0 ; --idx) {
        var index = array[idx] + 1; // NOTE: array[0] = BEGIN
    
        if (index > 0) {
          var id = this.get(index).id;
          this.applyRemove(id);
          outArray.push({id: id});
        }
      }
      
      notify('deletion', outArray);

      return outArray;
    };

    /*!
     * \brief insert an element created from a remote site into the array
     * \param e the element to insert
     * \param i the identifier of the element
     * \return the index of the newly inserted element in the array
     */
    this.applyInsert = function(e, i) {
      var couple = new LseqCouple(e, i);

      // #1 binarysearch of the identifier
      var position = binaryIndexOf(couple)
      
      // #2 insert in the rightfull position
      if (position < 0) { // it does not exists yet
        position = Math.abs(position);
        array.splice(position,0, couple);
        length += 1;
        return position;
      };

      return -1; // It already exists
    };

    /*!
     * \brief delete the element with the targeted identifier
     * \param i the identifier of the element
     * \return the index of the element feshly deleted
     */
    this.applyRemove = function(i) {
      var couple = new LseqCouple(null, i);

      // #1 binarysearch of the identifier
      var position = binaryIndexOf(couple);

      // #2 if exists then delete
      if (position > 0) { // the element exists
        array.splice(position,1);
        length -= 1;
        return position;
      };

      return -1; // Nothing has been deleted
    };

    this.handle = function(data) {
      data.data = JSON.parse(data.data, function(k,v) {
        if (k === 'id') {
          return LseqIdentifier.prototype.parse(v);
        } else {
          return v;
        }
      });
      
      var array = [];
      var event;
      
      switch (data.type) {
        case 'insertion':
          var couple, index;
          
          for (var i in data.data) {
            couple = data.data[i];
            index = this.applyInsert(couple.elt, couple.id);
            array.push({index: index - 1, element: couple.elt}); // NOTE: array[0] = BEGIN
          }
          
          event = 'remoteInsertion';
          break;
          
        case 'deletion':
          var id, index;
          
          for (var i in data.data) {
            id = data.data[i].id;
            index = this.applyRemove(id);
            array.push(index - 1); // NOTE: array[0] = BEGIN
          }
          
          event = 'remoteDeletion';
          break;
      }
          
      notify(event, array);
    }

    this.join = function(doc) {
      var d = JSON.parse(doc, function(k,v) {
        if (k === "id") {
          return v;
        }
        else {
          return v;
        }
      });

      // console.log(d);
    };

    this.toJSON = function() {
      var obj = [];
      
      for (var idx = 1 ; idx < array.length - 1 ; ++idx) {
        obj.push({elt: array[idx].element, id: array[idx].id.toJSON()});
      }
      
      return obj;
    };

    this.toString = function() {
      var str = '';
      
      for (var idx = 1 ; idx < array.length - 1 ; ++idx) {
        str += array[idx].element;
      }
      
      return str;
    };

    this.addListener = function(event, callback) {
      if (!callbacks[event]) {
        callbacks[event] = [];
      }

      callbacks[event].push(callback);
    };

    /*!
     * \brief generate the digit part of the identifiers  between p and q
     * \param p the digit part of the previous identifier
     * \param q the digit part of the next identifier
     * \return the digit part located between p and q
     */
    function alloc(p,q) {
      // #1 process the level of the new identifier
      var interval = Bigint.int2bigInt(0, base.getBitBase(0));
      var level = 0;
      
      while (Bigint.isZero(interval) || Bigint.negative(interval)) {
        // no room for insertions
        interval = base.getInterval(p, q, level);
        ++level;
      };
      
      level -=1;
      var id;
      
      if (hash(level) === 0) {
        id = lseqStrategies.bPlus(p, q, level, interval, siteID, clock);
      } else {
        id = lseqStrategies.bMinus(p, q, level, interval, siteID, clock);
      };
      
      return id;
    }

    function binaryIndexOf(searchElement) {
      var minIndex = 0;
      var maxIndex = array.length - 1;
      var currentIndex;
      var currentElement;

      while (minIndex <= maxIndex) {
        currentIndex = Math.floor((minIndex + maxIndex) / 2);
        currentElement = array[currentIndex];

        var comp = currentElement.compare(searchElement);
        
        if (comp < 0) {
          minIndex = currentIndex + 1;
        }
        else if (comp > 0) {
          maxIndex = currentIndex - 1;
        }
        else {
          return currentIndex;
        }
      };

      return ~maxIndex;
    }

    function notify(event) {
      var argumentsArray = Array.prototype.slice.apply(arguments);
      argumentsArray.splice(0,1);
      
      if (callbacks[event]) {
        for (var idx in callbacks[event]) {
          callbacks[event][idx].apply(null, argumentsArray);
        }
      }
    };
    
  });
})();
