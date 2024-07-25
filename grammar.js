/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const stanza = (name, field) => seq("(", name, repeat(field), ")");
const field = (name, value) => seq("(", name, value, ")");

module.exports = grammar({
  name: "dune",

  rules: {
    source_file: ($) => repeat($.stanza),
    sexp: ($) => choice($.atom, $.list),
    atom: ($) => /[a-zA-Z_%.:/{}\"|=\\,\-!#]+/,
    list: ($) => seq("(", repeat($.sexp), ")"),
    stanza: ($) => choice($.stanza_executable, $.stanza_rule, $.sexp),
    stanza_executable: ($) => stanza("executable", $.field_executable),
    field_executable: ($) =>
      choice(
        $.field_executable_name,
        $.field_executable_public_name,
        $.field_executable_libraries,
      ),
    field_executable_name: ($) => field("name", $.atom),
    field_executable_public_name: ($) => field("public_name", $.atom),
    field_executable_libraries: ($) => field("libraries", repeat($.atom)),
    stanza_rule: ($) => stanza("rule", $.field_rule),
    field_rule: ($) =>
      choice(
        $.field_rule_mode,
        $.field_rule_target,
        $.field_rule_deps,
        $.field_rule_action,
        $.sexp,
      ),
    field_rule_mode: ($) => field("mode", $.sexp),
    field_rule_target: ($) => field("target", $.atom),
    field_rule_deps: ($) => field("deps", $.sexp),
    field_rule_action: ($) => field("action", $.action),
    action: ($) => $.sexp,
  },
});
