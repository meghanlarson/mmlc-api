var waterfall = require('async-waterfall'); 
var fs = require('fs'); 
module.exports = {

    importMathMap: function(mathMap) {
        var pathToLib = "node_modules/MathJax-node/node_modules/speech-rule-engine/lib/";
        var pathToSubdir = pathToLib + mathMap;
        var files = fs.readdirSync(pathToSubdir);
        for (var f = 0; f < files.length; f++) {
            RuleSetImportService.importMathMapCategory(mathMap, files[f], pathToSubdir);
        }
    },

    importMathMapCategory: function(mathMap, mathMapCategory, pathToSubdir) {
        //First find or create the category.
        var category = mathMapCategory.substr(0, mathMapCategory.indexOf('.')); 
        MathMapCategory.findOrCreate({mathMap: mathMap, category: category}).then(function(dbMathMapCategory) {
            var mathTypeRules = JSON.parse(fs.readFileSync(pathToSubdir + "/" + mathMapCategory, 'utf8'));
            for (var i = 0; i < mathTypeRules.length; i++) {
                var rule = mathTypeRules[i];
                RuleSetImportService.importRule(mathMap, dbMathMapCategory, rule);
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
            RuleSetImportService.importRulesets(dbRule, rule.mappings);
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
                RuleSetImportService.importMappings(rule, ruleset, mappings[name]);
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
    }

};