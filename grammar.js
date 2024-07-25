/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const stanza = (name, field_parser) =>
  seq("(", name, repeat(field_parser), ")");
const dune_field = (name, value) => seq("(", name, value, ")");

module.exports = grammar({
  name: "dune",

  rules: {
    source_file: ($) => repeat($.stanza),
    sexp: ($) => choice($.atom, $.list),
    atom: ($) => /[a-zA-Z_%.:/{}\"|=\\,\-!#]+/,
    list: ($) => seq("(", repeat($.sexp), ")"),
    stanza: ($) => choice($.stanza_executable, $.stanza_rule, $.sexp),
    stanza_executable: ($) => stanza("executable", $._field_executable),
    _field_executable: ($) =>
      choice(
        $._field_executable_name,
        $._field_executable_public_name,
        $._field_executable_libraries,
      ),
    _field_executable_name: ($) => dune_field("name", $.module_name),
    _field_executable_public_name: ($) =>
      dune_field("public_name", $.public_name),
    _field_executable_libraries: ($) =>
      dune_field("libraries", repeat($.library_name)),
    library_name: ($) => alias($.atom, "library_name"),
    public_name: ($) => alias($.atom, "public_name"),
    module_name: ($) => alias($.atom, "module_name"),
    stanza_rule: ($) => stanza("rule", $.field_rule),
    field_rule: ($) =>
      choice(
        $.field_rule_mode,
        $.field_rule_target,
        $.field_rule_deps,
        $.field_rule_action,
        $.sexp,
      ),
    field_rule_mode: ($) => dune_field("mode", $.sexp),
    field_rule_target: ($) => dune_field("target", $.atom),
    field_rule_deps: ($) => dune_field("deps", $.sexp),
    field_rule_action: ($) => dune_field("action", $.action),
    action: ($) => $.sexp,
  },
});
