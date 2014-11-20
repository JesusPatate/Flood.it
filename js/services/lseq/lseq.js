"use strict";

(function() {
  angular.module('floodit').service('lseq', function(LseqIdentifier, LseqCouple, lseqStrategies, lseqBase, Bigint) {
    var callbacks = {};

    var siteID = null;
    var clock = 0;
    var hash = function(depth) { return depth%2; };
    var array = [];
    var length = 0;
    var base = lseqBase;

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
     * \brief Inserts values at the given index
     * \param pos index at which values must be inserted
     * \param values an array of values
     * \return an array of LseqCouples
     */
    this.insert = function(pos, values) {
      var outArray = [];
      var index;
      var element;

      for (var idx = 0 ; idx < values.length ; ++idx) {
        index = pos + idx;
        element = values[idx];

        var pei = this.get(index);
        var qei = this.get(index + 1);

        clock += 1;
        var id = alloc(pei.id, qei.id);

        applyInsert(element, id);

        outArray.push({id: id, elt: element});
      }

      return outArray;
    };

    /*!
     * \brief Deletes elements starting from a given index
     * \param pos index at which elements must be deleted
     * \param nb number of elements to be deleted
     * \return an array of the identifiers of the deleted elements
     */
    this.remove = function(pos, nb) {
      var outArray = [];

      for (var idx = nb ; idx > 0 ; --idx) {
        var index = pos + idx;

        if (index > 0 && index <= length) {
          var id = this.get(index).id;
          applyRemove(id);
          outArray.push({id: id});
        }
      }

      return outArray;
    };

    this.integrateInsertion = function(data) {
      var couple, index, id;
      var array = [];

      for (var i = 0 ; i < data.length ; ++i) {
        couple = data[i];
        id = LseqIdentifier.prototype.fromObject(couple.id);
        index = applyInsert(couple.elt, id);
        array.push({index: index - 1, element: couple.elt}); // NOTE: array[0] = BEGIN
      }

      return array;
    }

    this.integrateDeletion = function(data) {
      var id, index;
      var array = [];

      for (var i = 0 ; i < data.length ; ++i) {
        id = LseqIdentifier.prototype.fromObject(data[i].id);
        index = applyRemove(id);
        array.push(index - 1); // NOTE: array[0] = BEGIN
      }

      return array;
    }

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

    this.addListener = function(event, callback, obj) {
      if (!callbacks[event]) {
        callbacks[event] = [];
      }

      callbacks[event].push({obj: obj, callback: callback});
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

    /*!
     * \brief insert an element created from a remote site into the array
     * \param elt the element to insert
     * \param id the identifier of the element
     * \return the index of the newly inserted element in the array
     */
    function applyInsert(elt, id) {
      var couple = new LseqCouple(elt, id);

      var position = binaryIndexOf(couple)

      if (position < 0) {
        position = Math.abs(position);
        array.splice(position,0, couple);
        length += 1;
        return position;
      };

      return -1;
    }

    /*!
     * \brief delete the element with the targeted identifier
     * \param i the identifier of the element
     * \return the index of the element feshly deleted
     */
    function applyRemove(id) {
      var couple = new LseqCouple(null, id);

      var position = binaryIndexOf(couple);

      if (position > 0) {
        array.splice(position,1);
        length -= 1;
        return position;
      };

      return -1;
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
        var entry;

        for (var idx in callbacks[event]) {
          entry = callbacks[event][idx];
          entry.callback.apply(entry.obj, argumentsArray);
        }
      }
    }

  });
})();
