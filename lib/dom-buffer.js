var dataViewSupported = typeof DataView === 'function';
module.exports = dataViewSupported ?
    require('./dataview-buffer') :
    require('./typedarray-buffer');