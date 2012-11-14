/*jshint evil: false, bitwise:false, strict: false, undef: true, white: false, node:true */
/*global console */

/* run with ./nodeunit/bin/nodeunit data-struct/test/test-struct.js */

var Struct = require('data-struct').Struct;
var StructArray = require('data-struct').StructArray;
var Wrapper = require('data-struct').BufferWrapper;

var testCase = require('nodeunit').testCase;

module.exports = testCase({
    "test read and writing some values from a struct" : function(test) {
        var struct = new Struct({
            age: Struct.uint16(),
            msAlive: Struct.uint32(),
            balance: Struct.float32(),
            moneySpentInEntireLife: Struct.float64(),
            timestamp: Struct.uint64()
        });
        
        var value = {
            age: 16,
            msAlive: 26586522,
            balance: 500.5,
            moneySpentInEntireLife: 65656.56,
            timestamp: 1325704080000
        };
        
        test.equal(struct.size, 26, 'size of struct should be 2 + 4 + 4 + 8 + 8 = 26');
        //test both endiannesses
        ['big-endian', 'little-endian'].forEach(function(endianness) {
            var buffer = new Wrapper(new Buffer(struct.size), 0, struct.size, endianness);
            struct.write(buffer, 0, value);
            var readValue = {};
            struct.read(buffer, 0, readValue);
            test.equal(Object.keys(value).join(','), Object.keys(readValue).join(','),
                'both the written and read object should have the same keys');
            test.equal(readValue.age, value.age,
                'age on the written and read object should be the same');
            test.equal(readValue.msAlive, value.msAlive,
                'msAlive on the written and read object should be the same');
            test.equal(readValue.balance, value.balance,
                'balance on the written and read object should be the same');
            test.equal(readValue.moneySpentInEntireLife, value.moneySpentInEntireLife,
                'moneySpentInEntireLife on the written and read object should be the same');
            test.equal(readValue.timestamp, value.timestamp,
                'timestamp on the written and read object should be the same');
            test.equal(Object.keys(readValue).join(','), struct.fieldNames.join(','),
                'the order of the fields in the read value should be the same as the field names in the struct');
        });
        test.done();
        
    },
    "test read and writing some structs from a struct array giving an initial size" : function(test) {
        var struct = new Struct({
            a: Struct.uint16(),
            b: Struct.uint32(),
            c: Struct.float32(),
            d: Struct.float64()
        });
        var value = {};
        var list = new StructArray(struct, 5, 1.5);
        for(var i = 1; i <= 6; ++i) {
            value.a = i + 2;
            value.b = i + 2323262;
            value.c = i + 3.141592;
            value.d = i + 56656565.56;
            list.append(value);
        }
        test.equal(list.length, 6, 'length of list should be number of appended items');
        test.equal(list.size, 7, 'the list should have grown to floor(7.5) == 7 while appending');
        
        var expectedValue = {}, readValue = {};
        
        for(i = 1; i <= 6; ++i) {
            expectedValue.a = i + 2;
            expectedValue.b = i + 2323262;
            expectedValue.c = i + 3.141592;
            expectedValue.d = i + 56656565.56;
            
            list.read(i - 1, readValue);
            test.equal(readValue.a, expectedValue.a, 'a on the written and read object should be the same');
            test.equal(readValue.b, expectedValue.b, 'b on the written and read object should be the same');
            test.ok(Math.abs(readValue.c - expectedValue.c) < 0.0001, 'c on the written and read object should be the same');
            test.ok(Math.abs(readValue.d - expectedValue.d) < 0.0001, 'd on the written and read object should be the same');
        }
        test.done();
    },
    "test passing an offset to BufferWrapper constructor" : function(test) {
        var struct = new Struct({
            age: Struct.uint16(),
            msAlive: Struct.uint32(),
            balance: Struct.float32(),
            moneySpentInEntireLife: Struct.float64()
        });
        
        var value = {
            age: 16,
            msAlive: 26586522,
            balance: 500.5,
            moneySpentInEntireLife: 65656.56
        };
        
        var buffer = new Buffer(struct.size * 2);
        var view = new Wrapper(buffer, struct.size);
        var list = new StructArray(struct, view);
        list.write(0, value);
        
        list = new StructArray(struct, new Wrapper(buffer));
        var readValue = {};
        list.read(1, readValue);
        
        test.equal(Object.keys(value).join(','), Object.keys(readValue).join(','), 'both the written and read object should have the same keys');
        test.equal(readValue.age, value.age, 'age on the written and read object should be the same');
        test.equal(readValue.msAlive, value.msAlive, 'msAlive on the written and read object should be the same');
        test.equal(readValue.balance, value.balance, 'balance on the written and read object should be the same');
        test.equal(readValue.moneySpentInEntireLife, value.moneySpentInEntireLife, 'moneySpentInEntireLife on the written and read object should be the same');
        test.done();
    },
    "test copy, addFields and replaceFields": function(test) {
        var structA = new Struct({
            age: Struct.uint16(),
            msAlive: Struct.uint32(),
            balance: Struct.float32(),
            moneySpentInEntireLife: Struct.float64()
        });
        var structB = structA.copy();
        structB.replaceFields({
            balance: Struct.uint16()
        });
        
        test.equal(structA.fields.balance.size, 4, 'structA should not be modified');
        test.equal(structB.fields.balance.size, 2, 'structB should be modified');
        
        test.equal(structA.size, 2 + 4 + 4 + 8, 'structA.size should not be modified');
        test.equal(structB.size, 2 + 4 + 2 + 8, 'structB.size should be modified');
        
        structB.addFields({
            postalCode: Struct.uint16(),
            socialSecurityNumber: Struct.uint32()
        });
        
        test.equal(Object.keys(structA.fields).length, 4, 'structA.fields should not be modified');
        test.equal(Object.keys(structB.fields).length, 6, 'structB.fields should be modified');
        
        test.equal(structA.size, 2 + 4 + 4 + 8, 'structA.size should not be modified after adding field');
        test.equal(structB.size, 2 + 4 + 2 + 8 + 2 + 4, 'structB.size should be modified after adding field');
        
        test.equal(structB.fieldNames[4], 'postalCode', 'structB.fields.postalCode should be the field before the last one');
        test.equal(structB.fieldNames[5], 'socialSecurityNumber', 'structB.fields.postalCode should be the last field');
        
        test.done();
    },
    "test StructArray.forEach": function(test) {
        test.expect(10);
        var struct = new Struct({
            a: Struct.uint32(),
            b: Struct.uint64()
        });
        var list = new StructArray(struct, 5);
        var values = [{a: 1, b: 123}, {a: 565, b: 15}, {a: 4, b: 47}, {a: 2388, b: 23567}, {a: 4788, b: 5498}];
        values.forEach(function(v) {
            list.append(v);
        });
        
        var i = 0;
        list.forEach(function(v) {
            test.equal(v.a, values[i].a, 'a values should be equal for index ' + i);
            test.equal(v.b, values[i].b, 'b values should be equal for index ' + i);
            ++i;
        });
        test.done();
    },
    "test calculating length of list by passing a BufferWrapper with given length": function(test) {
        test.expect(4);
        var struct = new Struct({
            b: Struct.uint64()
        });
        var values = [{b: 5698}, {b: 236}, {b: 6559}];
        var fillList = new StructArray(struct, values.length);
        values.forEach(fillList.append.bind(fillList));
        var buffer = fillList.toBuffer();
        test.equal(buffer.length, struct.size * values.length, 'buffer length incorrect');
        
        var wrapper = new Wrapper(buffer, 1 * struct.size, 2 * struct.size);
        var list = new StructArray(struct, wrapper);
        test.equal(list.length, 2, 'list length should be 2');
        
        //we skip the first element because we skipped it giving an offset to the BufferWrapper
        var i = 1;
        list.forEach(function(v) {
            test.equal(v.b, values[i].b, 'b values should be equal for element ' + i);
            ++i;
        });
        test.done();
    },
    "test not giving a correct object to Struct.write fails": function(test) {
        var struct = new Struct({
            b: Struct.uint64()
        });
        var buffer = new Buffer(struct.size);
        var wrapper = new Wrapper(buffer);
        test.throws(function() {
            struct.write(wrapper, 0, 689);
        }, 'struct.write should throw an error when passed an non-object as the value');
        test.throws(function() {
            struct.write(wrapper, 0, {c: 4454});
        }, 'struct.write should throw an error when passed a incorrectly formatted object');
        
        test.done();
    }
});


