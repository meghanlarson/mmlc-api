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
        async.each(rulesets, function(name, callback) {
            RuleSet.findOrCreate({name: name, status: "Live", permission: "Public"}).then(function(ruleset) {
                console.log(ruleset.name);
                console.log(mappings);
                //Create Mappings.
                RuleSetImportExportService.importMappings(rule, ruleset, mappings[ruleset.name]);
                return callback();
            }).catch(function(err) {
                console.log(err);
            });
        }, function(err) {
            if (err) console.log(err);
        });
    },

    importMappings: function(rule, ruleset, mappings) {
        var styles = Object.keys(mappings);
        //Create the mappings and attach to the rule.
        async.each(styles, function(style, callback) {
            Mapping.findOrCreate({
                rule: rule, 
                ruleSet: ruleset, 
                style: style
            }).then(function(mapping) {
                //Update the style.
                Mapping.update({id: mapping.id}, {speak: mappings[mapping.style]}).then(function(updated) {
                    return callback();
                }).catch(function(err) {
                    console.log(err);
                });
            }).catch(function(err) {
                console.log(err);
            });  
        }, function(err) {
            if (err) console.log(err);
        });
    },

    getMathMapDirectories: function(pathToMathMaps) {
        return fs.readdirSync(pathToMathMaps).filter(function(file) {
            return fs.statSync(path.join(pathToMathMaps, file)).isDirectory();
        });
    },

    exportMathMaps: function(pathToMathMaps) {
        //Load up all the mathmaps.
        MathMap.find().populate("mathMapCategories").then(function(mathMaps) {
            mathMaps.forEach(function(mathMap) {
                mathMap.mathMapCategories.forEach(function(mathMapCategory) {
                    RuleSetImportExportService.exportMathMapCategory(pathToMathMaps, mathMap, mathMapCategory);
                });
            });
        });
    },

    exportMathMapCategory: function(pathToMathMaps, mathMap, mathMapCategory) {
        //Load up the rules and export to the file. 
        Rule.find({mathMapCategory: mathMapCategory.id}).then(function(rules) {
            RuleSetImportExportService.writeMathMapCategory(pathToMathMaps, mathMap, mathMapCategory, rules);
        });
    },

    writeMathMapCategory: function(pathToMathMaps, mathMap, mathMapCategory, rules) {
        var exportJson = [];
        async.map(rules, function(rule, callback) {
            RuleSetImportExportService.buildRule(rule, function(exportRule) {
                return callback(null, exportRule);
            });
        }, function(err, results) {
            if (err) console.log(err);
            var forFile = JSON.stringify(results, null, 4); 
            fs.writeFile(pathToMathMaps + mathMap.name + "/" + mathMapCategory.category + ".json", forFile, function (err) {
              if (err) throw err;
              console.log('It\'s saved!');
            });
        });
    },

    buildRule: function(rule, done) {
        //Load up mappings.
        var exportRule = {
            "category": rule.category,
            "key": rule.key
        };
        if (rule.names != null) {
            exportRule.names = rule.names;
        }
        Mapping.find({rule: rule.id}).populate("ruleSet").then(function(mappings) {
            exportRule.mappings = {};
            async.each(mappings, function(mapping, callback) {
                if (typeof(exportRule.mappings[mapping.ruleSet.name]) === "undefined") exportRule.mappings[mapping.ruleSet.name] = {};
                exportRule.mappings[mapping.ruleSet.name][mapping.style] = mapping.speak;
                return callback();
            }, function(err) {
                if (err) console.log(err);
                return done(exportRule);
            });
        });
    }

};