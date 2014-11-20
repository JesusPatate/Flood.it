angular.module('floodit').provider('lseqBase', function() {
  var provider = this;
  
  this.INIT_BASE = 5;
  
  this.$get = function(Bigint) {
    var initBase = provider.INIT_BASE;
    
    var base = {};
    
    base.getBitBase = function(level){
      return initBase + level;
    };
    
    base.getSumBit = function(level){
      var n = this.getBitBase(level);
      var m = initBase - 1;
      return (n * (n + 1)) / 2 - (m * (m + 1) / 2);
    };
    
    base.getInterval = function(p, q, level){
      var prevBitLength = this.getSumBit(p.counters.length -1);
      var nextBitLength = this.getSumBit(q.counters.length -1);
      var bitBaseSum = this.getSumBit(level);
      
      // #1 truncate or expend
      
      // #1a process the previous digit
      // if (prevBitLength < bitBaseSum): Add 0
      // if (prevBitLength > bitBaseSum): truncate
      var prev = Bigint.dup(p.digit);
      if (bitBaseSum < prevBitLength){
        Bigint.rightShift_(prev, prevBitLength - bitBaseSum);
      } else {
        prev = Bigint.int2bigInt(0,bitBaseSum);
        Bigint.copy_(prev, p.digit);
        Bigint.leftShift_(prev, bitBaseSum - prevBitLength);
      };
      
      // #1b process the next digit
      var next = Bigint.dup(q.digit);
      
      if (bitBaseSum < nextBitLength){
        Bigint.rightShift_(next, nextBitLength - bitBaseSum);
      } else {
        next = Bigint.int2bigInt(0,bitBaseSum);
        Bigint.copy_(next, q.digit);
        
        if ((level==(p.counters.length+1)) && (level==(q.counters.length+1))
          && (Bigint.equals(p.digit,q.digit))){
            
            Bigint.addInt_(next,1);
          };
          
          Bigint.leftShift_(next, bitBaseSum - nextBitLength);
      };
      
      // #2 process the particular case: q<p at the targeted level
      
      if (Bigint.greater(prev,next)) {
        // #2a: look for the common root
        var i = 0;
        do{
          var sumBitI = this.getSumBit(i);
          if (bitBaseSum >= sumBitI){
            ++i;
            var tempPrev = Bigint.dup(prev);
             var tempNext = Bigint.dup(next);
             Bigint.rightShift_(tempPrev, prevBitLength - sumBitI);
             Bigint.rightShift_(tempNext, nextBitLength - sumBitI);
          }
        }while(Bigint.equals(tempPrev,tempNext) && (bitBaseSum >= sumBitI));
          
        // #2b: add one
        Bigint.rightShift_(next, nextBitLength - this.getSumBit(i - 2));
        Bigint.addInt_(next,1);
        nextBitLength = this.getSumBit(i-2);
          
        // #2c: append missing zeros
        Bigint.leftShift_(next, bitBaseSum - nextBitLength);
      };
      
      Bigint.sub_(next,prev); // next - prev - 1
      Bigint.addInt_(next,-1);

      return next;
    };
    
    return base;
  };
});
