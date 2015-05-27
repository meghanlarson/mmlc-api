/**
* MathMapCategory.js
*
* @description :: Math map categories and the math map they belong to.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    mathMap: {
        type: 'string',
        required: true,
        enum: ['functions', 'units', 'symbols']
    },
    category: {
        type: 'string'
    },
    rules: {
        collection: 'Rule',
        via: 'mathMapCategory'
    }
  }

};

