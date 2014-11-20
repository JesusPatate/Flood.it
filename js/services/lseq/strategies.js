angular.module('floodit').provider('lseqStrategies', function() {
  var provider = this;
  
  this.DEFAULT_BOUNDARY = 10;
  
  this.$get = function(Bigint, LseqIdentifier, lseqBase) {
    var base = lseqBase;
  
    /*!
     * \class Strategy
     * \brief Provides identifier allocation strategies. The signature of
     * these functions is f(Id, Id, N+, N+, N, N): Id.
     */
    var strategies = {};

    strategies._boundary = Bigint.int2bigInt(
      provider.DEFAULT_BOUNDARY, Math.log(provider.DEFAULT_BOUNDARY));

    /*!
     * \brief Choose an id in ]p ; p + k] with k randomly picked in [1 ; k]
     * \param p the previous identifier
     * \param q the next identifier
     * \param level the number of concatenation composing the new identifier
     * \param interval the interval between p and q
     * \param s the source that creates the new identifier
     * \param c the counter of that source
     */
    strategies.bPlus = function (p, q, level, interval, s, c) {
      // #0 process the interval for random
      var step;
      
      if (Bigint.greater(interval, this._boundary)) {
        step = this._boundary;
      } else {
        step = interval;
      };
      
      // #1 Truncate or extends p
      var diffBitCount = base.getSumBit(p.counters.length-1) - base.getSumBit(level);
      var oldD = Bigint.dup(p.digit);
      
      if (diffBitCount < 0) {
        oldD = Bigint.int2bigInt(0,base.getSumBit(level));
        Bigint.copy_(oldD, p.digit);
        Bigint.leftShift_(oldD, -diffBitCount);
      }
      else {
        Bigint.rightShift_(oldD, diffBitCount);
      }
      // #2 create a digit for an identifier by adding a random value
      var randomInt = Math.floor(Math.random()* step[0] +1); // XXX
      
      // #2a Digit
      Bigint.addInt_(oldD, randomInt);
      
      // #2b Source & counter
      var id = getSC(oldD, p, q, level, s, c);
      
      return id;
    };

    /*!
     * \brief Choose an id in [q - k ; q[ with k randomly picked in [1 ; k]
     * \param p the previous identifier
     * \param q the next identifier
     * \param level the number of concatenation composing the new identifier
     * \param interval the interval between p and q
     * \param s the source that creates the new identifier
     * \param c the counter of that source
     */
    strategies.bMinus = function (p, q, level, interval, s, c) {
      // FIXME Wrong id when p is at the end of the level space
      
      // #0 process the interval for random
      var step;
      
      if (Bigint.greater(interval, this._boundary)) {
        step = this._boundary;
      }
      else {
        step = interval;
      };
      
      var prevBitLength = base.getSumBit(p.counters.length - 1);
      var nextBitLength = base.getSumBit(q.counters.length - 1);
      var bitbaseSum = base.getSumBit(level);

      // #1 Truncate or extends p and q
      
      var prev;
      
      if (bitbaseSum < prevBitLength) {
        prev = Bigint.dup(p.digit);
        Bigint.rightShift_(prev, prevBitLength - bitbaseSum);
      }
      else {
        prev = Bigint.int2bigInt(0,bitbaseSum);
        Bigint.copy_(prev,p.digit);
        Bigint.leftShift_(prev, bitbaseSum - prevBitLength);
      };
      
      var next;
      
      if (bitbaseSum < nextBitLength) {
        next = Bigint.dup(q.digit);
        Bigint.rightShift_(next, nextBitLength - bitbaseSum);
      }
      else {
        next = Bigint.int2bigInt(0,bitbaseSum);
        Bigint.copy_(next,q.digit);
        
        // handle specific case where p.digit = q.digit
        if((level == (p.counters.length + 1))
          && (level == (q.counters.length + 1))
          && (Bigint.equals(p.digit, q.digit))) {
          
          Bigint.addInt_(next,1);
        };
        
        Bigint.leftShift_(next, bitbaseSum - nextBitLength);
      };
      
      // #2 Handling particular case of next < prev
      if (Bigint.greater(prev,next)) {
      // #2a Look for the common root
        var i = 0;
        
        do {
          var sumBitI = base.getSumBit(i);
          
          if (bitbaseSum >= sumBitI) {
            ++i;
            var tempPrev = Bigint.dup(prev);
            var tempNext = Bigint.dup(next);
            Bigint.rightShift_(tempPrev, prevBitLength - sumBitI);
            Bigint.rightShift_(tempNext, nextBitLength - sumBitI);}
        } while(Bigint.equals(tempPrev,tempNext) && (bitbaseSum >= sumBitI));
      
        // #2b: add one
        Bigint.rightShift_(next, nextBitLength - base.getSumBit(i - 2));
        Bigint.addInt_(next, 1);
        nextBitLength = base.getSumBit(i - 2);
        
        // #2c: append missing zeros
        Bigint.leftShift_(next, bitbaseSum - nextBitLength);
      };
      
      // #3 create a digit for an identifier by subing a random value
      var randomInt = Math.floor(Math.random() * step[0] + 1); // XXX

      // #3a Digit
      Bigint.addInt_(next, -randomInt);
      
      // #3b Source & counter
      var id = getSC(next, p, q, level, s, c);
      
      return id;
    };

    function getSC(d, p, q, level, s, c) {
      var sources = [];
      var counters = [];
      
      var bitLength = base.getSumBit(level);
      
      for (var i = 0; i <= level; ++i) {
        // #1 truncate the digit of the new id to get the i^th value
        var sumBit = base.getSumBit(i);
        var mask = Bigint.int2bigInt(Math.pow(2, base.getBitBase(i)), base.getBitBase(i) + 1);
        var tempD = Bigint.dup(d);
        
        Bigint.rightShift_(tempD, bitLength - sumBit);
        
        var valD = Bigint.mod(tempD, mask);
        var copied = false;
        
        // #2 truncate previous value the same way
        if (i < p.counters.length) {
          var valP; // pow(
          
          if (base.getSumBit(p.counters.length-1) < sumBit) {
            valP = Bigint.int2bigInt(0,1);
          }
          else {
            var tempP = Bigint.dup(p.digit);
            Bigint.rightShift_(tempP, base.getSumBit(p.counters.length - 1) - sumBit);
            valP = Bigint.mod(tempP, mask);
          };
          
          if (Bigint.equals(valD,valP)) {
            // #2a copy p source & counter
            sources[i] = p.sources[i];
            counters[i] = p.counters[i];
            copied = true; 
          }
        };
        
        if (!copied && i < q.counters.length) {
          var valQ;
          
          if (base.getSumBit(q.counters.length-1) < sumBit) {
            valQ = Bigint.int2bigInt(0,1);
          }
          else {
            var tempQ = Bigint.dup(q.digit);
            Bigint.rightShift_(tempQ, base.getSumBit(q.counters.length - 1) - sumBit);
            valQ = Bigint.mod(tempQ, mask);
          };
          
          if (Bigint.equals(valD,valQ)) {
            // #2b copy q site & counter
            sources[i] = q.sources[i];
            counters[i] = q.counters[i];
            copied = true;
          };
        };
        
        if (!copied) { // 2c copy our source & counter
          sources[i] = s;
          counters[i] = c;
        };	
      };
      
      return new LseqIdentifier(d, sources, counters);
    };
    
    return strategies;
  };
});
