/*jshint evil: false, bitwise:false, strict: false, undef: true, white: false, plusplus:false, node:true */
/*global DataView, ArrayBuffer, Float32Array, Float64Array, Uint32Array, Uint16Array, Int8Array */

/** wrapper for a typed array data view */
function DataViewBufferWrapper(arrayBuffer, offset, length) {
    offset = offset || 0;
    this.dataView = new DataView(arrayBuffer, offset);
    this.len = typeof length === 'number' ? length : arrayBuffer.byteLength - offset;
}

DataViewBufferWrapper.prototype.readFloat = function(offset) {
    return this.dataView.getFloat32(offset, true);
};

DataViewBufferWrapper.prototype.readDouble = function(offset) {
    return this.dataView.getFloat64(offset, true);
};

DataViewBufferWrapper.prototype.readUint32 = function(offset) {
    return this.dataView.getUint32(offset, true);
};

DataViewBufferWrapper.prototype.readUint16 = function(offset) {
    return this.dataView.getUint16(offset, true);
};

DataViewBufferWrapper.prototype.writeFloat = function(value, offset) {
    return this.dataView.setFloat32(offset, value, true);
};

DataViewBufferWrapper.prototype.writeDouble = function(value, offset) {
    return this.dataView.setFloat64(offset, value, true);
};

DataViewBufferWrapper.prototype.writeUint32 = function(value, offset) {
    return this.dataView.setInt32(offset, value, true);
};

DataViewBufferWrapper.prototype.writeUint16 = function(value, offset) {
    return this.dataView.setInt16(offset, value, true);
};

DataViewBufferWrapper.prototype.length = function() {
    return this.len;
};

DataViewBufferWrapper.prototype.grow = function(size) {
    throw new Error('grow not supported on typed arrays');
};

DataViewBufferWrapper.createBuffer = function(size) {
    return new ArrayBuffer(size);
};


module.exports = DataViewBufferWrapper;