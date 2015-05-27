/**
 * RuleSetImportController
 *
 * @description :: Import rulesets from the speech-rule-engine.
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
 var waterfall = require('async-waterfall');
var mathmaps = ["functions", "symbols", "units"];
module.exports = {

    /** Read json rulesets from the speech-rule-engine and import as default rulesets. */
    import: function(req, res) {
        for (var m = 0; m < mathmaps.length; m++) {
            RuleSetImportService.importMathMap(mathmaps[m]);
        }
        return res.json("Importing...");
    },

    previewExport: function(req, res) {

        //TODO
    }
};

