angular.module('floodit').factory('LseqIdentifier', function(Bigint, lseqBase) {
  var base = lseqBase;

  var Identifier = function(digit, sources, counters) {
    this.digit = digit;
    this.sources = sources;
    this.counters = counters;
  };

  Identifier.prototype.JSON_BASE = 16;

  Identifier.prototype.fromObject = function(obj) {
    var id;

    if (obj.d && obj.s && obj.c) {
      if (typeof obj.d == 'string' || obj.d instanceof String) {
        var digit = Bigint.str2bigInt(
          obj.d, Identifier.prototype.JSON_BASE);

        id = new Identifier(digit, obj.s, obj.c);
      }
      else {
        id = new Identifier(obj.d, obj.s, obj.c);
      }
    }
    else {
      throw "Malformed identifier"
    }

    return id;
  };

  Identifier.prototype.compare = function(o) {
    var dBitLength = base.getSumBit(this.counters.length - 1);
    var odBitLength = base.getSumBit(o.counters.length - 1);
    var comparing = true;

    var comp = 0;
    var i = 0;

    // #1 Compare the list of <d,s,c>
    while (comparing && i < Math.min(this.counters.length, o.counters.length) ) {
      // can stop before the end of for loop wiz return
      var sum = base.getSumBit(i);

      // #1a truncate mine
      var mine = Bigint.dup(this.digit);
      Bigint.rightShift_(mine, dBitLength - sum);

      // #1b truncate other
      var other = Bigint.dup(o.digit);
      Bigint.rightShift_(other, odBitLength - sum);

      // #2 Compare triples
      if (!Bigint.equals(mine,other)) {  // #2a digit

        if (Bigint.greater(mine,other)) {
          comp = 1;
        } else {
          comp = -1;
        };
        comparing = false;
      }
      else {
        // #2b source
        if (this.sources[i] < o.sources[i]) {
          comp = -1;
        }
        else if (this.sources[i] > o.sources[i]) {
          comp = 1;
        }

        if (comp != 0) {
          comparing = false;
        } else {
          comp = this.counters[i] - o.counters[i]; // 2c clock

          if (comp != 0) {
            comparing = false;
          };
        };
      };
      ++i;
    };

    if (comp==0) {
      comp = this.counters.length - o.counters.length; // #3 compare list size
    };

    return comp;
  };

  Identifier.prototype.toJSON = function() {
    return {d: Bigint.bigInt2str(this.digit, this.JSON_BASE), s: this.sources, c: this.counters};
  }

  Identifier.prototype.parse = function(obj) {
    obj.d = Bigint.str2bigInt(obj.d, Identifier.prototype.JSON_BASE);
    return new Identifier(obj.d, obj.s, obj.c);
  }

  return Identifier;
});
