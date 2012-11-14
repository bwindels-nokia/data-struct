/*jshint evil: false, bitwise:false, strict: false, undef: true, white: false, plusplus:false, node:true */
/*global DataView, ArrayBuffer, Float32Array, Float64Array, Uint32Array, Uint16Array, Int8Array */

/** wrapper using typed array views, slower than dataview but since that is not supported by all browsers at this moment ... */
function TypedArrayBufferWrapper(arrayBuffer, offset, length) {
    this.offset = offset || 0;
    this.arrayBuffer = arrayBuffer;
    this.len = typeof length === 'number' ? length : arrayBuffer.byteLength - this.offset;
    //use native implementation if available
    if(typeof this.arrayBuffer.slice === 'function') {
        this._slice = this.arrayBuffer.slice.bind(this.arrayBuffer);
    }
}
//fallback implementation
TypedArrayBufferWrapper.prototype._slice = function(offset, end) {
    var length = end - offset;
    var sub = new ArrayBuffer(length);
    var subView = new Int8Array(sub);
    var thisView = new Int8Array(this.arrayBuffer);
    for(var i = 0; i < length; i++ ) {
        subView[i] = thisView[offset+i];
    }
    return sub;
};

TypedArrayBufferWrapper.prototype.readFloat = function(offset) {
    return new Float32Array(this._slice(offset + this.offset, offset + this.offset + 4))[0];
};

TypedArrayBufferWrapper.prototype.readDouble = function(offset) {
    return new Float64Array(this._slice(offset + this.offset, offset + this.offset + 8))[0];
};

TypedArrayBufferWrapper.prototype.readUint32 = function(offset) {
    return new Uint32Array(this._slice(offset + this.offset, offset + this.offset + 4))[0];
};

TypedArrayBufferWrapper.prototype.readUint16 = function(offset) {
    return new Uint16Array(this._slice(offset + this.offset, offset + this.offset + 2))[0];
};

TypedArrayBufferWrapper.prototype.writeFloat = function(value, offset) {
    throw new Error('writeFloat not supported for TypedArrayBufferWrapper');
};

TypedArrayBufferWrapper.prototype.writeDouble = function(value, offset) {
    throw new Error('writeDouble not supported for TypedArrayBufferWrapper');
};

TypedArrayBufferWrapper.prototype.writeUint32 = function(value, offset) {
    throw new Error('writeUint32 not supported for TypedArrayBufferWrapper');
};

TypedArrayBufferWrapper.prototype.writeUint16 = function(value, offset) {
    throw new Error('writeUint16 not supported for TypedArrayBufferWrapper');
};

TypedArrayBufferWrapper.prototype.length = function() {
    return this.len;
};

TypedArrayBufferWrapper.prototype.grow = function(size) {
    throw new Error('grow not supported on typed arrays');
};

TypedArrayBufferWrapper.createBuffer = function(size) {
    return new ArrayBuffer(size);
};

module.exports = TypedArrayBufferWrapper;