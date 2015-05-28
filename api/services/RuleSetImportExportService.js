var waterfall = require('async-waterfall'), fs = require('fs'), path = require('path');
/**
* Service methods for importing and exporting mathmaps from the speech-rule-engine.
*/ 
module.exports = {

    importMathMap: function(pathToMathMap, mathMap) {
        var files = fs.readdirSync(pathToMathMap);
        for (var f = 0; f < files.length; f++) {
            RuleSetImportExportService.importMathMapCategory(mathMap, files[f], pathToMathMap);
        }
    },

    importMathMapCategory: function(mathMap, mathMapCategory, pathToMathMap) {
        //First find or create the category.
        var category = mathMapCategory.substr(0, mathMapCategory.indexOf('.')); 
        MathMapCategory.findOrCreate({mathMap: mathMap, category: category}).then(function(dbMathMapCategory) {
            var mathTypeRules = JSON.parse(fs.readFileSync(pathToMathMap + "/" + mathMapCategory, 'utf8'));
            for (var i = 0; i < mathTypeRules.length; i++) {
                var rule = mathTypeRules[i];
                RuleSetImportExportService.importRule(mathMap, dbMathMapCategory, rule);
            }
        }).catch(function(err) {
            console.log(err);
        });
        
    },

    importRule: function(mathMap, mathMapCategory, rule) {
        //Create rule.
        Rule.findOrCreate({
            category: rule.category,
            key: rule.key,
            names: rule.names,
            mathMapCategory: mathMapCategory
        }).then(function(dbRule) {
            //Create Mappings.
            RuleSetImportExportService.importRulesets(dbRule, rule.mappings);
        }).catch(function(err) {
            console.log(err);
        });
    },

    importRulesets: function(rule, mappings) {
        var rulesets = Object.keys(mappings);
        for (var r = 0; r < rulesets.length; r++) {
            var name = rulesets[r];
            RuleSet.findOrCreate({name: name, status: "Live", permission: "Public"}).then(function(ruleset) {
                //Create Mappings.
                RuleSetImportExportService.importMappings(rule, ruleset, mappings[name]);
            }).catch(function(err) {
                console.log(err);
            });
        }
    },

    importMappings: function(rule, ruleset, mappings) {
        var styles = Object.keys(mappings);
        //Create the mappings and attach to the rule.
        for (var s = 0; s < styles.length; s++) {
            var style = styles[s];
            Mapping.findOrCreate({
                rule: rule, 
                ruleSet: ruleset, 
                style: style
            }).then(function(mapping) {
                //Update the style.
                Mapping.update({id: mapping.id, speak: mappings[style]}).catch(function(err) {
                    console.log(err);
                });
            }).catch(function(err) {
                console.log(err);
            });   
        }
    },

    getMathMapDirectories: function(pathToMathMaps) {
        return fs.readdirSync(pathToMathMaps).filter(function(file) {
            return fs.statSync(path.join(pathToMathMaps, file)).isDirectory();
        });
    },

    exportMathMaps: function() {
        
    }

};