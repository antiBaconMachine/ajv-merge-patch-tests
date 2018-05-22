#! /usr/bin/env node
const test = require('tape');
const Ajv = require('ajv');
const mergePatch = require('ajv-merge-patch');

const ajv = new Ajv();
ajv.addMetaSchema(require('./node_modules/ajv/lib/refs/json-schema-draft-06.json'));
mergePatch(ajv);

const schema = [{
  $id: 'plain-string',
  type: 'string'
}, {
  $id: 'const-string',
  $merge: {
    source: {
      $ref: 'plain-string'
    },
    with: {
      const: 'foo'
    }
  }
},
{
  $id: 'required-properties',
  required: ['foo']
},
{
  $id: 'required-string',
  $merge: {
    source: {
      $ref: 'required-properties'
    },
    with: {
      properties: {
        foo: {
          type: 'string'
        }
      }
    }
  }
},
{
  $id: 'required-const',
  $merge: {
    source: {
      $ref: 'required-properties'
    },
    with: {
      properties: {
        foo: {
          $ref: 'const-string'
        }
      }
    }
  }
},
{
  $id: 'required-enum',
  $merge: {
    source: {
      $ref: 'required-const'
    },
    with: {
      properties: {
        foo: {
          const: null,
          enum: ['foo', 'bar']
        }
      }
    }
  }
}];

schema.forEach(s => ajv.addSchema(s, s.$id))

test('validates empty string', assert => {
  assert.plan(1)
  assert.ok(ajv.validate('plain-string', ''))
})

test('extends schema to add constant value', assert => {
  assert.plan(2);
  assert.notOk(ajv.validate('const-string', ''));
  assert.ok(ajv.validate('const-string', 'foo'));
})

test('validates required properties', assert => {
  assert.plan(2);
  assert.notOk(ajv.validate('required-properties', {}));
  assert.ok(ajv.validate('required-properties', {foo: 1}));
});

test('validates required string properties', assert => {
  assert.plan(2);
  assert.notOk(ajv.validate('required-string', {foo: 1}));
  assert.ok(ajv.validate('required-string', {foo: ''}));
});

test('validates derrived const properties', assert => {
  assert.plan(2);
  assert.notOk(ajv.validate('required-const', {foo: 1}));
  assert.ok(ajv.validate('required-const', {foo: 'foo'}));
});

test('validates derrived enum properties', assert => {
  assert.plan(3);
  assert.notOk(ajv.validate('required-enum', {foo: 1}));
  assert.ok(ajv.validate('required-enum', {foo: 'foo'}));
  assert.ok(ajv.validate('required-enum', {foo: 'bar'}));
});
