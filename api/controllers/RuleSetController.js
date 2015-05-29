/**
 * RuleSetImportController
 *
 * @description :: Import rulesets from the speech-rule-engine.
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var waterfall = require('async');
var pathToMathMaps = "node_modules/MathJax-node/node_modules/speech-rule-engine/lib/";
module.exports = {

    create: function(req, res) {

    },

    /** Read json rulesets from the speech-rule-engine and import as default rulesets. */
    import: function(req, res) {
        var mathmaps = RuleSetImportExporter.getMathMapDirectories(pathToMathMaps);
        for (var m = 0; m < mathmaps.length; m++) {
            MathMap.findOrCreate({name: mathmaps[m]}).then(function(mathmap) {
                RuleSetImportExporter.importMathMap(pathToMathMaps + mathmap.name, mathmap);
            });
        }
        return res.json("Importing...");
    },

    previewExport: function(req, res) {
        MathMap.find().then(function(mathmaps) {
            async.map(mathmaps, 
                function(mathmap, callback) {
                    MathMapCategory.find({mathMap: mathmap.id}).populate("rules").then(function(categories) {
                        mathmap.categories = categories;
                        return callback(null, mathmap);
                    });
                }, 
                function(err, results){
                    return res.json(results);
                }
            );
        }).catch(function(err) {
            return res.badRequest(err);
        });
    },

    export: function(req, res) {
        RuleSetImportExporter.exportMathMaps(pathToMathMaps);
        return res.json("Exporting...");
    }
};

