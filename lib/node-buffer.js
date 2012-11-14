/*jshint evil: false, bitwise:false, strict: false, undef: true, white: false, plusplus:false, node:true */

//needed for Long class to support uint64
var bson = require('bson');
var assert = require('assert');

var littleEndianImpl = {
    readFloat: function(offset) {
        return this.buffer.readFloatLE(this.offset + offset);
    },
    readDouble: function(offset) {
        return this.buffer.readDoubleLE(this.offset + offset);
    },
    readUint32: function(offset) {
        return this.buffer.readUInt32LE(this.offset + offset);
    },
    readUint64: function(offset) {
        var lo = this.buffer.readUInt32LE(this.offset + offset, true),
            hi = this.buffer.readUInt32LE(this.offset + offset + 4, true);
        return bson.Long.fromBits(lo, hi).toNumber();
    },
    readUint16: function(offset) {
        return this.buffer.readUInt16LE(this.offset + offset);
    },
    writeFloat: function(value, offset) {
        return this.buffer.writeFloatLE(value, this.offset + offset);
    },
    writeDouble: function(value, offset) {
        return this.buffer.writeDoubleLE(value, this.offset + offset);
    },
    writeUint32: function(value, offset) {
        return this.buffer.writeUInt32LE(value, this.offset + offset);
    },
    writeUint16: function(value, offset) {
        return this.buffer.writeUInt16LE(value, this.offset + offset);
    },
    writeUint64: function(value, offset) {
        var l = bson.Long.fromNumber(value),
            lo = l.getLowBits(),
            hi = l.getHighBits();
        this.buffer.writeUInt32LE(lo, this.offset + offset, true);
        this.buffer.writeUInt32LE(hi, this.offset + offset + 4, true);
    }
};

var bigEndianImpl = {
    readFloat: function(offset) {
        return this.buffer.readFloatBE(this.offset + offset);
    },
    readDouble: function(offset) {
        return this.buffer.readDoubleBE(this.offset + offset);
    },
    readUint32: function(offset) {
        return this.buffer.readUInt32BE(this.offset + offset);
    },
    readUint64: function(offset) {
        var lo = this.buffer.readUInt32BE(this.offset + offset + 4, true),
            hi = this.buffer.readUInt32BE(this.offset + offset, true);
        return bson.Long.fromBits(lo, hi).toNumber();
    },
    readUint16: function(offset) {
        return this.buffer.readUInt16BE(this.offset + offset);
    },
    writeFloat: function(value, offset) {
        return this.buffer.writeFloatBE(value, this.offset + offset);
    },
    writeDouble: function(value, offset) {
        return this.buffer.writeDoubleBE(value, this.offset + offset);
    },
    writeUint32: function(value, offset) {
        return this.buffer.writeUInt32BE(value, this.offset + offset);
    },
    writeUint16: function(value, offset) {
        return this.buffer.writeUInt16BE(value, this.offset + offset);
    },
    writeUint64: function(value, offset) {
        var l = bson.Long.fromNumber(value),
            lo = l.getLowBits(),
            hi = l.getHighBits();
        this.buffer.writeUInt32BE(lo, this.offset + offset + 4, true);
        this.buffer.writeUInt32BE(hi, this.offset + offset, true);
    }
};



/** wrapper for node buffers */
/** */
function NodeBufferWrapper(buffer, offset, length, endianness) {
    
    assert.ok(buffer instanceof Buffer, 'invalid buffer');
    assert.ok(!offset || typeof offset === 'number', 'invalid offset');
    assert.ok(!length || typeof length === 'number', 'invalid length');
    
    this.buffer = buffer;
    this.offset = offset || 0;
    this.len = typeof length === 'number' ? length : this.buffer.length - this.offset;
    
    
    var impl = endianness === 'big-endian' ? bigEndianImpl : littleEndianImpl;
    Object.keys(impl).forEach(function(fnName) {
        this[fnName] = impl[fnName];
    }, this);
}

NodeBufferWrapper.prototype = {
    length: function() {
        return this.len;
    },
    grow: function(size) {
        var newBuffer = new Buffer(size);
        this.buffer.copy(newBuffer);
        this.buffer = newBuffer;
    },
    trim: function(size) {
        if(this.buffer.length === size) {
            return this.buffer;
        }
        var newBuffer = new Buffer(size);
        this.buffer.copy(newBuffer, 0, 0, size);
        return newBuffer;
    }
};

NodeBufferWrapper.createBuffer = function(size) {
    return new Buffer(size);
};




module.exports = NodeBufferWrapper;