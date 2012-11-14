/*jshint evil: false, bitwise:false, strict: false, undef: true, white: false, plusplus:false, node:true */
/*global window */

/** Buffer Wrapper, endianess is little endian by default */

//require dom-buffer in the browser, node-buffer in node
var BufferWrapper = require('./node-buffer', './dom-buffer');

/** class to represent a c-like struct, requires node >= v0.6!
    @param [object] fields an object with a type given for each key. A type is generated with the Struct.<type> functions. */
function Struct(fields) {
    this.fields = fields;
    this.fieldNames = Object.keys(fields);
    this.size = this.fieldNames.reduce(function(memo, fieldName) {
        return fields[fieldName].size + memo;
    }, 0);
}

Struct.prototype = {
    /** read the fields of this struct from the given buffer into the object value */
    read: function(buffer, offset, value) {
        var type;
        this.fieldNames.forEach(function(fieldName) {
            type = this.fields[fieldName];
            var readFn = buffer[type.read];            
            value[fieldName] = readFn.call(buffer, offset);
            offset += type.size;
        }, this);
    },
    /** read the fields of this struct to the given buffer from value */
    write: function(buffer, offset, value) {
        if(typeof value !== 'object') {
            throw new Error('value should be an object');
        }
        var type;
        this.fieldNames.forEach(function(fieldName) {
            type = this.fields[fieldName];
            var writeFn = buffer[type.write];
            if(!writeFn) {
                throw new Error('could not find function ' + type.write + ' on buffer object of field name ' + fieldName);
            }
            if(typeof value[fieldName] === 'undefined') {
                throw new Error('field ' + fieldName + ' is missing in value object');
            }
            
            writeFn.call(buffer, value[fieldName], offset);
            offset += type.size;
        }, this);
    },
    copy: function() {
        var fields = {};
        this.fieldNames.forEach(function(fieldName) {
            fields[fieldName] = this.fields[fieldName];
        }, this);
        return new Struct(fields);
    },
    addFields: function(fields) {
        var self = this;
        var fieldNames = Object.keys(fields);
        this.size = fieldNames.reduce(function(totalSize, fieldName) {
            var newSize = fields[fieldName].size;
            if(typeof self.fields[fieldName] !== 'undefined') {
                throw new Error('cannot add field ' + fieldName + ' since it already exists');
            }
            self.fields[fieldName] = fields[fieldName];
            return totalSize + newSize;
        }, this.size);
        this.fieldNames = Object.keys(this.fields);
        return this;
    },
    replaceFields: function(fields) {
        var self = this;
        var fieldNames = Object.keys(fields);
        this.size = fieldNames.reduce(function(totalSize, fieldName) {
            var oldType = self.fields[fieldName];
            if(typeof oldType === 'undefined') {
                throw new Error('could not find field name ' + fieldName + ' to replace');
            }
            var oldSize = oldType.size;
            var newSize = fields[fieldName].size;
            self.fields[fieldName] = fields[fieldName];
            return totalSize - oldSize + newSize;
        }, this.size);
        this.fieldNames = Object.keys(this.fields);
        return this;
    }
};

Struct.float32 = function() {
    return {
        read: 'readFloat',
        write: 'writeFloat',
        size: 4
    };
};

Struct.float64 = function() {
    return {
        read: 'readDouble',
        write: 'writeDouble',
        size: 8
    };
};

Struct.uint32 = function() {
    return {
        read: 'readUint32',
        write: 'writeUint32',
        size: 4
    };
};

Struct.uint16 = function() {
    return {
        read: 'readUint16',
        write: 'writeUint16',
        size: 2
    };
};

Struct.uint64 = function() {
    return {
        read: 'readUint64',
        write: 'writeUint64',
        size: 8
    };
};

/** a growable list of structs, stored in a buffer for speed. */
function StructArray(struct, initialSizeOrBuffer, growFactor) {
    this.struct = struct;
    //length is the amount of structs stored,
    //size is the amount of structs we have space allocated for
    if(typeof initialSizeOrBuffer === 'object') {
        this.buffer = initialSizeOrBuffer;
        this.size = Math.floor(this.buffer.length() / struct.size);
        this.length = this.size;
    } else {
        this.buffer = new BufferWrapper(BufferWrapper.createBuffer(initialSizeOrBuffer * struct.size));
        this.length = 0;
        this.size = initialSizeOrBuffer;
    }
    this.growFactor = growFactor || 1.5;
}

StructArray.prototype = {
    /** append an object with the values for the struct this list is linked to. Grows the list with growFactor if needed */
    append: function(value) {
        if(this.size <= this.length) {
            this.grow(Math.floor(this.size * this.growFactor));
        }
        this.struct.write(this.buffer, this.length * this.struct.size, value);
        ++this.length;
    },
    /** random write access, does not expand the list so don't write beyond length */
    write: function(i, value) {
        this.struct.write(this.buffer, i * this.struct.size, value);
    },
    /** grow the list to the given size */
    grow: function(size) {
        if(this.size >= size) {
            return;
        }
        this.buffer.grow(size * this.struct.size);
        this.size = size;
    },
    /** random read access, does not do bound checking */
    read: function(i, value) {
        this.struct.read(this.buffer, i * this.struct.size, value);
    },
    forEach: function(fn, thisArg) {
        thisArg = thisArg || null;
        var readValue = {};
        for(var i = 0; i < this.length; ++i) {
            this.read(i, readValue);
            fn.call(thisArg, readValue, i);
        }
    },
    /** only supported on nodejs */
    toBuffer: function() {
        return this.buffer.trim(this.length * this.struct.size);
    }
};

module.exports = {
    Struct: Struct,
    StructArray: StructArray,
    BufferWrapper: BufferWrapper
};