'use strict';

var assert = require('assert')
  , _ = require('lodash')
  , untyped = require('../lib/index');

function multitest(tests, should, actual) {
    _.each(_.pairs(tests), function(test) {
         it('should ' + should(test), function() {
             assert.equal(test[0], actual(test[1]));
         });
    });
}

describe('untyped', function() {
    describe('#parse(fields)', function() {
        multitest({
            '{}': '',
            '{"id":true,"snippet":true}': 'id,snippet',
            '{"id":true,"snippet":{"title":true,"name":true}}': 'id,snippet:(title,name)',
            '{"foo":{"bar":{"baz":{"goo":{"gle":{"is":{"no":{"evil":true}}}}}}}}': 'foo:(bar:(baz:(goo:(gle:(is:(no:(evil)))))))',
            '{"foo":{"goo":true,"gle":true},"bar":{"is":true,"no":true},"baz":{"evil":true,"thing":true}}': 'foo:(goo,gle),bar:(is,no),baz:(evil,thing)'
        }, function(test) {
            return 'parse ' + test[0] + ' from ' + test[1];
        }, function(input) {
            return JSON.stringify(untyped.parse(input));
        });
    });
    
    describe('#stringify(schema)', function() {
        multitest({
            '': {},
            'id,snippet': {id:true, snippet:true},
            'id,snippet:(title,name)': {id:true, snippet:{title:true, name:true}},
            'foo:(bar,baz:(goo,gle)),hoo:(ray)': {foo:{bar:true, baz:{goo:true, gle:true}}, hoo:{ray: true}}
        }, function(test) {
            return 'create "' + test[0] + '" for ' + JSON.stringify(test[1]);
        }, function(input) {
            return untyped.stringify(input);
        });
    });
    
    describe('#validate(doc,schema)', function() {
        multitest({
            '{}': {
                doc: {},
                schema: {}
            },
            '{"id":5,"snippet":"foo"}': {
                doc: {id: 5, snippet: 'foo', title: 'bar'},
                schema: {id:true, snippet:true}
            },
            '{"id":5,"snippet":"foo","name":{"firstname":"foo","lastname":"bar"}}': {
                doc: {id: 5, snippet: 'foo', name: {firstname: 'foo', lastname: 'bar'}, glob: 'al', sh: {it: true}},
                schema: {id:true, snippet:true, name: {firstname:true, lastname:true}}
            },
            '{"id":5,"history":[{"timestamp":"0815","event":"none"},{"timestamp":"1337","event":"all"}]}': {
                doc: {id: 5, history: [{timestamp: '0815', event: 'none'}, {timestamp: '1337', event: 'all'}]},
                schema: {id:true, history: {timestamp:true, event:true}}
            }
        }, function(test) {
            return 'return ' + test[0] + ' when validating ' + JSON.stringify(test[1].doc) + ' against ' + untyped.stringify(test[1].schema);
        }, function(input) {
            return JSON.stringify(untyped.validate(input.doc, input.schema));
        });
    });
    
    describe('#matches(doc,filter)', function() {
        it('should treat = as exact match', function() {
            var matching = {name: 'foo'}
              , notMatching = {name: 'bar'}
              , filter = {property: 'name', match: '=', filter: 'foo'};
            
            assert.ok(untyped.matches(matching, filter));
            assert.ok(!untyped.matches(notMatching, filter));
        });
        
        it('should treat ~= as one of match', function() {
            var matching = {name: 'foo'}
              , alsoMatching = {name: 'bar'}
              , notMatching = {name: 'baz'}
              , filter = {property: 'name', match: '~', filter: 'foo,bar'};
            
            assert.ok(untyped.matches(matching, filter));
            assert.ok(untyped.matches(alsoMatching, filter));
            assert.ok(!untyped.matches(notMatching, filter));
        });
        
        it('should treat |= as exact/startswith match', function() {
            var matching = {name: 'foo'}
              , alsoMatching = {name: 'foo-bar'}
              , notMatching = {name: 'bar'}
              , filter = {property: 'name', match: '|', filter: 'foo'};
            
            assert.ok(untyped.matches(matching, filter));
            assert.ok(untyped.matches(alsoMatching, filter));
            assert.ok(!untyped.matches(notMatching, filter));
        });
        
        it('should treat *= as contains match', function() {
            var matching = {name: 'foobar'}
              , alsoMatching = {name: 'foobarbaz'}
              , notMatching = {name: 'googargaz'}
              , filter = {property: 'name', match: '*', filter: 'bar'};
            
            assert.ok(untyped.matches(matching, filter));
            assert.ok(untyped.matches(alsoMatching, filter));
            assert.ok(!untyped.matches(notMatching, filter));
        });
        
        it('should treat ^= as startswith match', function() {
            var matching = {name: 'foo'}
              , alsoMatching = {name: 'furz'}
              , notMatching = {name: 'goo'}
              , filter = {property: 'name', match: '^', filter: 'f'};
            
            assert.ok(untyped.matches(matching, filter));
            assert.ok(untyped.matches(alsoMatching, filter));
            assert.ok(!untyped.matches(notMatching, filter));
        });
        
        it('should treat $= as endswith match', function() {
            var matching = {name: 'foobar'}
              , alsoMatching = {name: 'barbar'}
              , notMatching = {name: 'foo'}
              , filter = {property: 'name', match: '$', filter: 'bar'};
            
            assert.ok(untyped.matches(matching, filter));
            assert.ok(untyped.matches(alsoMatching, filter));
            assert.ok(!untyped.matches(notMatching, filter));
        });

        it('should default to false if match is none of =~|*$', function() {
            var filter = {property: 'name', match: 'x', filter: 'bar'};

            assert.ok(!untyped.matches({name: 'bar'}, filter));
            assert.ok(!untyped.matches({}, filter));
        });
    });
    
    describe('#filter(docs,filters)', function() {
        it('should apply simple filters to all docs', function() {
            var docs = [{name: 'foo'}, {name: 'bar'}]
              , filters = [{property: 'name', match: '=', filter: 'foo'}];
            
            assert.deepEqual([{name: 'foo'}], untyped.filter(docs, filters));
        });
        
        it('should apply nested filters to all docs', function() {
            var docs = [{name: {firstname: 'foo', lastname: 'bar'}}, {name: {firstname: 'goo', lastname: 'gle'}}]
              , filters = [{property: 'name:(firstname)', match: '=', filter: 'foo'}];
            
            assert.deepEqual([{name: {firstname: 'foo', lastname: 'bar'}}], untyped.filter(docs, filters));
        });
        
        it('should apply multiple filters AND-connected to all docs', function() {
            var docs = [{name: {firstname: 'foo', lastname: 'bar'}}, {name: {firstname: 'foo', lastname: 'gle'}}]
              , filters = [{property: 'name:(firstname)', match: '=', filter: 'foo'},
                           {property: 'name:(lastname)', match: '=', filter: 'bar'}];
            
            assert.deepEqual([{name: {firstname: 'foo', lastname: 'bar'}}], untyped.filter(docs, filters));
        });

        it('should leave all docs untouched if no filters are specified', function() {
            var docs = [{name: {firstname: 'foo', lastname: 'bar'}}, {name: {firstname: 'goo', lastname: 'gle'}}];

            assert.deepEqual(docs, untyped.filter(docs));
        });
    });
});